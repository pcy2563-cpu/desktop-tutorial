import { createFileRoute } from "@tanstack/react-router";
import { buildSessionCookie, loginUser } from "@/lib/server/platform";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { username, password } = body as { username?: string; password?: string };
          if (!username || !password) {
            return Response.json({ error: "请输入账号和密码" }, { status: 400 });
          }

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
            { error: error instanceof Error ? error.message : "登录失败" },
            { status: 401 }
          );
        }
      },
    },
  },
});
