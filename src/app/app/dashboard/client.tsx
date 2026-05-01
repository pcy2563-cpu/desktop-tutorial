import { useEffect, useState } from "react";
import { Loader2, LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { IconResumes, IconTemplates, IconSettings, IconAI } from "@/components/shared/icons/SidebarIcons";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import Logo from "@/components/shared/Logo";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

interface MenuItem {
  title: string;
  url?: string;
  href?: string;
  icon: any;
  items?: { title: string; href: string }[];
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("dashboard");
  const { user, fetchMe, logout, loaded, isLoading } = useAuthStore();
  const sidebarItems: MenuItem[] = [
    {
      title: t("sidebar.resumes"),
      url: "/app/dashboard/resumes",
      icon: IconResumes,
    },
    {
      title: t("sidebar.templates"),
      url: "/app/dashboard/templates",
      icon: IconTemplates,
    },
    ...(user?.role === "admin" ? [{
      title: t("sidebar.ai"),
      url: "/app/dashboard/ai",
      icon: IconAI,
    }] : []),
    {
      title: t("sidebar.settings"),
      url: "/app/dashboard/settings",
      icon: IconSettings,
    },

  ];

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">(
    "icon"
  );

  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  const handleItemClick = (item: MenuItem) => {
    if (item.items) {

    } else {
      router.push(item.url || item.href || "/");
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.items) {
      return item.items.some((subItem) => pathname === subItem.href);
    }
    return item.url === pathname || item.href === pathname;
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar
          collapsible={collapsible}
          className="border-r border-border/40 bg-card/50 backdrop-blur-xl"
        >
          <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/40">
            <div className="w-full cursor-pointer justify-center flex items-center" onClick={() => router.push(`/${locale}`)}
            >
              <Logo
                className=" hover:opacity-80 transition-opacity"
                size={48}
              />
              {open && (
                <span className="font-bold text-lg tracking-tight">
                  {t("sidebar.appName")}
                </span>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {sidebarItems.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <TooltipProvider delayDuration={0} key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                className={`w-full transition-all duration-200 ease-in-out h-12 mb-1 [&>svg]:size-auto ${active
                                  ? "bg-primary/10 text-primary font-bold hover:bg-primary/20 hover:text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  }`}
                              >
                                <div
                                  className="flex items-center gap-2 px-2 cursor-pointer"
                                  onClick={() => handleItemClick(item)}
                                >
                                  <item.icon
                                    size={24}
                                    active={active}
                                  />
                                  {open && (
                                    <span className="flex-1 text-sm">
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                              </SidebarMenuButton>
                              {item.items && open && (
                                <div className="ml-9 mt-1 space-y-1 border-l-2 border-muted pl-2">
                                  {item.items.map((subItem) => (
                                    <div
                                      key={subItem.href}
                                      className={`cursor-pointer px-3 py-2 rounded-md text-sm transition-colors ${pathname === subItem.href
                                        ? "text-primary font-medium bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                      onClick={() => router.push(subItem.href)}
                                    >
                                      {subItem.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </SidebarMenuItem>
                          </TooltipTrigger>
                          {!open && (
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/40 p-3">
            {open ? (
              !loaded || isLoading ? (
                <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {"\u6b63\u5728\u786e\u8ba4\u767b\u5f55"}
                </div>
              ) : user ? (
                <div className="space-y-3 rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium">{user.username}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {user.role === "admin" ? "\u7ba1\u7406\u5458" : "\u7528\u6237"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      await logout();
                      router.push("/app/dashboard/auth");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {"\u9000\u51fa\u767b\u5f55"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/app/dashboard/auth")}
                >
                  <LogIn className="h-4 w-4" />
                  {"\u767b\u5f55 / \u6ce8\u518c"}
                </Button>
              )
            ) : null}
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <div className="p-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
