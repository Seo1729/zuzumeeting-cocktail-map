import { JEONJU_BOUNDS, type Bar, type District, type MenuItem } from './schema'

/*
  필터/정렬/파생값 계산. 순수 함수만 둔다 — React를 import하지 않는다.
  화면이 바뀌어도 이 파일은 그대로 쓸 수 있어야 한다.
*/

export const DISTRICTS = ['대학로', '객사', '신시가지'] as const

/*
  좌표가 전주 안인지.

  방학에 집(서울·부산)에서 앱을 여는 부원이 있다. 그 위치를 지도에 반영하면
  지도가 전국 축척으로 벌어져 정작 봐야 할 바들이 점으로 뭉친다.
  전주 밖이면 지도를 건드리지 않고 안내만 하기 위한 판단 함수다.
*/
export function isInJeonju(lat: number, lng: number): boolean {
  return (
    lat >= JEONJU_BOUNDS.lat.min &&
    lat <= JEONJU_BOUNDS.lat.max &&
    lng >= JEONJU_BOUNDS.lng.min &&
    lng <= JEONJU_BOUNDS.lng.max
  )
}

export type DistrictFilter = District | '전체'

export const SORT_KEYS = ['name', 'price'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export const SORT_LABEL: Record<SortKey, string> = {
  name: '이름순',
  price: '최저가순',
}

/** 가격대 구간. 바의 '최저가' 메뉴를 기준으로 판정한다. */
export const PRICE_BANDS = ['전체', 'under', 'mid', 'over'] as const
export type PriceBand = (typeof PRICE_BANDS)[number]

export const PRICE_BAND_LABEL: Record<PriceBand, string> = {
  전체: '가격 전체',
  under: '1만원 이하',
  mid: '1만 ~ 1.5만원',
  over: '1.5만원 이상',
}

const PRICE_BAND_RANGE: Record<Exclude<PriceBand, '전체'>, [number, number]> = {
  under: [0, 10_000],
  mid: [10_001, 15_000],
  over: [15_001, Number.POSITIVE_INFINITY],
}

export interface BarQuery {
  district: DistrictFilter
  beginnerOnly: boolean
  priceBand: PriceBand
  sort: SortKey
}

export const DEFAULT_QUERY: BarQuery = {
  district: '전체',
  beginnerOnly: false,
  priceBand: '전체',
  sort: 'name',
}

/** 메뉴가 없으면 null. 가격 정렬과 가격대 필터에서 '가격 정보 없음'으로 취급한다. */
export function minPrice(bar: Bar): number | null {
  if (bar.menu.length === 0) return null
  return bar.menu.reduce((low, item) => Math.min(low, item.price), Number.POSITIVE_INFINITY)
}

/** 카드에 한 줄로 보여줄 대표 메뉴. 시그니처가 있으면 그것, 없으면 첫 메뉴. */
export function headlineMenu(bar: Bar): MenuItem | null {
  return bar.menu.find((item) => item.isSignature) ?? bar.menu[0] ?? null
}

/** 시그니처를 위로 올린 메뉴 목록. 원본 배열은 건드리지 않는다. */
export function orderedMenu(bar: Bar): MenuItem[] {
  return [...bar.menu].sort((a, b) => Number(b.isSignature) - Number(a.isSignature))
}

export function matchesQuery(bar: Bar, query: BarQuery): boolean {
  if (query.district !== '전체' && bar.district !== query.district) return false
  if (query.beginnerOnly && !bar.beginnerFriendly) return false

  if (query.priceBand !== '전체') {
    const price = minPrice(bar)
    // 가격 정보가 없는 바는 가격대를 고르면 빠진다. 있다고 단정할 수 없기 때문이다.
    if (price === null) return false
    const [low, high] = PRICE_BAND_RANGE[query.priceBand]
    if (price < low || price > high) return false
  }

  return true
}

export function sortBars(bars: readonly Bar[], sort: SortKey): Bar[] {
  const sorted = [...bars]
  if (sort === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }
  // 최저가순. 메뉴가 없어 가격을 모르는 바는 항상 맨 뒤로 보낸다.
  return sorted.sort((a, b) => {
    const priceA = minPrice(a)
    const priceB = minPrice(b)
    if (priceA === null && priceB === null) return a.name.localeCompare(b.name, 'ko')
    if (priceA === null) return 1
    if (priceB === null) return -1
    if (priceA !== priceB) return priceA - priceB
    return a.name.localeCompare(b.name, 'ko')
  })
}

export function selectBars(bars: readonly Bar[], query: BarQuery): Bar[] {
  return sortBars(
    bars.filter((bar) => matchesQuery(bar, query)),
    query.sort,
  )
}

/** 12000 -> "12,000원" */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}
