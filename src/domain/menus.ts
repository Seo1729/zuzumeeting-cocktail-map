import { BaseSpirit, District, type Bar, type MenuItem } from './schema'

/*
  "이 칵테일, 어디가 제일 싼가"에 답하기 위한 계산.
  selectors.ts와 마찬가지로 순수 함수만 둔다 — React를 import하지 않는다.

  파일을 나눈 이유: selectors.ts는 '바를 고르는' 로직이고 여기는 '메뉴를 모으는'
  로직이라 서로를 부르지 않는다. 한 파일에 두면 250줄짜리가 되면서 둘 다 찾기 어려워진다.
*/

/** 한 바가 파는 메뉴 한 줄. */
export interface MenuOffering {
  barId: string
  barName: string
  district: District
  price: number
  /** 그 바 메뉴판 표기 그대로. '진토닉'과 '진 토닉'을 억지로 통일하지 않는다. */
  displayName: string
  isSignature: boolean
  isStraight: boolean
  desc: string
}

/** 같은 메뉴를 파는 바들의 묶음. */
export interface MenuGroup {
  /** 그룹을 찾는 키이자 URL에 들어가는 값. makeGroupKey가 만든다. */
  key: string
  /** 화면에 쓸 대표 표기. 가장 많은 바가 쓰는 표기를 고른다. */
  name: string
  base: BaseSpirit
  /** 잔으로 파는 그룹인지 병으로 파는 그룹인지. 둘은 절대 같은 그룹이 되지 않는다. */
  serving: MenuItem['serving']
  /** 가격 오름차순. 맨 앞이 제일 싼 곳이다. */
  offerings: MenuOffering[]
  minPrice: number
  maxPrice: number
}

/*
  그룹 키. 이름만으로는 부족하고 잔/보틀까지 봐야 한 상품이다.

  잔일 때는 이름만 쓴다. 66개 중 대부분이 잔이라, 공유하는 주소가
  '#/menu/네그로니'처럼 읽히는 편이 낫기 때문이다.
  보틀만 뒤에 표시를 붙여 '#/menu/맥캘란12년@bottle'이 된다.
*/
export function makeGroupKey(name: string, serving: MenuItem['serving']): string {
  const base = normalizeMenuName(name)
  return serving === 'glass' ? base : `${base}@${serving}`
}

/*
  같은 칵테일인지 판단하는 기준.

  메뉴 이름은 바마다 다른 메뉴판을 보고 손으로 옮긴 것이라 표기가 흔들린다.
  실제 데이터에서 '진 토닉/진토닉', '올드 패션드/올드패션드', '맥캘란 12년/맥캘란12년'처럼
  띄어쓰기만 다른 경우가 33건 있었다. 그대로 두면 같은 술이 서로 다른 칵테일로 갈라져
  "네그로니 어디가 싸"에 4곳만 나온다.

  bars.json의 이름을 통일하지 않는 이유는 둘이다.
  하나, 각 바 메뉴판의 원문이 맞다 — 부원이 그 가게에서 찾을 때 헷갈리면 안 된다.
  둘, 통일해봐야 새 바를 추가할 때마다 같은 문제가 되풀이된다.

  유사도 매칭(레벤슈타인 등)은 쓰지 않는다. '진 피즈'와 '카카오 피즈'를 묶어버리는
  사고가 얻는 것보다 크다. 공백과 몇몇 기호, 그리고 아래 연식 표기까지만 손댄다.

  연식: 위스키는 같은 술을 바마다 '라가불린 16년'과 '라가불린 16Y'로 달리 적는다.
  실제로 오브와 잉크 사이에 이런 짝이 넷 있었고(라가불린 8·16년, 아드벡 10년,
  발베니 12년) 그만큼 비교를 놓치고 있었다.
  숫자 바로 뒤에서만 바꾸므로 '년'이 들어간 다른 이름을 건드리지 않는다.
*/
export function normalizeMenuName(name: string): string {
  return name
    .replace(/[\s·・∙\-–—~()[\]]+/g, '')
    .toLowerCase()
    .replace(/(\d+)(년|yo)/g, '$1y')
}

