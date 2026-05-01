export type AIModelType = "doubao" | "deepseek" | "openai" | "gemini";

export const XIAOMI_TOKEN_PLAN_ENDPOINT = "https://api.xiaomimimo.com/v1";
export const XIAOMI_MIMO_MODEL_ID = "mimo-v2-flash";

export interface AIValidationContext {
  doubaoApiKey?: string;
  doubaoModelId?: string;
  deepseekApiKey?: string;
  deepseekModelId?: string;
  openaiApiKey?: string;
  openaiModelId?: string;
  openaiApiEndpoint?: string;
  geminiApiKey?: string;
  geminiModelId?: string;
}

export interface AIModelConfig {
  url: (endpoint?: string) => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (context: AIValidationContext) => boolean;
}

const DEFAULT_OPENAI_ENDPOINT = XIAOMI_TOKEN_PLAN_ENDPOINT;
const BLOCKED_ENDPOINT_HOSTS = [
  "localhost",
  "127.",
  "10.",
  "192.168.",
  "169.254.",
  "0.",
  "::1",
];

function normalizeOpenAIEndpoint(endpoint?: string) {
  const raw = (endpoint || DEFAULT_OPENAI_ENDPOINT).trim().replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    const isPrivate172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
    const isBlocked = BLOCKED_ENDPOINT_HOSTS.some((item) => hostname === item || hostname.startsWith(item));
    if (url.protocol !== "https:" || isPrivate172 || isBlocked) {
      return DEFAULT_OPENAI_ENDPOINT;
    }
    const pathname = url.pathname
      .replace(/\/+$/, "")
      .replace(/\/chat\/completions$/i, "");
    return `${url.origin}${pathname || "/v1"}`;
  } catch {
    return DEFAULT_OPENAI_ENDPOINT;
  }
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  doubao: {
    url: () => "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!(context.doubaoApiKey && context.doubaoModelId),
  },
  deepseek: {
    url: () => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!context.deepseekApiKey,
  },
  openai: {
    url: (endpoint?: string) => `${normalizeOpenAIEndpoint(endpoint)}/chat/completions`,
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!(context.openaiApiKey && context.openaiModelId && context.openaiApiEndpoint),
  },
  gemini: {
    url: () => "https://generativelanguage.googleapis.com/v1beta",
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    }),
    validate: (context: AIValidationContext) => !!(context.geminiApiKey && context.geminiModelId),
  },
};
