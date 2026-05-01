import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/app/app/dashboard/auth/page";

export const Route = createFileRoute("/app/dashboard/auth")({
  component: AuthPage,
});
