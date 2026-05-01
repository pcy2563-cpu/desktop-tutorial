import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { XIAOMI_MIMO_MODEL_ID, XIAOMI_TOKEN_PLAN_ENDPOINT } from "@/config/ai";

export const AUTH_COOKIE_NAME = "magic_resume_session";

type UserRole = "admin" | "user";

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

interface StoredUser extends PublicUser {
  passwordHash: string;
  passwordSalt: string;
}

interface StoredSession {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredInvite {
  code: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

interface StoredAIConfig {
  provider: "xiaomi-token-plan";
  apiKey: string;
  endpoint: string;
  model: string;
  updatedAt?: string;
}

interface PlatformStore {
  users: StoredUser[];
  sessions: StoredSession[];
  invites: StoredInvite[];
  aiConfig: StoredAIConfig;
}

const STORE_PATH = resolve(
  process.env.MAGIC_RESUME_DATA_DIR || resolve(process.cwd(), ".data"),
  "platform.json"
);
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;
const MAX_USERNAME_LENGTH = 32;
const MAX_PASSWORD_LENGTH = 72;
const MAX_KEY_LENGTH = 500;

const nowIso = () => new Date().toISOString();

const defaultStore = (): PlatformStore => ({
  users: [],
  sessions: [],
  invites: [],
  aiConfig: {
    provider: "xiaomi-token-plan",
    apiKey: "",
    endpoint: XIAOMI_TOKEN_PLAN_ENDPOINT,
    model: XIAOMI_MIMO_MODEL_ID,
  },
});

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function makeId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function validateUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!normalized || normalized.length > MAX_USERNAME_LENGTH) return "";
  if (!/^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/.test(normalized)) return "";
  return normalized;
}

function validatePassword(password: string) {
  return typeof password === "string" && password.length >= 4 && password.length <= MAX_PASSWORD_LENGTH;
}

function normalizeStore(raw: Partial<PlatformStore>): PlatformStore {
  const store = defaultStore();
  return {
    users: Array.isArray(raw.users) ? raw.users : store.users,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : store.sessions,
    invites: Array.isArray(raw.invites) ? raw.invites : store.invites,
    aiConfig: {
      ...store.aiConfig,
      ...(raw.aiConfig || {}),
      provider: "xiaomi-token-plan",
    },
  };
}

async function readStore(): Promise<PlatformStore> {
  let store = defaultStore();
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    store = normalizeStore(JSON.parse(raw) as Partial<PlatformStore>);
  } catch {
    store = defaultStore();
  }

  const now = Date.now();
  let shouldWrite = false;
  const activeSessions = store.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
  if (activeSessions.length !== store.sessions.length) {
    store.sessions = activeSessions;
    shouldWrite = true;
  }

  const normalizedEndpoint = normalizeAIEndpoint(store.aiConfig.endpoint || XIAOMI_TOKEN_PLAN_ENDPOINT);
  if (normalizedEndpoint !== store.aiConfig.endpoint) {
    store.aiConfig.endpoint = normalizedEndpoint;
    shouldWrite = true;
  }

  if (store.aiConfig.model === "xiaomi-mimo") {
    store.aiConfig.model = XIAOMI_MIMO_MODEL_ID;
    shouldWrite = true;
  }

  if (shouldWrite) {
    await writeStore(store);
  }

  return store;
}

async function writeStore(store: PlatformStore) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf-8");
}

function parseCookieValues(request: Request, name: string) {
  const values: string[] = [];
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (!rawName) continue;
    if (rawName === name) {
      values.push(decodeURIComponent(rest.join("=")));
    }
  }
  return values;
}

