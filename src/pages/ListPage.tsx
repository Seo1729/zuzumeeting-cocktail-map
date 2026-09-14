import { useMemo } from 'react'
import BarCard from '../components/BarCard'
import Chip from '../components/Chip'
import SearchInput from '../components/SearchInput'
import { ALL_BARS } from '../domain/bars'
import { DISTRICT_DOT } from '../domain/schema'
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
      {/*
        pt는 노치 높이(기기마다 다름) 위에 24px을 더 얹은 값이다.

        동아리 이름을 제목 위로 올렸다. 전에는 제목 아래 한 줄에 동아리 이름과 상권이
        함께 묻혀 있었는데, 부원에게 처음 보이는 화면이라 "누가 만든 것인가"가 먼저 와야 한다.
      */}
      <header className="px-4 pt-[calc(24px+env(safe-area-inset-top))] pb-3.5">
        <div className="flex items-center gap-[7px]">
          <span aria-hidden="true" className="h-[13px] w-[3px] rounded-sm bg-accent" />
          <p className="text-[15px] font-semibold tracking-[0.06em] text-accent">
            전북대 칵테일 동아리
          </p>
        </div>
        <h1 className="mt-[7px] text-[27px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          전주 칵테일바
        </h1>
        {/*
          예전에는 상권 이름 셋을 여기 적어뒀는데, 상권이 늘 때마다 같이 고쳐야 했고
          실제로 '기타'를 추가할 때 어긋났다. 바로 아래 칩 줄이 이미 상권 목록이라
          같은 정보를 두 번 보여줄 이유도 없다.
        */}
        <p className="mt-1 text-[15px] text-muted">
          전주 시내{' '}
          <span className="font-semibold text-text/85">{ALL_BARS.length}곳</span>
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
            dotColor={DISTRICT_DOT[district]}
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

      {/*
        결과 수 + 정렬.

        정렬은 버튼 두 개가 그냥 떠 있었다. 고른 쪽만 배경이 생기니 안 고른 쪽은
        누를 수 있는 것인지조차 애매했다. 둘을 한 트랙에 담아 하나의 스위치로 읽히게 한다.
      */}
      <div className="flex items-center justify-between px-4 pt-1.5 pb-3.5">
        <p className="text-[15px] text-muted">
          <span className="font-bold text-text">{bars.length}</span>곳
        </p>
        <div className="flex gap-[3px] rounded-[11px] border border-surface-2 bg-ink/60 p-[3px]">
          {SORT_KEYS.map((key) => (
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
