import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { getServerAIConfig, requireUser } from "@/lib/server/platform";

const MAX_CONTENT_LENGTH = 12000;

const GRAMMAR_SYSTEM_PROMPT = `你是专业的中文简历校对助手。你的任务只检查错别字和明显标点错误。

规则：
1. 只返回 JSON，不要返回 Markdown、说明或总结。
2. 只检查错别字、重复标点、明显错误标点。
3. 不要做润色，不要改写表达，不要评价内容好坏。
4. 技术简历中英文标点混用、英文逗号、英文句点、中英文之间无空格都不要报错。
5. 如果没有错误，返回 {"errors":[]}。

JSON 格式：
{
  "errors": [
    {
      "context": "包含错误的原句",
      "text": "原文中具体错误片段",
      "suggestion": "修正后的词或标点",
      "reason": "错别字或标点错误",
      "type": "spelling"
    }
  ]
}`;

const parseUpstreamError = (raw: string, fallback: string) => {
  if (!raw) return { message: fallback };
  try {
    const data = JSON.parse(raw) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    return {
      message: data.error?.message || data.message || fallback,
      code: data.error?.code,
    };
  } catch {
    return { message: raw };
  }
};

const validateInput = (content?: string) => {
  if (!content || typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
    return "Invalid content";
  }
  return "";
};

const networkErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  const cause = error instanceof Error && "cause" in error ? String((error as Error & { cause?: unknown }).cause) : "";
  if (message.includes("fetch failed") || cause.includes("ENOTFOUND") || cause.includes("ECONNREFUSED")) {
    return "AI 接口地址无法访问，请到管理员入口检查 API 基础地址";
  }
  return "AI 纠错失败";
};

export const Route = createFileRoute("/api/grammar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        try {
          const body = await request.json();
          const { content } = body as { content?: string };
          const inputError = validateInput(content);
          if (inputError) {
            return Response.json({ error: inputError }, { status: 400 });
          }

          let serverConfig;
          try {
            serverConfig = await getServerAIConfig();
          } catch (error) {
            return Response.json(
              { error: error instanceof Error ? error.message : "AI 接口未配置" },
              { status: 503 }
            );
          }

          const modelConfig = AI_MODEL_CONFIGS.openai;
          const response = await fetch(modelConfig.url(serverConfig.endpoint), {
            method: "POST",
            headers: modelConfig.headers(serverConfig.apiKey),
            body: JSON.stringify({
              model: serverConfig.model,
              messages: [
                { role: "system", content: GRAMMAR_SYSTEM_PROMPT },
                { role: "user", content },
              ],
              temperature: 0,
            }),
          });

          const raw = await response.text();
          if (!response.ok) {
            const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
            const status = response.status === 401 || response.status === 403 ? 502 : response.status;
            return Response.json({ error: parseUpstreamError(raw, fallbackMessage) }, { status });
          }

          try {
            return Response.json(raw ? JSON.parse(raw) : {});
          } catch {
            return Response.json(
              { choices: [{ message: { content: raw || "{\"errors\":[]}" } }] },
              { status: 200 }
            );
          }
        } catch (error) {
          console.error("Error in grammar check:", error);
          const friendlyMessage = networkErrorMessage(error);
          if (friendlyMessage !== "AI 纠错失败") {
            return Response.json({ error: friendlyMessage }, { status: 502 });
          }
          return Response.json({ error: "AI 纠错失败" }, { status: 500 });
        }
      },
    },
  },
});
