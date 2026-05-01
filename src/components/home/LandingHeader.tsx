
import { useState } from "react";
import { usePathname } from "@/lib/navigation";
import { useTranslations } from "@/i18n/compat/client";
import { Menu, Moon, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import LanguageSwitch from "@/components/shared/LanguageSwitch";
import Link from "@/lib/link";
import ScrollHeader from "./client/ScrollHeader";
import MobileMenu from "./client/MobileMenu";
import GoDashboard from "./GoDashboard";

export default function LandingHeader() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ScrollHeader>
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <div className="qx-header-bar flex items-center justify-between h-16 px-3 md:px-5">
            <Link
              href={`/${locale}`}
              className="qx-brand-link flex items-center cursor-pointer group"
            >
              <Logo size={52} />
              <span className="font-serif text-[23px] tracking-tight font-semibold text-foreground/90">
                {t("header.title")}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitch />
              <ThemeToggle>
                <div className="w-10 h-10 relative cursor-pointer rounded-2xl hover:bg-accent/80 flex items-center justify-center transition-colors">
                  <Sun className="h-[1.1rem] w-[1.1rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-[1.1rem] w-[1.1rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
              </ThemeToggle>

              <GoDashboard>
                <Button
                  className="qx-header-cta rounded-2xl px-6 h-10 font-medium transition-all hover:opacity-95 active:scale-95"
                >
                  {t("header.startButton")}
                </Button>
              </GoDashboard>
            </div>

            <button
              className="md:hidden p-2.5 hover:bg-accent rounded-2xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </ScrollHeader>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        buttonText={t("header.startButton")}
      />
    </>
  );
}
