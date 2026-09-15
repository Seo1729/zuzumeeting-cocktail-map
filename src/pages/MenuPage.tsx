import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Chip from '../components/Chip'
import SearchInput from '../components/SearchInput'
import { ALL_MENU_GROUPS } from '../domain/bars'
import {
  DEFAULT_MENU_QUERY,
  MENU_BASES,
  MENU_SORT_KEYS,
  MENU_SORT_LABEL,
  barCount,
  comparableGroups,
  selectMenuGroups,
  type MenuGroup,
} from '../domain/menus'
import { BASE_SPIRIT_LABEL } from '../domain/schema'
import { formatPrice } from '../domain/selectors'
import { useMenuQuery } from './useMenuQuery'

/*
  칵테일로 바를 찾는 화면.

  리스트 화면이 "어디 갈까"에 답한다면 여기는 "뭘 시킬까"에 답한다.
  같은 네그로니가 바에 따라 12,000원과 18,000원으로 갈리는데, 그건 이 앱에만 있는
  정보다 — 카카오맵에도 네이버에도 각 바의 메뉴판이 모여 있지 않기 때문이다.
*/
export default function MenuPage() {
  const [query, update] = useMenuQuery()
  const groups = useMemo(() => selectMenuGroups(ALL_MENU_GROUPS, query), [query])

  // 토글 라벨에 개수를 박아, 켜기 전에 얼마나 줄어들지 미리 알 수 있게 한다.
  const comparableCount = useMemo(() => comparableGroups(ALL_MENU_GROUPS).length, [])

  const isFiltered =
    query.keyword !== '' ||
    query.base !== DEFAULT_MENU_QUERY.base ||
    query.multiOnly

  return (
    <div>
      <header className="px-4 pt-[calc(24px+env(safe-area-inset-top))] pb-3.5">
        <div className="flex items-center gap-[7px]">
          <span aria-hidden="true" className="h-[13px] w-[3px] rounded-sm bg-accent" />
          <p className="text-[15px] font-semibold tracking-[0.06em] text-accent">
            뭘 시킬까
          </p>
        </div>
        <h1 className="mt-[7px] text-[27px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          칵테일 찾기
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          <span className="font-semibold text-text/85">{ALL_MENU_GROUPS.length}종</span>
          {' 중 '}
          <span className="font-semibold text-text/85">{comparableCount}종</span>
          은 여러 곳에서 팝니다
        </p>
      </header>

      <div className="px-4 pb-3">
        <SearchInput
          label="칵테일 검색"
          value={query.keyword}
          onChange={(keyword) => update({ keyword })}
          placeholder="칵테일 이름으로 검색"
        />
      </div>

      {/*
        기주 칩. 11종이라 한 줄에 다 안 들어가지만, 가로 스크롤로 두는 편이
        접었다 펴는 것보다 빠르다 — 찾는 기주는 대개 앞쪽(진·위스키·럼)에 있다.
      */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip
          label="전체"
          selected={query.base === '전체'}
          onClick={() => update({ base: '전체' })}
        />
        {MENU_BASES.map((base) => (
          <Chip
            key={base}
            label={BASE_SPIRIT_LABEL[base]}
            selected={query.base === base}
            onClick={() => update({ base })}
          />
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip
          label={`여러 곳에서 파는 것만 (${comparableCount})`}
          selected={query.multiOnly}
          onClick={() => update({ multiOnly: !query.multiOnly })}
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-1.5 pb-3.5">
        <p className="text-[15px] text-muted">
          <span className="font-bold text-text">{groups.length}</span>종
        </p>
        <div className="flex gap-[3px] rounded-[11px] border border-surface-2 bg-ink/60 p-[3px]">
          {MENU_SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ sort: key })}
              aria-pressed={query.sort === key}
              className={[
                'rounded-lg px-3 py-2 text-[15px] transition-colors',
                query.sort === key ? 'bg-surface-2 font-bold text-text' : 'text-muted',
              ].join(' ')}
            >
              {MENU_SORT_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          keyword={query.keyword}
          onReset={() => update(DEFAULT_MENU_QUERY)}
          showReset={isFiltered}
        />
      ) : (
        <ul className="flex flex-col gap-3 px-4 pb-6">
          {groups.map((group) => (
            <li key={group.key}>
              <MenuGroupCard group={group} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/*
  칵테일 한 종. 누르면 매장별 가격을 펼쳐 보여주는 화면으로 간다.

  카드에는 값의 폭과 파는 곳 수까지만 둔다. 어느 가게가 얼마인지는 들어가서 본다.
*/
function MenuGroupCard({ group }: { group: MenuGroup }) {
  const bars = barCount(group)
  const only = group.offerings[0]!
  const hasSpread = group.minPrice !== group.maxPrice

  return (
    <Link
      to={`/menu/${encodeURIComponent(group.key)}`}
      className="block rounded-2xl border border-line bg-surface p-4 active:bg-surface-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold text-text">{group.name}</h2>
        <span className="shrink-0 text-[15px] text-muted">
          {BASE_SPIRIT_LABEL[group.base]}
          {group.serving === 'bottle' && ' · 보틀'}
        </span>
      </div>

      {/*
        값의 폭을 한 덩어리로 같은 굵기·같은 색으로 쓴다.
        낮은 쪽만 색을 주면 "여기부터 싸게 마실 수 있다"는 말로 읽혀,
        값이 비싼 가게가 손해를 보는 표시가 된다.
      */}
      <p className="mt-1.5 text-[15px] font-bold text-text">
        {hasSpread
          ? `${formatPrice(group.minPrice)} ~ ${formatPrice(group.maxPrice)}`
          : formatPrice(group.minPrice)}
      </p>

      {/*
        여러 곳에서 팔면 '몇 곳'까지만 쓴다. 어디가 제일 싼지는 여기서 짚지 않는다 —
        칵테일 값은 술의 급과 잔의 양이 함께 들어간 값이라 싼 쪽이 나은 쪽이 아니고,
        이 가게들은 동아리가 실제로 드나드는 곳이다. 매장별 값은 눌러 들어가면 나온다.

        한 곳에서만 파는 것은 "1곳"이라고 세지 않는다. 숫자를 보여주면 비교할 수 있다는
        뜻으로 읽히는데 견줄 상대가 없다. 대신 그 바 이름을 바로 보여준다.
      */}
      <p className="mt-1 text-[15px] text-muted">
        {bars > 1 ? (
          <span className="font-semibold text-text/85">{bars}곳</span>
        ) : (
          `${only.barName} · ${only.district}`
        )}
      </p>
    </Link>
  )
}

function EmptyState({
  keyword,
  onReset,
  showReset,
}: {
  keyword: string
  onReset: () => void
  showReset: boolean
}) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-[16px] text-muted">
        {keyword !== ''
          ? `'${keyword}' 검색 결과가 없습니다.`
          : '조건에 맞는 칵테일이 없습니다.'}
      </p>
      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-full border border-line px-5 py-2.5 text-[15px] text-text active:bg-surface-2"
        >
          필터 초기화
        </button>
      )}
    </div>
  )
}
