import type { CSSProperties, ReactNode } from "react";

interface AnimatedFeatureProps {
  children: ReactNode;
  delay?: number;
}

export default function AnimatedFeature({ children, delay = 0 }: AnimatedFeatureProps) {
  return (
    <div
      className="qx-reveal"
      style={{ "--qx-reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
