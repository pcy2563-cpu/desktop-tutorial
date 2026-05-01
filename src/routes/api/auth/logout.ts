import { createFileRoute } from "@tanstack/react-router";
import { buildClearSessionCookie, logoutUser } from "@/lib/server/platform";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await logoutUser(request);
        return Response.json(
          { ok: true },
          {
            headers: {
              "Set-Cookie": buildClearSessionCookie(request),
            },
          }
        );
      },
    },
  },
});
