import type { MetadataRoute } from "next";

export const runtime = "edge";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "浅显",
    short_name: "浅显",
    description: "浅显 AI 简历编辑器",
    start_url: "/magic-resume/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/magic-resume/icon.png?v=20260427b",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
