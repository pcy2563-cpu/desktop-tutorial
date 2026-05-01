import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, Ticket, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assetPath } from "@/lib/assetPath";
import { useAuthStore } from "@/store/useAuthStore";
import { XIAOMI_MIMO_MODEL_ID, XIAOMI_TOKEN_PLAN_ENDPOINT } from "@/config/ai";

interface PublicAIConfig {
  endpoint: string;
  model: string;
  configured: boolean;
  keyPreview?: string;
  keyFingerprint?: string;
  updatedAt?: string;
}

interface InviteCode {
  code: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

type AdminStatus = "checking" | "authorized" | "unauthorized" | "forbidden";

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

const AISettingsPage = () => {
  const { user, fetchMe, loaded, isLoading } = useAuthStore();
  const [config, setConfig] = useState<PublicAIConfig | null>(null);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(XIAOMI_TOKEN_PLAN_ENDPOINT);
  const [model, setModel] = useState(XIAOMI_MIMO_MODEL_ID);
  const [inviteCode, setInviteCode] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [loading, setLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("checking");

  const applyConfig = (nextConfig: PublicAIConfig) => {
    setConfig(nextConfig);
    setEndpoint(nextConfig.endpoint || XIAOMI_TOKEN_PLAN_ENDPOINT);
    setModel(nextConfig.model || XIAOMI_MIMO_MODEL_ID);
  };

  const loadAdminData = async () => {
    setAdminStatus("checking");
    const configResponse = await fetch(assetPath("/api/admin/ai-config"), {
      cache: "no-store",
      credentials: "include",
    });

    if (configResponse.status === 401) {
      setAdminStatus("unauthorized");
      return;
    }
    if (configResponse.status === 403) {
      setAdminStatus("forbidden");
      return;
    }
    if (!configResponse.ok) {
      throw new Error(await readError(configResponse, "读取 API 配置失败"));
    }

    const invitesResponse = await fetch(assetPath("/api/admin/invites"), {
      cache: "no-store",
      credentials: "include",
    });
    if (!invitesResponse.ok) {
      throw new Error(await readError(invitesResponse, "读取邀请码失败"));
    }

    const configData = await configResponse.json();
    const inviteData = await invitesResponse.json();
    applyConfig(configData.config);
    setInvites(inviteData.invites || []);
    setAdminStatus("authorized");
  };

  useEffect(() => {
    fetchMe().catch(() => {});
    loadAdminData().catch((error) => {
      setAdminStatus(user?.role === "admin" ? "authorized" : "unauthorized");
      toast.error(error instanceof Error ? error.message : "读取管理员配置失败");
    });
    // Run once on page entry; user fallback above covers persisted auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(assetPath("/api/admin/ai-config"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          endpoint,
          model,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "保存 API 配置失败"));
      }
      const data = await response.json();
      applyConfig(data.config);
      setApiKey("");
      toast.success("API 配置已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setLoading(true);
    try {
      const response = await fetch(assetPath("/api/admin/invites"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inviteCode.trim() || undefined,
          maxUses: Number(maxUses) || 100,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "创建邀请码失败"));
      }
      setInviteCode("");
      await loadAdminData();
      toast.success("邀请码已创建");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const isCheckingAuth = adminStatus === "checking" || (!loaded && isLoading);
  const isAdmin = adminStatus === "authorized" || user?.role === "admin";

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border bg-white/90 px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在确认登录状态...
        </div>
      </div>
    );
  }

  if (!isAdmin && adminStatus === "unauthorized") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <AuthPanel compact />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center px-4 py-16">
        <Card className="w-full border-amber-200 bg-amber-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              仅管理员可访问
            </CardTitle>
            <CardDescription>
              API Key、模型和邀请码属于平台管理功能，普通用户登录后可以直接使用 AI 功能。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="rounded-3xl border border-black/10 bg-[linear-gradient(135deg,#0f172a,#1f2937)] p-8 text-white shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <WandSparkles className="h-4 w-4" />
              小米 Token Plan 接入
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI 接口管理</h1>
            <p className="mt-2 max-w-2xl text-white/70">
              管理员统一保存 API Key，普通用户登录后即可使用 AI 润色、纠错和导入功能。
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            当前状态：{config?.configured ? "已配置" : "未配置"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              API 配置
            </CardTitle>
            <CardDescription>
              API Key 留空保存时，会保留服务器上已经保存的密钥；保存后下方会显示密钥指纹。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>小米 Token Plan API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={config?.configured ? "留空表示不修改已保存密钥" : "请输入完整 API Key"}
              />
              <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {config?.configured ? (
                  <>
                    <span className="font-medium text-foreground">已保存：</span>
                    <span className="font-mono">{config.keyPreview || "已保存密钥"}</span>
                    {config.keyFingerprint ? <span className="ml-2">指纹 {config.keyFingerprint}</span> : null}
                    {config.updatedAt ? <span className="ml-2">更新时间 {new Date(config.updatedAt).toLocaleString()}</span> : null}
                  </>
                ) : (
                  "尚未保存 API Key"
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>基础地址</Label>
              <Input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
              <p className="text-xs text-muted-foreground">推荐：{XIAOMI_TOKEN_PLAN_ENDPOINT}</p>
            </div>
            <div className="space-y-2">
              <Label>模型 ID</Label>
              <Input value={model} onChange={(event) => setModel(event.target.value)} />
              <p className="text-xs text-muted-foreground">推荐：{XIAOMI_MIMO_MODEL_ID}</p>
            </div>
            <Button disabled={loading} onClick={saveConfig} className="h-11 w-full bg-black text-white hover:bg-black/90">
              保存 API 配置
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              邀请码
            </CardTitle>
            <CardDescription>
              普通用户注册必须填写邀请码，账号和密码由用户自己设置。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label>邀请码</Label>
                <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="留空自动生成" />
              </div>
              <div className="space-y-2">
                <Label>可用次数</Label>
                <Input value={maxUses} onChange={(event) => setMaxUses(event.target.value)} inputMode="numeric" />
              </div>
            </div>
            <Button disabled={loading} variant="outline" onClick={createInvite} className="h-11 w-full">
              创建邀请码
            </Button>
            <div className="space-y-2">
              {invites.length === 0 ? (
                <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">暂无邀请码</div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.code} className="flex items-center justify-between rounded-2xl border p-3">
                    <div>
                      <div className="font-mono text-sm font-semibold">{invite.code}</div>
                      <div className="text-xs text-muted-foreground">
                        已用 {invite.usedCount} / {invite.maxUses}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {invite.active ? "可用" : "停用"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISettingsPage;
