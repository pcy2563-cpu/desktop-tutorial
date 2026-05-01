import { useTranslations } from "@/i18n/compat/client";
import ScrollBackground from "./client/ScrollBackground";
import AnimatedFeature from "./client/AnimatedFeature";

export default function HeroSection() {
  const t = useTranslations("home");
  const brand = t("header.title");
  const gridCells = Array.from({ length: 480 }, (_, index) => index);

  return (
    <section className="qx-hero-section relative min-h-[90vh] overflow-hidden">
      <ScrollBackground />
      <div className="qx-cell-grid" aria-hidden="true">
        {gridCells.map((cell) => (
          <span key={cell} />
        ))}
      </div>

      <div className="qx-hero-layout relative z-10">
        <AnimatedFeature>
          <div className="qx-hero-copy">
            <span className="qx-hero-kicker">欢迎访问</span>
            <div className="qx-title-stack" aria-label={`${brand}简历平台`}>
              <span className="qx-art-word">{brand}</span>
              <h1 className="qx-hero-title">简历平台</h1>
            </div>
          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