/*
  모든 바의 메뉴를 훑어 같은 것끼리 묶는다.

  412개 항목을 매 렌더마다 다시 묶으면 낭비라, 호출하는 쪽에서 한 번만 계산해 둔다
  (domain/bars.ts의 ALL_MENU_GROUPS).
*/
export function buildMenuGroups(bars: readonly Bar[]): MenuGroup[] {
  const buckets = new Map<string, MenuOffering[]>()
  // 대표 표기를 고르려면 어떤 표기를 몇 곳이 쓰는지 세어야 한다.
  const spellings = new Map<string, Map<string, number>>()
  const bases = new Map<string, Map<BaseSpirit, number>>()

  const servings = new Map<string, MenuItem['serving']>()

  for (const bar of bars) {
    for (const item of bar.menu) {
      if (normalizeMenuName(item.name) === '') continue
      const key = makeGroupKey(item.name, item.serving)

      const offering: MenuOffering = {
        barId: bar.id,
        barName: bar.name,
        district: bar.district,
        price: item.price,
        displayName: item.name,
        isSignature: item.isSignature,
        isStraight: item.isStraight,
        desc: item.desc,
      }

      const bucket = buckets.get(key)
      if (bucket) bucket.push(offering)
      else buckets.set(key, [offering])

      countUp(spellings, key, item.name)
      countUp(bases, key, item.base)
      servings.set(key, item.serving)
    }
  }

  const groups: MenuGroup[] = []
  for (const [key, offerings] of buckets) {
    // 가격 오름차순. 같은 값이면 바 이름순으로 고정해, 렌더할 때마다 순서가 흔들리지 않게 한다.
    const sorted = [...offerings].sort(
      (a, b) => a.price - b.price || a.barName.localeCompare(b.barName, 'ko'),
    )
    groups.push({
      key,
      name: mostCommon(spellings.get(key)) ?? sorted[0]!.displayName,
      /*
        기주는 최빈값을 쓴다. 지금 데이터에서는 바마다 엇갈리는 경우가 0건이라
        아무거나 써도 같지만, 예전에 카카오 피즈를 GIN으로 잘못 넣은 적이 있다.
        한 곳이 틀려도 나머지가 맞으면 옳은 값이 살아남게 해 둔다.
      */
      base: mostCommon(bases.get(key))!,
      // 키 자체가 serving으로 갈라져 있어, 한 그룹 안의 값은 전부 같다.
      serving: servings.get(key)!,
      offerings: sorted,
      minPrice: sorted[0]!.price,
      maxPrice: sorted[sorted.length - 1]!.price,
    })
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

/** 두 곳 이상에서 파는 것만. 가격 비교가 의미를 갖는 메뉴들이다. */
export function comparableGroups(groups: readonly MenuGroup[]): MenuGroup[] {
  return groups.filter((group) => barCount(group) > 1)
}

/*
  한 메뉴를 파는 '바'의 수.

  offerings.length를 그대로 쓰지 않는 이유: 한 바가 같은 이름을 두 줄로 올릴 수 있다
  (예: 잔과 보틀, 싱글과 더블). 그걸 2곳으로 세면 비교 대상이 아닌데 비교 대상처럼 보인다.
*/
export function barCount(group: MenuGroup): number {
  return new Set(group.offerings.map((offering) => offering.barId)).size
}

/** 최저가와 최고가의 차이. 0이면 어디서 마시든 같은 값이다. */
export function priceSpread(group: MenuGroup): number {
  return group.maxPrice - group.minPrice
}

const DISTRICT_ORDER = new Map(District.options.map((district, index) => [district, index]))

/*
  화면에 늘어놓을 순서. 상권끼리 묶고 그 안에서만 값이 싼 쪽을 앞에 둔다.

  값이 싼 순으로 전체를 줄 세우지 않는 이유가 있다.
  칵테일 값은 술의 급, 잔의 양, 만드는 손이 다 들어간 값이라 싼 쪽이 나은 쪽이라는
  뜻이 아니다. 그런데 한 줄로 세워 놓으면 맨 위가 1등으로 읽힌다.
  같은 앱에서 아람을 "구정문을 대표하는 몰트바의 정석"이라고 써 놓고 목록 맨 아래에
  두는 것은 앱이 스스로 말을 뒤집는 일이고, 무엇보다 이 가게들은 동아리가 실제로
  드나드는 곳이다.

  상권으로 묶으면 뽑는 답이 "어디가 제일 싸냐"에서 "내가 갈 동네에서 얼마냐"로 바뀐다.
  상권은 이 앱의 중심 축이기도 하다.
*/
export function offeringsByDistrict(group: MenuGroup): MenuOffering[] {
  return [...group.offerings].sort(
    (a, b) =>
      (DISTRICT_ORDER.get(a.district) ?? 0) - (DISTRICT_ORDER.get(b.district) ?? 0) ||
      a.price - b.price ||
      a.barName.localeCompare(b.barName, 'ko'),
  )
}

export function findMenuGroup(
  groups: readonly MenuGroup[],
  key: string,
): MenuGroup | undefined {
  /*
    주소창에 '진 토닉'처럼 띄어쓰기를 넣어 쳐도 찾아지게 한 번 더 정규화한다.
    '@bottle' 같은 꼬리표는 정규화 대상이 아니라 떼어냈다가 다시 붙인다 —
    normalizeMenuName이 기호를 지우므로 그대로 넘기면 꼬리표가 사라진다.
  */
  const at = key.lastIndexOf('@')
  const normalized =
    at === -1
      ? normalizeMenuName(key)
      : `${normalizeMenuName(key.slice(0, at))}${key.slice(at)}`
  return groups.find((group) => group.key === normalized)
}

/*
  검색. 이름에 검색어가 들어 있으면 맞다고 본다.

  검색어도 정규화하므로 '진토닉'으로 쳐도 '진 토닉'이 나온다.
  각 바의 표기까지 뒤지는 이유는, 대표 표기가 '진 토닉'인데 어떤 바는 '진토닉'으로
  적어둔 경우에도 그 바 표기로 검색할 수 있어야 하기 때문이다.
*/
export function searchMenuGroups(
  groups: readonly MenuGroup[],
  query: string,
): MenuGroup[] {
  const needle = normalizeMenuName(query)
  if (needle === '') return [...groups]
  return groups.filter(
    (group) =>
      group.key.includes(needle) ||
      group.offerings.some((offering) =>
        normalizeMenuName(offering.displayName).includes(needle),
      ),
  )
}

// --- 화면이 쓰는 필터·정렬 ---

/*
  기주 칩 목록. DISTRICTS와 같은 이유로 스키마에서 가져온다.
  BEER나 전통주가 늘어도 여기를 고칠 일이 없다.
*/
export const MENU_BASES = BaseSpirit.options

export type BaseFilter = BaseSpirit | '전체'

export const MENU_SORT_KEYS = ['name', 'price'] as const
export type MenuSortKey = (typeof MENU_SORT_KEYS)[number]

export const MENU_SORT_LABEL: Record<MenuSortKey, string> = {
  name: '이름순',
  price: '최저가순',
}

export interface MenuQuery {
  keyword: string
  base: BaseFilter
  /*
    두 곳 이상에서 파는 것만 보기.

    이 화면의 핵심은 "같은 술이 어디가 싼가"인데, 268종 중 그게 성립하는 건 65종뿐이다.
    나머지 203종은 한 곳에서만 파는 것이라 비교할 상대가 없다.
    켜면 비교 가능한 것만 남아, 값을 견줘볼 만한 목록이 된다.
  */
  multiOnly: boolean
  sort: MenuSortKey
}

export const DEFAULT_MENU_QUERY: MenuQuery = {
  keyword: '',
  base: '전체',
  multiOnly: false,
  sort: 'name',
}

export function selectMenuGroups(
  groups: readonly MenuGroup[],
  query: MenuQuery,
): MenuGroup[] {
  let result = searchMenuGroups(groups, query.keyword)
  if (query.base !== '전체') result = result.filter((group) => group.base === query.base)
  if (query.multiOnly) result = comparableGroups(result)

  if (query.sort === 'price') {
    // 같은 최저가끼리는 이름으로 묶어, 목록이 뜰 때마다 순서가 흔들리지 않게 한다.
    return result.sort(
      (a, b) => a.minPrice - b.minPrice || a.name.localeCompare(b.name, 'ko'),
    )
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

// --- 내부 도우미 ---

function countUp<K>(table: Map<string, Map<K, number>>, key: string, value: K): void {
  let counts = table.get(key)
  if (!counts) {
    counts = new Map<K, number>()
    table.set(key, counts)
  }
  counts.set(value, (counts.get(value) ?? 0) + 1)
}

/*
  가장 많이 나온 값.

  동점일 때 '먼저 나온 것'을 쓰면 bars.json에 바를 적은 순서가 답을 정한다.
  실제로 1:1로 갈리는 표기가 17건 있어서('말리부오렌지'와 '말리부 오렌지' 같은),
  데이터에서 바 순서만 바꿔도 화면의 이름이 뒤집힌다.
  그래서 동점이면 사전순으로 앞선 것을 쓴다 — 데이터 순서와 무관하게 늘 같은 답이 나온다.
*/
function mostCommon<K>(counts: Map<K, number> | undefined): K | undefined {
  if (!counts) return undefined
  let best: K | undefined
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    } else if (count === bestCount && best !== undefined) {
      if (String(value).localeCompare(String(best), 'ko') < 0) best = value
    }
  }
  return best
}
