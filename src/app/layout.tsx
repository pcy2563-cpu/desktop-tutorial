import { ReactNode } from "react";
import { Metadata } from "next";
import "./globals.css";
import "./font.css";
import "@/styles/tiptap.scss";

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  metadataBase: new URL("https://qianxian.site/magic-resume"),
  icons: {
    icon: "/magic-resume/icon.png?v=20260427b",
    shortcut: "/magic-resume/icon.png?v=20260427b",
    apple: "/magic-resume/icon.png?v=20260427b"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({ children }: Props) {
  return children;
}
