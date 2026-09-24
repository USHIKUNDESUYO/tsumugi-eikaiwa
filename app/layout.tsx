import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";

/**
 * 英字は M PLUS Rounded 1c（丸ゴシック）を自己ホスト。
 * 日本語はヒラギノ丸ゴ等のシステム丸ゴにフォールバックさせて、
 * 数MBの日本語ウェブフォントを読み込まずに「まるっこさ」を出す。
 */
const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rounded",
});

export const metadata: Metadata = {
  title: "紬の英会話 — SYNAPSE FES 2026 対策",
  description:
    "10月2日、福岡。世界中から来る人たちと、英語で話せるようになる3日間のために。紬といっしょに練習する英会話アプリ。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "紬の英会話",
  },
  openGraph: {
    title: "紬の英会話 — SYNAPSE FES 2026 対策",
    description: "フェスで出会う人と英語で話すための、13シナリオ実戦練習。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${rounded.variable} h-full`}>
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full">
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <OfflineIndicator />
        {children}
      </body>
    </html>
  );
}
