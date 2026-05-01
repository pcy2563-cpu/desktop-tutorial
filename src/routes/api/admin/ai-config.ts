import { createFileRoute } from "@tanstack/react-router";
import { getPublicAIConfig, requireAdmin, updateAIConfig } from "@/lib/server/platform";

export const Route = createFileRoute("/api/admin/ai-config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.response) return auth.response;
        const config = await getPublicAIConfig();
        return Response.json({ config });
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.response) return auth.response;

        try {
          const body = await request.json();
          const config = await updateAIConfig(body as { apiKey?: string; endpoint?: string; model?: string });
          return Response.json({ config });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "保存 API 配置失败" },
            { status: 400 }
          );
        }
      },
    },
  },
});
