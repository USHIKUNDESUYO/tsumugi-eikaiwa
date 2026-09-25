import type { NextConfig } from "next";

/**
 * BUILD_TARGET=mobile のときは Capacitor 用に静的書き出しする。
 *
 * 静的書き出しでは POST の Route Handler が使えないため、
 * scripts/build-mobile.mjs が app/api を一時退避してからこのビルドを走らせる。
 * アプリ本体は端末内に入り、AI会話と読み上げだけ NEXT_PUBLIC_API_BASE の
 * サーバー（Vercel）を絶対URLで叩く、という構成。
 */
const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  ...(isMobileBuild
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        // 静的書き出しでは distDir が「書き出し先そのもの」になる。
        // out/ に出して Web ビルドの .next を壊さないようにする。
        distDir: "out",
      }
    : {}),
};

export default nextConfig;
