import { createFileRoute } from "@tanstack/react-router";
import { buildSessionCookie, loginUser, registerUser } from "@/lib/server/platform";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { username, password, inviteCode } = body as {
            username?: string;
            password?: string;
            inviteCode?: string;
          };
          if (!username || !password || !inviteCode) {
            return Response.json({ error: "注册需要账号、密码和邀请码" }, { status: 400 });
          }

          await registerUser({ username, password, inviteCode });
          const { token, user } = await loginUser(username, password);
          return Response.json(
            { user },
            {
              headers: {
                "Set-Cookie": buildSessionCookie(request, token),
              },
            }
          );
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "注册失败" },
            { status: 400 }
          );
        }
      },
    },
  },
});
