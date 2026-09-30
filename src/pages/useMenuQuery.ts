import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEFAULT_MENU_QUERY,
  MENU_BASES,
  MENU_SORT_KEYS,
  type BaseFilter,
  type MenuQuery,
  type MenuSortKey,
} from '../domain/menus'

/*
  메뉴 화면의 필터를 URL에 넣는다. useBarQuery와 같은 규칙을 따른다 —
  상태의 원본은 URL이고, 알 수 없는 값이 들어오면 조용히 기본값으로 되돌린다.

  바 화면과 파라미터 이름이 겹쳐도 상관없다. 서로 다른 경로(/ 와 /menu)라
  한 주소에 둘이 같이 실리는 일이 없다.
*/

const PARAM = {
  keyword: 'q',
  base: 'base',
  multi: 'multi',
  sort: 'sort',
} as const

/** useBarQuery와 같은 값. 주소창에 긴 문자열을 붙여 만든 링크가 돌아다니는 것을 막는다. */
const KEYWORD_MAX = 40

/*
  trim()하지 않는다 — 입력창 값이 URL을 한 바퀴 돌아오므로, 뒤 공백을 자르면 띄어쓰기를
  칠 수 없다. 자세한 이유는 useBarQuery의 같은 함수 주석을 볼 것.
*/
function parseKeyword(value: string | null): string {
  return (value ?? '').slice(0, KEYWORD_MAX)
}

function parseBase(value: string | null): BaseFilter {
  const found = MENU_BASES.find((base) => base === value)
  return found ?? DEFAULT_MENU_QUERY.base
}

function parseSort(value: string | null): MenuSortKey {
  const found = MENU_SORT_KEYS.find((key) => key === value)
  return found ?? DEFAULT_MENU_QUERY.sort
}

export function useMenuQuery(): [MenuQuery, (patch: Partial<MenuQuery>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<MenuQuery>(
    () => ({
      keyword: parseKeyword(searchParams.get(PARAM.keyword)),
      base: parseBase(searchParams.get(PARAM.base)),
      multiOnly: searchParams.get(PARAM.multi) === '1',
      sort: parseSort(searchParams.get(PARAM.sort)),
    }),
    [searchParams],
  )

  const update = useCallback(
    (patch: Partial<MenuQuery>) => {
      const next = { ...query, ...patch }
      const params = new URLSearchParams()
      if (next.keyword.trim() !== '') params.set(PARAM.keyword, next.keyword)
      if (next.base !== DEFAULT_MENU_QUERY.base) params.set(PARAM.base, next.base)
      if (next.multiOnly) params.set(PARAM.multi, '1')
      if (next.sort !== DEFAULT_MENU_QUERY.sort) params.set(PARAM.sort, next.sort)
      setSearchParams(params, { replace: true })
    },
    [query, setSearchParams],
  )

  return [query, update]
}
