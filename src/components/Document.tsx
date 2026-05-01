import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

type Props = {
  children: ReactNode;
  locale: string;
  bodyClassName?: string;
};

export default function Document({ children, locale, bodyClassName }: Props) {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <html className={inter.className} lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="256x256" href={`${baseUrl}logo.png?v=20260427b`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${baseUrl}icon.png?v=20260427b`} />
      </head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
