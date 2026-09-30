import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_QUERY,
  DISTRICTS,
  PRICE_BANDS,
  SORT_KEYS,
  type BarQuery,
  type DistrictFilter,
  type PriceBand,
  type SortKey,
} from '../domain/selectors'

/*
  필터 상태를 URL 쿼리스트링에 넣는다. 링크를 그대로 복사해 오픈채팅방에 붙여넣으면
  같은 화면이 열려야 하기 때문이다. 상태의 원본은 URL이고 React state는 두지 않는다.
  알 수 없는 값이 들어오면 조용히 기본값으로 되돌린다 — 남이 손으로 고친 링크도 열려야 한다.
*/

const PARAM = {
  district: 'district',
  beginner: 'beginner',
  price: 'price',
  sort: 'sort',
  keyword: 'q',
} as const

/*
  검색어는 길이를 자른다. 주소창에 긴 문자열을 붙여 만든 링크가 돌아다니는 것을 막는다.
  실제 검색어는 길어야 열 글자 안쪽이라 잘릴 일이 없다.
*/
const KEYWORD_MAX = 40

/*
  여기서 trim()하면 안 된다.

  입력창의 값이 URL을 한 바퀴 돌아 이 함수를 거쳐 되돌아오는 구조라, '진 '(공백으로 끝남)을
  치는 순간 뒤 공백이 잘려 '진'으로 돌아온다. 그러면 띄어쓰기를 칠 수가 없어서
  '진 토닉'이 언제나 '진토닉'이 된다. 실제로 그렇게 신고가 들어왔다.

  공백을 지워도 검색 결과는 달라지지 않는다(normalizeForSearch가 공백을 다 지우고 비교한다).
  그래서 화면에 보이는 글자와 URL의 글자는 손대지 않고, 공백뿐인 검색어를 빈 것으로 치는 일은
  값을 URL에 쓰는 쪽(update)이 맡는다.
*/
function parseKeyword(value: string | null): string {
  return (value ?? '').slice(0, KEYWORD_MAX)
}

function parseDistrict(value: string | null): DistrictFilter {
  const found = DISTRICTS.find((district) => district === value)
  return found ?? DEFAULT_QUERY.district
}

function parsePriceBand(value: string | null): PriceBand {
  const found = PRICE_BANDS.find((band) => band === value)
  return found ?? DEFAULT_QUERY.priceBand
}

function parseSort(value: string | null): SortKey {
  const found = SORT_KEYS.find((key) => key === value)
  return found ?? DEFAULT_QUERY.sort
}

export function useBarQuery(): [BarQuery, (patch: Partial<BarQuery>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<BarQuery>(
    () => ({
      district: parseDistrict(searchParams.get(PARAM.district)),
      beginnerOnly: searchParams.get(PARAM.beginner) === '1',
      priceBand: parsePriceBand(searchParams.get(PARAM.price)),
      sort: parseSort(searchParams.get(PARAM.sort)),
      keyword: parseKeyword(searchParams.get(PARAM.keyword)),
    }),
    [searchParams],
  )

  const update = useCallback(
    (patch: Partial<BarQuery>) => {
      const next = { ...query, ...patch }
      const params = new URLSearchParams()
      // 기본값은 URL에 쓰지 않는다. 아무것도 안 고른 상태의 링크가 깔끔해야 한다.
      if (next.district !== DEFAULT_QUERY.district) params.set(PARAM.district, next.district)
      if (next.beginnerOnly) params.set(PARAM.beginner, '1')
      if (next.priceBand !== DEFAULT_QUERY.priceBand) params.set(PARAM.price, next.priceBand)
      if (next.sort !== DEFAULT_QUERY.sort) params.set(PARAM.sort, next.sort)
      // 공백뿐인 검색어는 검색하지 않는 것과 같으니 URL에 남기지 않는다. 맨 앞 공백은 칠 수 없게 된다.
      if (next.keyword.trim() !== '') params.set(PARAM.keyword, next.keyword)
      // replace: 칩을 여러 번 누른 뒤 뒤로가기가 필터 조작 이력에 갇히지 않게 한다.
      setSearchParams(params, { replace: true })
    },
    [query, setSearchParams],
  )

  return [query, update]
}
