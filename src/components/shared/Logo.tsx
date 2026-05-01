import React from "react";
import Image from "@/lib/image";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  size = 100,
  className = "",
  onClick,
}) => {
  return (
    <Image
      src="/logo.png?v=20260427b"
      alt="浅显 Logo"
      width={size}
      height={size}
      className={`object-contain mix-blend-multiply dark:mix-blend-normal dark:invert ${className}`.trim()}
      onClick={onClick}
      priority={size >= 64}
    />
  );
};

export default Logo;
