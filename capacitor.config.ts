import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ⚠️ appId は Google Play に一度アップロードすると二度と変更できません。
 *    独自ドメインで出したい場合は、初回アップロード前にここを変えてください。
 */
const config: CapacitorConfig = {
  appId: 'app.tsumugi.eikaiwa',
  appName: '紬の英会話',
  // next build（BUILD_TARGET=mobile）が出力する静的ファイル
  webDir: 'out',
  android: {
    // 端末内の静的ファイルから配信する。AI会話だけ NEXT_PUBLIC_API_BASE を叩く。
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
