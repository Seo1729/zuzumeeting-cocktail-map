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
} as const

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
      // replace: 칩을 여러 번 누른 뒤 뒤로가기가 필터 조작 이력에 갇히지 않게 한다.
      setSearchParams(params, { replace: true })
    },
    [query, setSearchParams],
  )

  return [query, update]
}
