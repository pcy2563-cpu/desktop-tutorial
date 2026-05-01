import { useState } from "react";
import type { FormEvent } from "react";
import { LogIn, Ticket, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "login") {
        await login({ username, password });
        toast.success("登录成功");
      } else {
        await register({ username, password, inviteCode });
        toast.success("注册成功");
      }
      router.push("/app/dashboard/resumes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <Card className={cn("mx-auto w-full max-w-md overflow-hidden border-black/10 bg-white/90 shadow-2xl shadow-black/10 backdrop-blur", compact && "shadow-lg")}>
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
          {mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </div>
        <div>
          <CardTitle className="text-2xl">{mode === "login" ? "登录账号" : "邀请码注册"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "登录后才能使用 AI 纠错、AI 润色等消耗接口的功能。" : "账号和密码可以自行设置，但必须填写管理员提供的邀请码。"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>账号</Label>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入账号" autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label>密码</Label>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="请输入密码" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                邀请码
              </Label>
              <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="请输入邀请码" />
            </div>
          )}
          <Button disabled={isLoading} className="h-11 w-full bg-black text-white hover:bg-black/90">
            {isLoading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "没有账号？使用邀请码注册" : "已有账号？返回登录"}
        </button>
      </CardContent>
    </Card>
  );
}
