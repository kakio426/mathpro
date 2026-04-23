import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { publicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://suhakpro.local"),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "초등 수학",
    "2022 개정 교육과정",
    "분수",
    "에듀테크",
    "인터랙션 학습",
  ],
};

void publicEnv;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-canvas text-foreground">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
