import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/server/platform";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getCurrentUser(request);
        return Response.json({ user });
      },
    },
  },
});
