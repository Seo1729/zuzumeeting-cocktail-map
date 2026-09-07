import { useEffect, useState } from 'react'
import type { KakaoMaps } from './types'

/*
  카카오 SDK를 동적으로 불러온다.

  index.html에 <script>로 박지 않는 이유:
  - 지도 화면에 들어가지 않는 사람에게까지 SDK를 받게 하고 싶지 않다
  - 로딩 실패를 코드에서 잡아 폴백 화면을 보여줘야 한다

  autoload=false로 받은 뒤 kakao.maps.load()를 직접 부르는 것이 카카오가 권장하는 방식이다.
  그냥 두면 SDK가 스스로 초기화하는 시점을 우리가 알 수 없다.
*/

export type KakaoLoadStatus = 'loading' | 'ready' | 'error'

export type KakaoLoadError = 'no-key' | 'script-error'

const SCRIPT_ID = 'kakao-maps-sdk'

// 모듈 수준 캐시. StrictMode의 이중 마운트나 리스트/지도 왕복에서 SDK를 두 번 받지 않게 한다.
let loadPromise: Promise<KakaoMaps> | null = null

function loadKakaoSdk(): Promise<KakaoMaps> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<KakaoMaps>((resolve, reject) => {
    // 이미 로드가 끝난 상태(HMR 등)라면 그대로 쓴다.
    const existing = window.kakao?.maps
    if (existing && typeof existing.Map === 'function') {
      resolve(existing)
      return
    }

    const key = import.meta.env.VITE_KAKAO_JS_KEY
    if (!key) {
      reject(new Error('no-key'))
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script#${SCRIPT_ID}`)
    const script = existingScript ?? document.createElement('script')
    script.id = SCRIPT_ID

    const onLoad = () => {
      const kakao = window.kakao
      if (!kakao) {
        onError()
        return
      }
      // 여기서부터 kakao.maps.* 생성자를 쓸 수 있다.
      kakao.maps.load(() => resolve(kakao.maps))
    }

    function onError() {
      // 실패한 <script>를 DOM에 남겨두면, 다음 시도가 그 태그를 재사용하면서
      // load도 error도 다시 받지 못해 "불러오는 중"에서 영영 멈춘다.
      script.remove()
      reject(new Error('script-error'))
    }

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (!script.isConnected) {
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
      document.head.appendChild(script)
    }
  })

  // 실패한 약속을 캐시에 남겨두면 재시도가 영영 불가능해진다.
  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}

export interface KakaoLoaderState {
  status: KakaoLoadStatus
  maps: KakaoMaps | null
  error: KakaoLoadError | null
}

export function useKakaoLoader(): KakaoLoaderState {
  const [state, setState] = useState<KakaoLoaderState>({
    status: 'loading',
    maps: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    loadKakaoSdk().then(
      (maps) => {
        if (!cancelled) setState({ status: 'ready', maps, error: null })
      },
      (error: unknown) => {
        if (cancelled) return
        const reason = error instanceof Error && error.message === 'no-key' ? 'no-key' : 'script-error'
        setState({ status: 'error', maps: null, error: reason })
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
