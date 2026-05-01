import { createFileRoute } from "@tanstack/react-router";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { getServerAIConfig, requireUser } from "@/lib/server/platform";

const parseJsonPayload = (content: string) => {
  const text = content.trim();
  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const objectBlock = text.match(/\{[\s\S]*\}/);
  if (objectBlock?.[0]) {
    try {
      return JSON.parse(objectBlock[0]);
    } catch {}
  }

  return null;
};

const extractBase64Payload = (value: string) => {
  const matched = value.match(/^data:(.*?);base64,(.*)$/);
  if (matched) {
    return {
      mimeType: matched[1] || "image/jpeg",
      data: matched[2] || "",
    };
  }

  return {
    mimeType: "image/jpeg",
    data: value,
  };
};

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

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_TEXT_LENGTH = 30000;
const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BASE64_LENGTH = 5 * 1024 * 1024;

const validateImportInput = (payload: {
  content?: string;
  images?: string[];
}) => {
  if (payload.content && String(payload.content).length > MAX_TEXT_LENGTH) {
    return "Resume content is too large";
  }
  if (payload.images && (!Array.isArray(payload.images) || payload.images.length > MAX_IMAGE_COUNT)) {
    return "Too many images";
  }
  for (const image of payload.images || []) {
    if (typeof image !== "string" || image.length > MAX_IMAGE_BASE64_LENGTH) {
      return "Image is too large";
    }
    const payloadData = extractBase64Payload(image);
    if (!ALLOWED_IMAGE_MIME_TYPES.has(payloadData.mimeType.toLowerCase())) {
      return "Unsupported image type";
    }
  }
  return "";
};

const buildSystemPrompt = (language: string) => `你是专业的简历结构化助手。根据用户提供的简历内容或简历截图提取信息，只输出合法 JSON，不要输出 Markdown 或解释。

要求：
1. 不确定的字段使用空字符串或空数组。
2. 文本内容使用 ${language}。
3. description/details 字段必须是字符串数组，每一项是一句可读内容。
4. 不要虚构简历中不存在的信息。

JSON 结构：
{
  "title": "简历标题",
  "basic": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "employementStatus": "",
    "birthDate": ""
  },
  "education": [
    {
      "school": "",
      "major": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "description": ["", ""]
    }
  ],
  "experience": [
    {
      "company": "",
      "position": "",
      "date": "",
      "details": ["", ""]
    }
  ],
  "projects": [
    {
      "name": "",
      "role": "",
      "date": "",
      "description": ["", ""],
      "link": "",
      "linkLabel": ""
    }
  ],
  "skills": ["", ""]
}`;

export const Route = createFileRoute("/api/resume-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if (auth.response) return auth.response;

        try {
          const body = await request.json();
          const { content, images, locale } = body as {
            content?: string;
            images?: string[];
            locale?: string;
          };
          const inputError = validateImportInput({ content, images });
          if (inputError) {
            return Response.json({ error: inputError }, { status: 400 });
          }

          if (!content && (!images || images.length === 0)) {
            return Response.json(
              { error: "Missing resume content/images" },
              { status: 400 }
            );
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

          const language = locale === "en" ? "English" : "Chinese";
          const userContent: Array<
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
          > = [
            {
              type: "text",
              text: content || "请识别以下简历页面图片中的信息，并严格按 JSON 结构输出。",
            },
          ];

          for (const image of images || []) {
            const payload = extractBase64Payload(image);
            userContent.push({
              type: "image_url",
              image_url: {
                url: `data:${payload.mimeType};base64,${payload.data}`,
              },
            });
          }

          const modelConfig = AI_MODEL_CONFIGS.openai;
          const response = await fetch(modelConfig.url(serverConfig.endpoint), {
            method: "POST",
            headers: modelConfig.headers(serverConfig.apiKey),
            body: JSON.stringify({
              model: serverConfig.model,
              messages: [
                {
                  role: "system",
                  content: buildSystemPrompt(language),
                },
                {
                  role: "user",
                  content: userContent,
                },
              ],
              temperature: 0.2,
            }),
          });

          const raw = await response.text();
          if (!response.ok) {
            const fallbackMessage = `Upstream API error: ${response.status} ${response.statusText}`;
            const status = response.status === 401 || response.status === 403 ? 502 : response.status;
            return Response.json({ error: parseUpstreamError(raw, fallbackMessage) }, { status });
          }

          const upstream = raw ? JSON.parse(raw) : {};
          const aiContent = upstream?.choices?.[0]?.message?.content;
          if (!aiContent || typeof aiContent !== "string") {
            return Response.json(
              { error: "AI did not return structured content" },
              { status: 500 }
            );
          }

          const parsedResume = parseJsonPayload(aiContent);
          if (!parsedResume) {
            return Response.json(
              { error: "Failed to parse AI JSON output" },
              { status: 500 }
            );
          }

          return Response.json({ resume: parsedResume });
        } catch (error) {
          console.error("Error in resume import:", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Resume import failed" },
            { status: 500 }
          );
        }
      },
    },
  },
});
