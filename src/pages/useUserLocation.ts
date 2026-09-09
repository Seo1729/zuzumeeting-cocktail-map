import { useCallback, useRef, useState } from 'react'
import type { UserLocation } from '../map/types'

/*
  브라우저에서 현재 위치를 한 번 받아온다.

  이 훅이 src/map/ 밖에 있는 이유:
  Geolocation은 브라우저 표준 API지 카카오 SDK가 아니다. 좌표를 "얻는" 일과
  좌표를 "지도에 그리는" 일을 나눠두면, 나중에 지도 제공자를 갈아끼울 때
  권한 요청 UX를 다시 만들지 않아도 된다.

  ── 지켜야 할 규칙 두 가지 ──

  1. 위치를 저장하지 않는다.
     SPEC의 "사용자 데이터를 저장하지 마라" 조항에 걸린다. localStorage는 물론이고
     "권한을 허용했었음" 같은 플래그도 남기지 않는다. 탭을 닫으면 사라진다.

  2. 위치를 URL에 넣지 않는다.
     이 앱은 필터 상태를 전부 URL에 담아 링크를 공유하는 구조다(useBarQuery).
     좌표가 거기 섞이면 오픈채팅방에 링크를 붙여넣는 순간 자기 위치가 공개된다.
     그래서 이 훅은 useSearchParams를 쓰지 않고 메모리에만 둔다.

  자동으로 요청하지 않는 것도 의도다. 화면에 들어가자마자 권한 팝업이 뜨면
  맥락을 모르는 채로 거부하기 쉽고, 한번 거부하면 앱이 다시 물어볼 방법이 없다.
  사용자가 버튼을 눌렀을 때만 요청한다.
*/

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'error'

export type LocationError =
  /** 사용자가 거부. 앱에서 되돌릴 수 없고 브라우저 설정에서 풀어야 한다. */
  | 'denied'
  /** HTTPS가 아니거나 브라우저가 지원하지 않음. */
  | 'unsupported'
  /** 시간 안에 못 잡음. 실내·지하에서 흔하다. 다시 시도할 수 있다. */
  | 'timeout'
  /** 신호를 못 잡음. 다시 시도할 수 있다. */
  | 'unavailable'

export interface UserLocationState {
  status: LocationStatus
  location: UserLocation | null
  error: LocationError | null
  request: () => void
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  // 30초 안에 받아둔 값이 있으면 재사용한다. 버튼을 연타해도 GPS를 다시 깨우지 않는다.
  maximumAge: 30_000,
}

export function useUserLocation(): UserLocationState {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<LocationError | null>(null)

  // 응답을 기다리는 동안 버튼을 또 눌러도 요청이 겹치지 않게 한다.
  const pendingRef = useRef(false)

  const request = useCallback(() => {
    if (pendingRef.current) return

    // isSecureContext가 false면 브라우저가 geolocation을 아예 막거나 항상 실패시킨다.
    // localhost는 예외적으로 secure로 취급되므로 개발 중에는 그대로 동작한다.
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setStatus('error')
      setError('unsupported')
      return
    }

    pendingRef.current = true
    setStatus('requesting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        pendingRef.current = false
        // coords에서 필요한 세 값만 꺼낸다. GeolocationPosition을 통째로 들고 있지 않는다.
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setError(null)
        setStatus('granted')
      },
      (positionError) => {
        pendingRef.current = false
        setLocation(null)
        setError(toLocationError(positionError))
        setStatus('error')
      },
      GEO_OPTIONS,
    )
  }, [])

  return { status, location, error, request }
}

function toLocationError(error: GeolocationPositionError): LocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'denied'
    case error.TIMEOUT:
      return 'timeout'
    default:
      return 'unavailable'
  }
}
