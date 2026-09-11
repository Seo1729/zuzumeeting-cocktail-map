import { useMemo } from 'react'
import BarCard from '../components/BarCard'
import Chip from '../components/Chip'
import SearchInput from '../components/SearchInput'
import { ALL_BARS } from '../domain/bars'
import {
  DEFAULT_QUERY,
  DISTRICTS,
  PRICE_BANDS,
  PRICE_BAND_LABEL,
  SORT_KEYS,
  SORT_LABEL,
  selectBars,
} from '../domain/selectors'
import { useBarQuery } from './useBarQuery'

export default function ListPage() {
  const [query, update] = useBarQuery()
  const bars = useMemo(() => selectBars(ALL_BARS, query), [query])

  const isFiltered =
    query.district !== DEFAULT_QUERY.district ||
    query.beginnerOnly ||
    query.priceBand !== DEFAULT_QUERY.priceBand ||
    query.keyword !== ''

  return (
    <div>
      <header className="px-4 pt-6 pb-3">
        <h1 className="text-[22px] font-bold">전주 칵테일바</h1>
        <p className="mt-1 text-[15px] text-muted">
          전북대 칵테일 동아리 · 대학로 / 객사 / 신시가지
        </p>
      </header>

      {/*
        검색칸을 칩보다 위에 둔다. 이름을 아는 사람은 칩을 거치지 않고 바로 치는 것이
        가장 빠른 길이고, 이 앱의 목표가 "3초 안에 정하기"다.
      */}
      <div className="px-4 pb-3">
        <SearchInput
          label="바 검색"
          value={query.keyword}
          onChange={(keyword) => update({ keyword })}
          placeholder="바 이름, 분위기, 한 줄 평으로 검색"
        />
      </div>

      {/* 상권 필터 */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip
          label="전체"
          selected={query.district === '전체'}
          onClick={() => update({ district: '전체' })}
        />
        {DISTRICTS.map((district) => (
          <Chip
            key={district}
            label={district}
            selected={query.district === district}
            onClick={() => update({ district })}
          />
        ))}
      </div>

      {/* 보조 필터: 입문자 추천 + 가격대 */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip
          label="입문자 추천만"
          selected={query.beginnerOnly}
          onClick={() => update({ beginnerOnly: !query.beginnerOnly })}
        />
        {PRICE_BANDS.map((band) => (
          <Chip
            key={band}
            label={PRICE_BAND_LABEL[band]}
            selected={query.priceBand === band}
            onClick={() => update({ priceBand: band })}
          />
        ))}
      </div>

      {/* 결과 수 + 정렬 */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[15px] text-muted">{bars.length}곳</p>
        <div className="flex gap-1.5">
          {SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ sort: key })}
              aria-pressed={query.sort === key}
              className={[
                'rounded-lg px-3 py-2 text-[15px] transition-colors',
                query.sort === key ? 'bg-surface-2 font-semibold text-text' : 'text-muted',
              ].join(' ')}
            >
              {SORT_LABEL[key]}
            </button>
          ))}
        </div>
      </div>

      {bars.length === 0 ? (
        <EmptyState
          keyword={query.keyword}
          onReset={() => update(DEFAULT_QUERY)}
          showReset={isFiltered}
        />
      ) : (
        <ul className="flex flex-col gap-3 px-4 pb-6">
          {bars.map((bar) => (
            <li key={bar.id}>
              <BarCard bar={bar} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
  /*
    검색어를 그대로 되돌려 보여준다. 오타를 친 경우 "조건에 맞는 바가 없습니다"만 보면
    앱이 고장난 줄 알지만, 자기가 친 글자를 보면 바로 안다.
  */
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-[16px] text-muted">
        {keyword !== '' ? `'${keyword}' 검색 결과가 없습니다.` : '조건에 맞는 바가 없습니다.'}
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
