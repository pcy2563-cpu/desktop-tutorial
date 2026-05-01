import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const dataDir = process.env.MAGIC_RESUME_DATA_DIR || resolve(process.cwd(), ".data");
const storePath = resolve(dataDir, "platform.json");
const adminUsername = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";
const inviteCode = (process.env.INVITE_CODE || `QX-${randomBytes(4).toString("hex").toUpperCase()}`).trim();
const inviteMaxUses = Math.max(1, Math.min(10000, Number(process.env.INVITE_MAX_USES || 100)));

if (!adminUsername || !adminPassword) {
  console.error("请先设置 ADMIN_USERNAME 和 ADMIN_PASSWORD 环境变量。");
  console.error("示例：ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password pnpm init:platform");
  process.exit(1);
}

function hashPassword(password, salt) {
  return pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

function makeId(prefix) {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

async function readStore() {
  try {
    return JSON.parse(await readFile(storePath, "utf-8"));
  } catch {
    return {
      users: [],
      sessions: [],
      invites: [],
      aiConfig: {
        provider: "xiaomi-token-plan",
        apiKey: "",
        endpoint: "https://api.xiaomimimo.com/v1",
        model: "mimo-v2-flash",
      },
    };
  }
}

const store = await readStore();
store.users = Array.isArray(store.users) ? store.users : [];
store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
store.invites = Array.isArray(store.invites) ? store.invites : [];

const now = new Date().toISOString();
let admin = store.users.find((user) => user.username === adminUsername);

if (!admin) {
  const salt = randomBytes(16).toString("hex");
  admin = {
    id: makeId("usr"),
    username: adminUsername,
    role: "admin",
    passwordSalt: salt,
    passwordHash: hashPassword(adminPassword, salt),
    createdAt: now,
  };
  store.users.unshift(admin);
} else {
  admin.role = "admin";
  const salt = randomBytes(16).toString("hex");
  admin.passwordSalt = salt;
  admin.passwordHash = hashPassword(adminPassword, salt);
}

if (!store.invites.some((item) => item.code === inviteCode)) {
  store.invites.unshift({
    code: inviteCode,
    active: true,
    maxUses: inviteMaxUses,
    usedCount: 0,
    createdAt: now,
  });
}

await mkdir(dirname(storePath), { recursive: true });
await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf-8");

console.log(`平台数据已初始化：${storePath}`);
console.log(`管理员账号：${adminUsername}`);
console.log(`邀请码：${inviteCode}`);
