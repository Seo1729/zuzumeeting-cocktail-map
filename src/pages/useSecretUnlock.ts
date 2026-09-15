import { useCallback, useState } from 'react'
import { SECRET_BAR_ID } from '../domain/secret'

/*
  잠금을 푼 적이 있는지 기억한다.

  한 번 연 사람에게 들어올 때마다 비밀번호를 다시 묻는 것은 퍼즐이 아니라 검문이다.
  기기별로만 남고(브라우저 저장소), 시크릿 창이나 저장소를 지우면 초기화된다.
  쿠폰 판정은 어차피 카톡으로 하니 이 값이 날아가도 잃는 것은 없다.

  해제한 '시각'까지 담아 두는 것은 전용 화면에 찍기 위해서다. 캡쳐가 그냥 화면이
  아니라 티켓처럼 보인다. 기기 시계를 바꾸면 흔들리는 값이지만 판정용이 아니다.
*/
const STORAGE_KEY = `zuzu:unlocked:${SECRET_BAR_ID}`

/*
  localStorage 접근은 통째로 try로 감싼다.

  사파리 사생활 보호 모드나 저장소를 막아둔 브라우저에서는 읽기만 해도 예외가 난다.
  여기서 터지면 이스터에그가 아니라 앱이 흰 화면이 되므로, 실패하면 "해제한 적 없음"으로
  조용히 떨어뜨린다. 그 경우 비밀번호를 매번 다시 묻게 될 뿐 화면은 정상 동작한다.
*/
function readUnlockedAt(): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export interface SecretUnlock {
  /** ISO 문자열. 아직 못 열었으면 null. */
  unlockedAt: string | null
  unlock: () => void
}

export function useSecretUnlock(): SecretUnlock {
  // 함수를 그대로 넘겨 첫 렌더에서 한 번만 읽는다. readUnlockedAt()로 부르면 매 렌더마다 읽는다.
  const [unlockedAt, setUnlockedAt] = useState<string | null>(readUnlockedAt)

  const unlock = useCallback(() => {
    const now = new Date().toISOString()
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, now)
    } catch {
      // 저장에 실패해도 이번 방문에서는 열어준다. 다음에 다시 물을 뿐이다.
    }
    setUnlockedAt(now)
  }, [])

  return { unlockedAt, unlock }
}
