import { z } from 'zod'

/*
  이 앱의 단 하나뿐인 데이터 정의.
  bars.json을 손으로 채우다 생기는 오타를 빌드 시점에 잡는 것이 목적이다.
  스키마를 고치면 반드시 `npm run validate`로 기존 데이터가 여전히 통과하는지 확인할 것.
*/

/*
  상권. 앞의 셋은 걸어서 한 바퀴 돌 수 있는 덩어리다 — 실제 좌표로 재보면
  각각 반경 200~500m 안에 모여 있고, 덩어리끼리는 3km쯤 떨어져 있다.
  그래서 상권 칩이 "지금 내가 있는 동네에서 갈 만한 곳"이라는 질문에 답할 수 있다.

  '기타'는 그 셋에 속하지 않는, 전주 곳곳에 흩어진 바를 담는 자리다.
  분류라기보다 대기실에 가깝다 — 서로 몇 km씩 떨어져 있어서 칩으로 걸러봐야
  "그래서 어디 가지"에 답이 안 된다. 흩어진 바는 칩이 아니라 지도에서 찾게 된다.

  같은 동네에 3곳 이상 쌓이면 그때 정식 상권으로 올린다(예: '서신동').
  이 규칙을 지키지 않으면 기타가 계속 불어나 결국 가장 큰 분류가 된다.
*/
export const District = z.enum(['대학로', '객사', '신시가지', '기타'])
export type District = z.infer<typeof District>

/*
  상권을 나타내는 점 색깔. 카드·칩·상세·지도 마커가 모두 이 값을 쓴다.

  세 색은 밝기와 채도를 맞추고 색상만 돌린 것이다(oklch 기준 L·C 고정, H만 변경).
  한 색만 튀면 그 상권이 더 중요해 보인다.

  대학로가 accent와 같은 금색인 것은 우연이 아니다. 지금 11곳 중 6곳이 대학로라
  가장 자주 보이는 색이고, 앱의 기본색과 어긋나면 화면이 두 가지 톤으로 갈린다.

  색만으로 뜻을 전하지는 않는다 — 점 옆에는 항상 상권 이름이 글자로 함께 있다.
*/
export const DISTRICT_DOT: Record<District, string> = {
  대학로: '#e8b45c',
  객사: '#5fc4cd',
  신시가지: '#e79fb8',
  // 기타만 무채색이다. 네 번째 선명한 색을 주면 정식 상권처럼 보이는데,
  // 실제로는 한 덩어리가 아니라 흩어진 것들의 묶음이라 그렇게 보이면 안 된다.
  // --color-muted와 같은 값이라 "덜 중요한 것"이라는 뜻이 화면 전체에서 일관된다.
  기타: '#a1a1ae',
}

/*
  메뉴의 분류. 이름은 '기주'지만 실제로는 메뉴판의 장 제목을 그대로 옮긴 것에 가깝다.
  BEER는 기주가 아니지만 바 메뉴판에 한 장으로 들어 있어 넣을 자리가 필요했다.
*/
export const BaseSpirit = z.enum([
  'GIN',
  'WHISKY',
  'RUM',
  'VODKA',
  'TEQUILA',
  'BRANDY',
  'LIQUEUR',
  'WINE',
  'BEER',
  'NON_ALC',
  'KOREAN_WHISKY'
])
export type BaseSpirit = z.infer<typeof BaseSpirit>

/** 화면에 보여줄 베이스 주류 한글 라벨. */
export const BASE_SPIRIT_LABEL: Record<BaseSpirit, string> = {
  GIN: '진',
  WHISKY: '위스키',
  RUM: '럼',
  VODKA: '보드카',
  TEQUILA: '데킬라',
  BRANDY: '브랜디',
  LIQUEUR: '리큐르',
  WINE: '와인',
  BEER: '맥주',
  NON_ALC: '논알콜',
  KOREAN_WHISKY: '전통주'
}

/*
  전주 시 좌표 범위.

  bars.json 검증(위경도를 바꿔 넣은 오타 잡기)과, 사용자의 현재 위치가 전주 안인지
  판단하는 데 같이 쓴다. 두 곳에 숫자를 따로 적어두면 한쪽만 고치는 사고가 난다.
*/
export const JEONJU_BOUNDS = {
  lat: { min: 35.7, max: 35.9 },
  lng: { min: 127.0, max: 127.3 },
} as const

export const MenuItem = z.object({
  /** "네그로니", "시그니처 - 전주의 밤" */
  name: z.string().min(1),
  /** 원 단위 정수. 12000 → 12,000원. float 금지. */
  price: z.number().int().nonnegative(),
  base: BaseSpirit,
  isSignature: z.boolean().default(false),
  /*
    잔술로 파는 위스키·꼬냑처럼 섞지 않고 그대로 내는 것.

    메뉴 목록에는 똑같이 다 보이고, 가격대 필터와 최저가순 정렬에서만 빠진다.
    부원이 가격으로 바를 고를 때 보려는 것은 칵테일 값이기 때문이다.
    몰트바처럼 메뉴 절반이 잔술인 곳은 이 표시가 없으면 가격대가 통째로
    잔술 값으로 정해져 버린다.
  */
  isStraight: z.boolean().default(false),
  /** 한 줄 설명. 운영진 코멘트. */
  desc: z.string().default(''),
})
export type MenuItem = z.infer<typeof MenuItem>

export const Bar = z.object({
  /** kebab-case slug. URL `/bar/{id}`에 그대로 들어간다. */
  id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case 소문자/숫자/하이픈만 사용할 수 있습니다'),
  name: z.string().min(1),
  district: District,
  address: z.string().min(1),
  /** 전주 범위를 벗어나면 위경도를 바꿔 넣었을 가능성이 높다. */
  lat: z.number().min(JEONJU_BOUNDS.lat.min).max(JEONJU_BOUNDS.lat.max),
  lng: z.number().min(JEONJU_BOUNDS.lng.min).max(JEONJU_BOUNDS.lng.max),
  /** "19:00 - 02:00" */
  hours: z.string().default(''),
  /** ["일"] */
  closedDays: z.array(z.string()).default([]),
  /** ["조용함", "1인 가능", "위스키 강함"] */
  tags: z.array(z.string()).default([]),
  beginnerFriendly: z.boolean().default(false),
  /** 운영진 한 줄 평. 카카오맵에 없는 정보이고 이 앱의 존재 이유다. */
  note: z.string().default(''),
  menu: z.array(MenuItem).default([]),
  instagram: z.url().nullable().default(null),
  /*
    동아리 제휴 할인. 있는 바가 지금은 공백 하나뿐이지만, 특정 바 이름을 코드에
    박아넣지 않고 데이터 필드로 둔다 — 나중에 다른 바가 제휴를 맺어도 bars.json만
    고치면 되고, 이 필드가 정말 하나뿐이라는 사실이 코드 어딘가에 굳어지지 않는다.
    "부원 인증 시 일행 전원 7% 할인"처럼 사람이 읽는 문장 그대로 넣는다.
  */
  discount: z.string().nullable().default(null),
  /** "2026-09" — UI에 반드시 노출한다. */
  dataAsOf: z.string(),
})

export type Bar = z.infer<typeof Bar>

export const BarList = z.array(Bar)
