import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { getServerAIConfig, requireUser } from "@/lib/server/platform";

const MAX_CONTENT_LENGTH = 12000;
const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 1000;

const BASE_POLISH_PROMPT = `你是专业的简历优化助手。请优化用户提供的 Markdown 简历片段，使其更专业、清晰、有说服力。

必须遵守：
1. 只输出优化后的正文内容，不要输出说明、总结、前言或附加建议。
2. 保留原有 Markdown 结构，不要使用代码块包裹结果。
3. 不要虚构经历、成绩、项目或技术能力。
4. 可以优化措辞、压缩啰嗦表达、突出行动和结果。
5. 如果用户提供了额外要求，以额外要求为准，但仍不得虚构事实。`;

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

const validateInput = (payload: { content?: string; customInstructions?: string }) => {
  if (!payload.content || typeof payload.content !== "string" || payload.content.length > MAX_CONTENT_LENGTH) {
    return "Invalid content";
  }
  if (
    payload.customInstructions &&
    (typeof payload.customInstructions !== "string" || payload.customInstructions.length > MAX_CUSTOM_INSTRUCTIONS_LENGTH)
  ) {
    return "Invalid custom instructions";
  }
  return "";
};

const networkErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  const cause = error instanceof Error && "cause" in error ? String((error as Error & { cause?: unknown }).cause) : "";
  if (message.includes("fetch failed") || cause.includes("ENOTFOUND") || cause.includes("ECONNREFUSED")) {
    return "AI 接口地址无法访问，请到管理员入口检查 API 基础地址";
  }
  return "AI 润色失败";
};

export const Route = createFileRoute("/api/polish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        try {
          const body = await request.json();
          const { content, customInstructions } = body as {
            content?: string;
            customInstructions?: string;
          };
          const inputError = validateInput({ content, customInstructions });
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

          const systemPrompt = customInstructions?.trim()
            ? `${BASE_POLISH_PROMPT}\n\n用户额外要求：\n${customInstructions.trim()}`
            : BASE_POLISH_PROMPT;
          const modelConfig = AI_MODEL_CONFIGS.openai;

          const response = await fetch(modelConfig.url(serverConfig.endpoint), {
            method: "POST",
            headers: modelConfig.headers(serverConfig.apiKey),
            body: JSON.stringify({
              model: serverConfig.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content },
              ],
              stream: true,
            }),
          });

          if (!response.ok) {
            const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
            const rawError = await response.text();
            const status = response.status === 401 || response.status === 403 ? 502 : response.status;
            return Response.json({ error: parseUpstreamError(rawError, fallbackMessage) }, { status });
          }

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              if (!response.body) {
                controller.close();
                return;
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let pending = "";

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  pending += decoder.decode(value, { stream: true });
                  const lines = pending.split(/\r?\n/);
                  pending = lines.pop() ?? "";

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;

                    const payload = trimmed.slice(5).trim();
                    if (!payload || payload === "[DONE]") continue;

                    try {
                      const data = JSON.parse(payload) as {
                        error?: { message?: string };
                        choices?: Array<{ delta?: { content?: string } }>;
                      };
                      if (data.error?.message) {
                        controller.error(new Error(data.error.message));
                        return;
                      }
                      const deltaContent = data.choices?.[0]?.delta?.content;
                      if (deltaContent) {
                        controller.enqueue(encoder.encode(deltaContent));
                      }
                    } catch (error) {
                      console.error("Error parsing stream payload:", error);
                    }
                  }
                }

                controller.close();
              } catch (error) {
                console.error("Stream reading error:", error);
                controller.error(error);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (error) {
          console.error("Polish error:", error);
          return Response.json({ error: networkErrorMessage(error) }, { status: 502 });
        }
      },
    },
  },
});
