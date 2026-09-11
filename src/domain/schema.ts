import { z } from 'zod'

/*
  이 앱의 단 하나뿐인 데이터 정의.
  bars.json을 손으로 채우다 생기는 오타를 빌드 시점에 잡는 것이 목적이다.
  스키마를 고치면 반드시 `npm run validate`로 기존 데이터가 여전히 통과하는지 확인할 것.
*/

export const District = z.enum(['대학로', '객사', '신시가지'])
export type District = z.infer<typeof District>

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
  /** "2026-09" — UI에 반드시 노출한다. */
  dataAsOf: z.string(),
})

export type Bar = z.infer<typeof Bar>

export const BarList = z.array(Bar)
