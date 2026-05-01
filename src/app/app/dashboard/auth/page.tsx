import { AuthPanel } from "@/components/auth/AuthPanel";

export default function AuthPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.08),transparent_30%),linear-gradient(135deg,#f8fafc,#eef2f7)] px-4 py-10">
      <AuthPanel />
    </main>
  );
}
