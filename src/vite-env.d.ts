/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 카카오 개발자 콘솔의 JavaScript 키. .env.local에 넣는다. 없으면 지도만 폴백으로 표시된다. */
  readonly VITE_KAKAO_JS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
