import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Chip from '../components/Chip'
import { ALL_BARS } from '../domain/bars'
import KakaoMapView from '../map/KakaoMapView'
import type { MapMarker } from '../map/types'
import type { Bar } from '../domain/schema'
import {
  DEFAULT_QUERY,
  DISTRICTS,
  PRICE_BAND_LABEL,
  formatPrice,
  headlineMenu,
  selectBars,
} from '../domain/selectors'
import { useBarQuery } from './useBarQuery'

export default function MapPage() {
  const [query, update] = useBarQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 리스트와 같은 필터를 그대로 적용한다. 두 화면이 다른 결과를 보여주면 혼란스럽다.
  const bars = useMemo(() => selectBars(ALL_BARS, query), [query])

  // 마커는 좌표가 바뀔 때만 새로 만든다. 선택 상태는 여기 넣지 않는다.
  const markers = useMemo<MapMarker[]>(
    () => bars.map((bar) => ({ id: bar.id, name: bar.name, lat: bar.lat, lng: bar.lng })),
    [bars],
  )

  const selectedBar = selectedId === null ? null : (bars.find((bar) => bar.id === selectedId) ?? null)

  // 지도에 칩을 다 늘어놓으면 지도가 안 보인다. 상권만 칩으로 두고 나머지는 한 줄로 알린다.
  const otherFilters: string[] = []
  if (query.beginnerOnly) otherFilters.push('입문자 추천만')
  if (query.priceBand !== DEFAULT_QUERY.priceBand) {
    otherFilters.push(PRICE_BAND_LABEL[query.priceBand])
  }

  const handleSelect = (id: string | null) => setSelectedId(id)

  return (
    <div className="flex h-[calc(100dvh-68px)] flex-col">
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pt-4 pb-2">
        <Chip
          label="전체"
          selected={query.district === '전체'}
          onClick={() => {
            setSelectedId(null)
            update({ district: '전체' })
          }}
        />
        {DISTRICTS.map((district) => (
          <Chip
            key={district}
            label={district}
            selected={query.district === district}
            onClick={() => {
              setSelectedId(null)
              update({ district })
            }}
          />
        ))}
      </div>

      {otherFilters.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2">
          <p className="truncate text-[15px] text-muted">{otherFilters.join(' · ')} 적용 중</p>
          <button
            type="button"
            onClick={() => update({ beginnerOnly: false, priceBand: DEFAULT_QUERY.priceBand })}
            className="shrink-0 text-[15px] text-accent"
          >
            해제
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <KakaoMapView markers={markers} selectedId={selectedId} onSelect={handleSelect} />
        {selectedBar && <BottomSheet bar={selectedBar} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}

/*
  마커를 누르면 올라오는 요약 카드. 카드를 누르면 상세로 간다.
  지도를 가리지 않도록 지도 영역 안쪽 하단에만 걸친다.
*/
function BottomSheet({ bar, onClose }: { bar: Bar; onClose: () => void }) {
  const menu = headlineMenu(bar)

  return (
    <div className="absolute inset-x-0 bottom-0 p-3">
      <div className="relative rounded-2xl border border-line bg-surface p-4 shadow-lg shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-2 right-2 rounded-lg px-3 py-2 text-[15px] text-muted active:bg-surface-2"
        >
          ✕
        </button>

        <Link to={`/bar/${bar.id}`} className="block pr-10">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[18px] font-bold text-text">{bar.name}</h2>
            <span className="text-[15px] text-muted">{bar.district}</span>
          </div>

          {menu && (
            <p className="mt-1.5 text-[15px] text-text">
              {menu.isSignature && <span className="mr-1.5 text-accent">시그니처</span>}
              {menu.name}
              <span className="ml-2 font-semibold">{formatPrice(menu.price)}</span>
            </p>
          )}

          {bar.note && (
            <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{bar.note}</p>
          )}

          <p className="mt-3 text-[15px] font-semibold text-accent">자세히 보기 →</p>
        </Link>
      </div>
    </div>
  )
}
