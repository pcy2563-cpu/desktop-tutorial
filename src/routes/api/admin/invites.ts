import { createFileRoute } from "@tanstack/react-router";
import { createInvite, listInvites, requireAdmin } from "@/lib/server/platform";

export const Route = createFileRoute("/api/admin/invites")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.response) return auth.response;
        return Response.json({ invites: await listInvites() });
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (auth.response) return auth.response;

        try {
          const body = await request.json();
          const invite = await createInvite(body as { code?: string; maxUses?: number });
          return Response.json({ invite });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "创建邀请码失败" },
            { status: 400 }
          );
        }
      },
    },
  },
});