export function buildSessionCookie(request: Request, token: string) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto") || "";
  const secure = url.protocol === "https:" || forwardedProto.includes("https");
  const hostname = url.hostname.toLowerCase();
  const domain =
    hostname === "qianxian.site" || hostname.endsWith(".qianxian.site")
      ? "Domain=.qianxian.site"
      : "";
  return [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    domain,
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function buildClearSessionCookie(request?: Request) {
  const hostname = request ? new URL(request.url).hostname.toLowerCase() : "";
  const domain =
    hostname === "qianxian.site" || hostname.endsWith(".qianxian.site")
      ? "Domain=.qianxian.site"
      : "";
  return [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    domain,
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ].filter(Boolean).join("; ");
}

export async function getCurrentUser(request: Request): Promise<PublicUser | null> {
  const tokens = parseCookieValues(request, AUTH_COOKIE_NAME);
  if (tokens.length === 0) return null;

  const store = await readStore();
  const tokenHashes = new Set(tokens.map((token) => hashToken(token)));
  const session = store.sessions.find((item) => tokenHashes.has(item.tokenHash));
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;

  const user = store.users.find((item) => item.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { user: null, response: Response.json({ error: "请先登录后再使用 AI 功能" }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function requireAdmin(request: Request) {
  const auth = await requireUser(request);
  if (auth.response) return auth;
  if (auth.user?.role !== "admin") {
    return { user: auth.user, response: Response.json({ error: "只有管理员可以操作 API 配置" }, { status: 403 }) };
  }
  return { user: auth.user, response: null };
}

export async function registerUser(input: { username: string; password: string; inviteCode: string }) {
  const username = validateUsername(input.username);
  if (!username) throw new Error("账号只能包含中文、英文、数字、下划线或短横线，长度不超过 32 位");
  if (!validatePassword(input.password)) throw new Error("密码长度需要在 4 到 72 位之间");

  const store = await readStore();
  if (store.users.some((user) => user.username === username)) {
    throw new Error("账号已存在");
  }

  const inviteCode = input.inviteCode.trim();
  const invite = store.invites.find((item) => item.active && item.code === inviteCode);
  if (!invite || invite.usedCount >= invite.maxUses) {
    throw new Error("邀请码无效或已用完");
  }

  const salt = randomBytes(16).toString("hex");
  const user: StoredUser = {
    id: makeId("usr"),
    username,
    role: "user",
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: nowIso(),
  };

  invite.usedCount += 1;
  store.users.push(user);
  await writeStore(store);
  return toPublicUser(user);
}

export async function loginUser(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput);
  const store = await readStore();
  const user = store.users.find((item) => item.username === username);
  if (!user || !safeEqual(user.passwordHash, hashPassword(password, user.passwordSalt))) {
    throw new Error("账号或密码不正确");
  }

  const token = randomBytes(32).toString("base64url");
  const session: StoredSession = {
    id: makeId("ses"),
    tokenHash: hashToken(token),
    userId: user.id,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
  };
  store.sessions.push(session);
  await writeStore(store);

  return { token, user: toPublicUser(user) };
}

export async function logoutUser(request: Request) {
  const tokens = parseCookieValues(request, AUTH_COOKIE_NAME);
  if (tokens.length === 0) return;
  const store = await readStore();
  const tokenHashes = new Set(tokens.map((token) => hashToken(token)));
  store.sessions = store.sessions.filter((item) => !tokenHashes.has(item.tokenHash));
  await writeStore(store);
}

export async function getPublicAIConfig() {
  const store = await readStore();
  const apiKey = store.aiConfig.apiKey || "";
  return {
    provider: store.aiConfig.provider,
    endpoint: store.aiConfig.endpoint,
    model: store.aiConfig.model,
    configured: Boolean(apiKey),
    keyPreview: apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "",
    keyFingerprint: apiKey ? createHash("sha256").update(apiKey).digest("hex").slice(0, 10) : "",
    updatedAt: store.aiConfig.updatedAt,
  };
}

export async function getServerAIConfig() {
  const store = await readStore();
  if (!store.aiConfig.apiKey) {
    throw new Error("管理员还没有配置小米 Token Plan API Key");
  }
  return store.aiConfig;
}

function normalizeAIEndpoint(endpoint: string) {
  const raw = endpoint.trim().replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    const shouldUseOfficialEndpoint =
      hostname === "token-plan-cn.xiaomimo.com" ||
      hostname === "token-plan-cn.xiaomimimo.com" ||
      hostname.endsWith(".xiaomimo.com");

    if (shouldUseOfficialEndpoint) {
      return XIAOMI_TOKEN_PLAN_ENDPOINT;
    }

    if (/\/chat\/completions$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/chat\/completions$/i, "") || "/v1";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return raw;
  }
}

export async function updateAIConfig(input: { apiKey?: string; endpoint?: string; model?: string }) {
  const store = await readStore();
  const endpoint = normalizeAIEndpoint(input.endpoint || store.aiConfig.endpoint || XIAOMI_TOKEN_PLAN_ENDPOINT);
  const model = (input.model || store.aiConfig.model || XIAOMI_MIMO_MODEL_ID).trim();
  const apiKey = input.apiKey?.trim();

  if (!endpoint.startsWith("https://") || endpoint.length > 300) {
    throw new Error("API 基础地址必须是 HTTPS 地址");
  }
  if (!model || model.length > 120) {
    throw new Error("模型 ID 不正确");
  }
  if (typeof apiKey === "string" && apiKey.length > 0 && apiKey.length > MAX_KEY_LENGTH) {
    throw new Error("API Key 过长");
  }

  store.aiConfig = {
    provider: "xiaomi-token-plan",
    apiKey: apiKey || store.aiConfig.apiKey,
    endpoint,
    model,
    updatedAt: nowIso(),
  };
  await writeStore(store);
  return getPublicAIConfig();
}

export async function listInvites() {
  const store = await readStore();
  return store.invites;
}

export async function createInvite(input: { code?: string; maxUses?: number }) {
  const store = await readStore();
  const code = (input.code?.trim() || `QX-${randomBytes(4).toString("hex").toUpperCase()}`).slice(0, 40);
  const maxUses = Math.max(1, Math.min(10000, Number(input.maxUses || 100)));
  if (store.invites.some((item) => item.code === code)) {
    throw new Error("邀请码已存在");
  }
  const invite: StoredInvite = {
    code,
    active: true,
    maxUses,
    usedCount: 0,
    createdAt: nowIso(),
  };
  store.invites.unshift(invite);
  await writeStore(store);
  return invite;
}
