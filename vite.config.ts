import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// 정적 호스팅(Cloudflare Pages) 전용. 서버/API 없음.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 부원이 앱을 열 때마다 조용히 최신 버전을 받아가게 한다.
      // "새 버전이 있습니다" 배너를 띄워봐야 술집에서 아무도 안 누른다.
      registerType: 'autoUpdate',
      // includeAssets는 쓰지 않는다. 아래 globPatterns가 이미 public/의 png·svg를 잡고 있어서
      // 둘을 같이 쓰면 같은 아이콘이 precache 목록에 두 번 들어간다.
      manifest: {
        name: '전주 칵테일바 지도',
        short_name: '전주 칵테일바',
        description: '전북대 칵테일 동아리를 위한 전주 칵테일바 정보',
        lang: 'ko',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0f',
        theme_color: '#0b0b0f',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 빌드 산출물 전부를 precache한다. bars.json은 JS 번들 안에 들어가므로
        // 여기에 함께 포함되고, 별도 캐시 전략이 필요 없다.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // HashRouter라서 문서는 index.html 하나뿐이다.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // 지도 타일과 카카오 SDK는 캐시하지 않는다.
            // 타일은 양이 많아 저장소를 금방 채우고, 오래된 타일은 오히려 틀린 정보다.
            urlPattern: ({ url }) =>
              url.hostname.endsWith('kakao.com') ||
              url.hostname.endsWith('daumcdn.net') ||
              url.hostname.endsWith('kakaocdn.net'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
