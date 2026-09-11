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
  isInJeonju,
  selectBars,
} from '../domain/selectors'
import { useBarQuery } from './useBarQuery'
import { useUserLocation, type LocationError } from './useUserLocation'

const LOCATION_ERROR_MESSAGE: Record<LocationError, string> = {
  denied: '위치 권한이 꺼져 있습니다. 주소창의 자물쇠 아이콘에서 허용으로 바꿔주세요.',
  unsupported: '이 브라우저에서는 현재 위치를 쓸 수 없습니다.',
  timeout: '위치를 확인하지 못했습니다. 실내에서는 잘 안 잡힙니다.',
  unavailable: '위치를 확인하지 못했습니다.',
}

export default function MapPage() {
  const [query, update] = useBarQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const geo = useUserLocation()

  // 리스트와 같은 필터를 그대로 적용한다. 두 화면이 다른 결과를 보여주면 혼란스럽다.
  const bars = useMemo(() => selectBars(ALL_BARS, query), [query])

  // 마커는 좌표가 바뀔 때만 새로 만든다. 선택 상태는 여기 넣지 않는다.
  const markers = useMemo<MapMarker[]>(
    () => bars.map((bar) => ({ id: bar.id, name: bar.name, lat: bar.lat, lng: bar.lng })),
    [bars],
  )

  const selectedBar = selectedId === null ? null : (bars.find((bar) => bar.id === selectedId) ?? null)

  /*
    지도에 칩을 다 늘어놓으면 지도가 안 보인다. 상권만 칩으로 두고 나머지는 한 줄로 알린다.

    검색어도 여기 넣는다. 리스트에서 검색하고 지도로 넘어오면 같은 필터가 걸린 채라
    핀이 줄어드는데, 지도에는 검색칸이 없어서 왜 줄었는지 알 방법이 없다.
    지도까지 검색칸을 넣는 대신(지도를 가린다) 이 한 줄로 알리고 해제할 수 있게 한다.
  */
  const otherFilters: string[] = []
  if (query.keyword !== '') otherFilters.push(`'${query.keyword}' 검색`)
  if (query.beginnerOnly) otherFilters.push('입문자 추천만')
  if (query.priceBand !== DEFAULT_QUERY.priceBand) {
    otherFilters.push(PRICE_BAND_LABEL[query.priceBand])
  }

  const handleSelect = (id: string | null) => setSelectedId(id)

  /*
    "전주 밖이면 지도에 반영하지 않는다"는 도메인 판단이라 여기서 거른다.
    KakaoMapView에 전주라는 개념을 넣으면 지도 레이어가 이 앱 전용이 되어버린다.

    방학에 집에서 앱을 열면 지도가 전국 축척으로 벌어져 정작 봐야 할 바들이 뭉친다.
    그래서 좌표는 받았어도 null을 넘기고, 대신 아래에서 안내 문구를 띄운다.
  */
  const outsideJeonju =
    geo.location !== null && !isInJeonju(geo.location.lat, geo.location.lng)
  const userLocation = outsideJeonju ? null : geo.location

  const locationNotice = outsideJeonju
    ? '현재 위치가 전주 밖이라 지도에 표시하지 않았습니다.'
    : geo.status === 'error' && geo.error !== null
      ? LOCATION_ERROR_MESSAGE[geo.error]
      : null

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
            onClick={() =>
              update({
                keyword: '',
                beginnerOnly: false,
                priceBand: DEFAULT_QUERY.priceBand,
              })
            }
            className="shrink-0 text-[15px] text-accent"
          >
            해제
          </button>
        </div>
      )}

      {locationNotice && (
        <p className="shrink-0 px-4 pb-2 text-[15px] leading-relaxed text-muted">
          {locationNotice}
        </p>
      )}

      <div className="relative min-h-0 flex-1">
        <KakaoMapView
          markers={markers}
          selectedId={selectedId}
          onSelect={handleSelect}
          userLocation={userLocation}
        />

        {/*
          우하단이 아니라 우상단에 두는 이유: 마커를 누르면 바텀시트가 하단을 덮는다.
          지도 앱 관례는 우하단이지만, 여기서는 눌리지 않는 버튼이 되는 쪽이 더 나쁘다.
        */}
        <button
          type="button"
          onClick={geo.request}
          disabled={geo.status === 'requesting'}
          className="absolute top-3 right-3 z-10 rounded-full border border-line bg-surface/95 px-4 py-2.5 text-[15px] font-medium text-text shadow-lg shadow-black/30 backdrop-blur active:bg-surface-2 disabled:text-muted"
        >
          {geo.status === 'requesting' ? '확인 중…' : '내 위치'}
        </button>

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

  // z-10은 지도 위라는 것을 눈에 보이게 못박아 두는 것이다.
  // 실제로 지도의 z-index를 가두는 것은 KakaoMapView 쪽의 isolate다.
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-3">
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
