import type { BaseSpirit } from './schema'

/*
  이스터에그 — '더 작은 바'.

  지도와 리스트에는 평범한 바처럼 보이지만, 상세로 들어가면 잠겨 있고
  비밀번호를 넣어야 전용 화면이 열린다. 비밀번호는 인스타 프로필에 적힌 홈바 아이디
  'smaller_own_bar'이고, 프로필에 보이는 표기 그대로 밑줄까지 쳐야 열린다.

  왜 숨기지 않고 보이게 두는가:
  검색으로만 찾게 하면 단서가 앱 안에 하나도 없어서, 결국 누가 카톡방에
  "○○ 쳐봐"라고 흘리는 순간 끝난다. 그건 발견이 아니라 전달이다.
  잠긴 핀을 보이게 두면 핀 → 잠금 화면 → 인스타 → 비밀번호로 단서가 스스로 이어진다.

  또 하나, 숨기는 쪽은 코드가 훨씬 더러워진다. ALL_BARS를 쓰는 모든 화면
  (리스트의 '15곳', 지도 마커, 칵테일 찾기의 종 수 집계)에서 한 곳씩 빼야 하고
  하나라도 빠뜨리면 숫자가 서로 어긋난다. 이 바는 그냥 평범한 바로 데이터에 두고
  상세 진입만 막으면 그 문제가 통째로 없어진다.

  메뉴(menu)는 일부러 비워 두었다. 홈바에 메뉴를 달면 '칵테일 찾기'의 종 수 집계와
  "네그로니 N곳에서 팝니다" 비교에 홈바 가격이 섞인다. 상업 바들의 가격 비교에
  홈바가 끼면 안 되므로, 시그니처는 아래 SECRET_SIGNATURES에 따로 두고
  전용 화면에서만 보여준다.
*/

/** bars.json의 id와 반드시 같아야 한다. 이 값 하나로 잠금 여부가 결정된다. */
export const SECRET_BAR_ID = 'smaller-own-bar'

export function isSecretBar(id: string): boolean {
  return id === SECRET_BAR_ID
}

/*
  잠금 화면에 링크로만 걸어두는 곳. 이 프로필에 비밀번호(홈바 아이디)가 있다.

  화면은 이 링크가 무엇인지 설명하지 않는다 — 비밀번호가 여기 있다는 사실은
  카톡방에서 직접 알린다. 앱에 남은 단서는 이 버튼 하나뿐이다.
*/
export const SECRET_INSTAGRAM = 'https://www.instagram.com/smaller_own_bar'

/*
  입력값 정규화.

  밑줄은 남긴다. 정답은 프로필에 보이는 표기 그대로인 'smaller_own_bar'이고,
  밑줄까지 다 쳐야 열린다 — 본 대로 옮겨 적는 것이 가장 자연스러운 행동이고,
  '밑줄은 빼야 하나?'를 고민하게 만들 이유가 없다. 대신 밑줄을 흘려보내지 않으므로
  'smallerownbar'는 이제 틀린 답이다.

  나머지는 흘려보낸다. 대소문자(폰 키보드가 첫 글자를 멋대로 대문자로 만든다),
  공백, 그리고 아이디를 옮길 때 딸려오기 쉬운 @.
*/
export function normalizeSecretInput(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

/*
  정답을 문자열이 아니라 해시로 둔다.

  분명히 해두자 — 이건 보안이 아니라 난독화다. 이 앱은 정적 웹앱이라 코드가 통째로
  브라우저에 내려가고, 마음먹으면 이 검사 자체를 우회할 수 있다. 다만 정답 문자열이
  번들에 그대로 박혀 있으면 개발자도구에서 한 번 검색하는 것만으로 끝나는데,
  선착순 쿠폰이 걸려 있어서 그 정도 턱은 있는 편이 낫다.

  실제 판정은 어차피 카톡으로 온 캡쳐를 보고 사람이 하므로, 뚫려도 손해는 없다.
*/
const SECRET_ANSWER_HASH = 3764458086

/** FNV-1a 32비트. 암호용 해시가 아니다 — 위 주석 참고. */
function fnv1a(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function checkSecret(input: string): boolean {
  const normalized = normalizeSecretInput(input)
  // 빈 문자열도 해시값을 갖는다. 명시적으로 막지 않으면 빈칸 제출이 판정에 들어간다.
  if (normalized === '') return false
  return fnv1a(normalized) === SECRET_ANSWER_HASH
}

export const SECRET_INTRO = '방구석 알코올 연구원의 연구소이자 파견 전문 칵테일바'

export interface SecretSignature {
  name: string
  base: BaseSpirit
  /** 도수. 재본 적 없으면 null — 모르는 값을 지어내지 않는다. */
  abv: string | null
  /** 부재료. 없으면 빈 문자열. */
  ingredients: string
  /** 한 줄 덧붙임. */
  note: string
}

export const SECRET_SIGNATURES: readonly SecretSignature[] = [
  {
    name: '나의 낯선 동행자',
    base: 'GIN',
    abv: '12%',
    ingredients: '피치트리 · 자몽쥬스 · 스윗앤사워믹스',
    note: '',
  },
  {
    name: '갓파더',
    base: 'WHISKY',
    abv: null,
    ingredients: '',
    note: '여기 갓파더에는 트리플섹이 들어갑니다.',
  },
]

/*
  쿠폰.

  몇 명까지인지는 여기 적지 않는다. 앱은 몇 번째로 연 사람인지 알 수 없고
  (전부 각자 브라우저에서 따로 도는 화면이다), 인원 제한은 카톡방에서 직접 알린다.
  화면이 "선착순 5명"이라고 말해버리면 여섯 번째로 연 사람에게는 앱이 거짓말을 한 셈이 된다.

  화면에는 "받았다"가 아니라 "이렇게 하면 된다"만 적는다.
*/
export const SECRET_COUPON = {
  choices: ['구정문 칵테일바 1잔 이용권', '위스키 1잔'],
} as const
