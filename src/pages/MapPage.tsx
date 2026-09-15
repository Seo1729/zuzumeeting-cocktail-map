import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Chip from '../components/Chip'
import { ALL_BARS } from '../domain/bars'
import KakaoMapView from '../map/KakaoMapView'
import type { MapMarker } from '../map/types'
import { DISTRICT_DOT, type Bar } from '../domain/schema'
import { isSecretBar } from '../domain/secret'
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
import { useSecretUnlock } from './useSecretUnlock'
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
    () =>
      bars.map((bar) => ({
        id: bar.id,
        name: bar.name,
        lat: bar.lat,
        lng: bar.lng,
        dotColor: DISTRICT_DOT[bar.district],
        // 잠긴 핀인지 정하는 것은 도메인의 몫이다. 지도는 불리언만 받는다.
        locked: isSecretBar(bar.id),
      })),
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
    <div className="flex h-[calc(100dvh-var(--tabbar-h))] flex-col">
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-2">
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
            dotColor={DISTRICT_DOT[district]}
          />
        ))}
      </div>

      {/*
        리스트에서 건 필터가 지도에도 걸려 있다는 알림.
        깔때기 아이콘을 붙이고 '해제'를 테두리 있는 버튼으로 바꿨다.
        전에는 맨 글자라 누를 수 있는 것인지 알기 어려웠다.
      */}
      {otherFilters.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-2.5 px-4 pb-2.5">
          <div className="flex min-w-0 items-center gap-[7px]">
            <FunnelIcon />
            <p className="truncate text-[15px] text-muted">{otherFilters.join(' · ')} 적용 중</p>
          </div>
          <button
            type="button"
            onClick={() =>
              update({
                keyword: '',
                beginnerOnly: false,
                priceBand: DEFAULT_QUERY.priceBand,
              })
            }
            className="shrink-0 rounded-lg border border-line px-[11px] py-1.5 text-[15px] font-semibold text-text active:bg-surface-2"
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
  /*
    잠긴 바는 평도 메뉴도 없어서 그냥 두면 이름 한 줄만 뜬다 — 정보가 없어서 비어 보이는
    카드와 구별이 안 된다. 핀에 자물쇠를 그려 놓고 시트에서 아무 말도 안 하면 앞뒤가 안 맞는다.
  */
  const locked = isSecretBar(bar.id)
  // 이미 푼 사람에게는 "잠겨 있다"가 틀린 말이 된다. 리스트 카드와 같은 처리다.
  const { unlockedAt } = useSecretUnlock()
  const stillLocked = locked && unlockedAt === null

  // z-10은 지도 위라는 것을 눈에 보이게 못박아 두는 것이다.
  // 실제로 지도의 z-index를 가두는 것은 KakaoMapView 쪽의 isolate다.
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-3">
      <div className="relative rounded-[18px] border border-line bg-gradient-to-b from-[#1a1a23] to-surface px-4 pt-[15px] pb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_26px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-2 right-2 rounded-lg px-3 py-2 text-[15px] text-muted active:bg-surface-2"
        >
          ✕
        </button>

        {/* 리스트 카드와 같은 문법으로 맞춘다 — 색점, 값 오른쪽 정렬, 선으로 끊은 한 줄 평. */}
        <Link to={`/bar/${bar.id}`} className="block">
          <div className="flex items-center gap-2 pr-9">
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ backgroundColor: DISTRICT_DOT[bar.district] }}
            />
            <h2 className="text-[19px] font-bold tracking-[-0.02em] text-text">{bar.name}</h2>
            <span className="text-[15px] text-muted">{bar.district}</span>
          </div>

          {stillLocked && (
            <p className="mt-[11px] text-[15px] text-muted">
              아직 잠겨 있습니다. 눌러서 열어보세요.
            </p>
          )}

          {menu && (
            <div className="mt-[11px] flex items-baseline gap-2.5">
              <div className="flex min-w-0 items-baseline gap-[7px]">
                {menu.isSignature && (
                  <span className="shrink-0 rounded-[5px] bg-accent px-1.5 py-0.5 text-[15px] font-bold text-accent-ink">
                    시그니처
                  </span>
                )}
                <span className="truncate text-[15px] text-text/90">{menu.name}</span>
              </div>
              <span className="ml-auto shrink-0 text-[15px] font-bold text-accent tabular-nums">
                {formatPrice(menu.price)}
              </span>
            </div>
          )}

          {bar.note && (
            <p className="mt-[13px] line-clamp-2 border-t border-surface-2 pt-3 text-[15px] leading-relaxed text-text/70">
              {bar.note}
            </p>
          )}

          <p className="mt-3 flex items-center gap-1 text-[15px] font-semibold text-accent">
            {stillLocked ? '열어보기' : '자세히 보기'}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </p>
        </Link>
      </div>
    </div>
  )
}

/* 필터가 걸려 있다는 표시. 글자만으로는 그냥 안내문으로 읽혀 지나치기 쉽다. */
function FunnelIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 text-accent"
    >
      <path d="M3 5h18l-7 8v6l-4 2v-8z" />
    </svg>
  )
}
