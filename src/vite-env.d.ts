/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 카카오 개발자 콘솔의 JavaScript 키. .env.local에 넣는다. 없으면 지도만 폴백으로 표시된다. */
  readonly VITE_KAKAO_JS_KEY?: string
  /**
   * Cloudflare Web Analytics 토큰. Cloudflare 빌드 변수에만 넣는다(.env.local에는 넣지 않는다).
   * 없으면 사용량 집계를 하지 않을 뿐 앱은 그대로 동작한다. src/analytics.ts 참고.
   */
  readonly VITE_CF_BEACON_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
