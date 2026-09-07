import { useEffect, useRef } from 'react'
import type { KakaoMap, KakaoMarker, KakaoMarkerImage, MapMarker } from './types'
import { useKakaoLoader } from './useKakaoLoader'

/*
  카카오 SDK를 감싼 유일한 컴포넌트.
  바깥에서 받는 것은 markers / selectedId / onSelect 세 개뿐이고,
  이 파일은 Bar 도메인 타입을 알지 못한다.

  지도 인스턴스와 마커 배열은 state가 아니라 useRef에 둔다.
  마커를 state에 넣으면 마커를 만들 때마다 리렌더가 돌고, 그 리렌더가 다시 마커를 만든다.
*/

interface KakaoMapViewProps {
  markers: MapMarker[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/** 전주 시내 중심. 마커가 하나도 없을 때의 기본 위치. */
const JEONJU_CENTER = { lat: 35.8242, lng: 127.148 }

/*
  setBounds는 마커들을 화면에 꽉 채우려 한다. 마커가 하나뿐이면 영역이 한 점으로 접혀
  최대 배율까지 확대되고(실제로 축척 30m, 건물 한 채가 화면을 채웠다), 두 곳이 붙어 있어도
  같은 일이 덜한 정도로 벌어진다. 그러면 "여기가 어디쯤인지"를 알 수 없어 지도가 쓸모없어진다.
  상권 필터를 걸면 바가 한 곳만 남는 일이 흔하므로 확대 상한을 둔다.
  레벨은 숫자가 작을수록 확대. 4는 축척 100m 정도로 골목과 큰길이 같이 보인다.
*/
const CLOSEST_LEVEL = 4

function pinSvg(fill: string, stroke: string, dot: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 1c-7.2 0-13 5.8-13 13 0 9 11.3 19.4 11.8 19.8a1.8 1.8 0 0 0 2.4 0C15.7 33.4 27 23 27 14c0-7.2-5.8-13-13-13z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><circle cx="14" cy="14" r="4.5" fill="${dot}"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// 다크 배경 위에서 읽히도록 직접 그린 핀. 선택된 것만 accent 색으로 띄운다.
const PIN_DEFAULT = pinSvg('#1f1f29', '#a1a1ae', '#a1a1ae')
const PIN_SELECTED = pinSvg('#e8b45c', '#e8b45c', '#2a1d06')

export default function KakaoMapView({ markers, selectedId, onSelect }: KakaoMapViewProps) {
  const { status, maps, error } = useKakaoLoader()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const markerRefs = useRef<Map<string, KakaoMarker>>(new Map())
  const imagesRef = useRef<{ base: KakaoMarkerImage; selected: KakaoMarkerImage } | null>(null)

  // onSelect가 매 렌더마다 새 함수여도 마커를 다시 만들지 않도록 ref에 최신 값을 담아둔다.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // 1) 지도 인스턴스 생성. SDK가 준비된 뒤 한 번만.
  useEffect(() => {
    const container = containerRef.current
    if (!maps || !container) return

    const map = new maps.Map(container, {
      center: new maps.LatLng(JEONJU_CENTER.lat, JEONJU_CENTER.lng),
      level: 6,
    })
    mapRef.current = map

    imagesRef.current = {
      base: new maps.MarkerImage(PIN_DEFAULT, new maps.Size(28, 36), {
        offset: new maps.Point(14, 36),
      }),
      selected: new maps.MarkerImage(PIN_SELECTED, new maps.Size(28, 36), {
        offset: new maps.Point(14, 36),
      }),
    }

    // 빈 곳을 누르면 선택 해제. 바텀시트를 닫는 유일한 방법이 X 버튼이면 답답하다.
    maps.event.addListener(map, 'click', () => onSelectRef.current(null))

    return () => {
      // StrictMode는 이 이펙트를 두 번 돌린다. 정리하지 않으면 같은 컨테이너에 지도가 두 개 생긴다.
      mapRef.current = null
      imagesRef.current = null
      container.innerHTML = ''
    }
  }, [maps])

  // 2) 마커 생성/정리. markers가 바뀔 때마다 통째로 다시 만든다.
  //    40~60개 규모라 diff를 계산하는 것보다 전부 새로 그리는 편이 단순하고 안전하다.
  useEffect(() => {
    const map = mapRef.current
    const images = imagesRef.current
    if (!maps || !map || !images) return

    const created = new globalThis.Map<string, KakaoMarker>()
    const bounds = new maps.LatLngBounds()

    for (const item of markers) {
      const position = new maps.LatLng(item.lat, item.lng)
      const marker = new maps.Marker({
        position,
        title: item.name,
        image: images.base,
      })
      marker.setMap(map)
      maps.event.addListener(marker, 'click', () => onSelectRef.current(item.id))
      created.set(item.id, marker)
      bounds.extend(position)
    }

    markerRefs.current = created

    if (markers.length > 0) {
      map.setBounds(bounds)
      // setBounds가 정한 배율이 상한을 넘었으면 되돌린다. 중심은 그대로 둔다.
      if (map.getLevel() < CLOSEST_LEVEL) map.setLevel(CLOSEST_LEVEL)
    } else {
      map.setCenter(new maps.LatLng(JEONJU_CENTER.lat, JEONJU_CENTER.lng))
      map.setLevel(6)
    }

    return () => {
      // 지도에서 떼어내지 않으면 필터를 바꿀 때마다 마커가 쌓인다.
      for (const marker of created.values()) marker.setMap(null)
      markerRefs.current = new globalThis.Map()
    }
  }, [maps, markers])

  // 3) 선택 표시. 마커를 다시 만들지 않고 이미지와 z축만 바꾼다.
  useEffect(() => {
    const images = imagesRef.current
    if (!images) return

    for (const [id, marker] of markerRefs.current) {
      const isSelected = id === selectedId
      marker.setImage(isSelected ? images.selected : images.base)
      marker.setZIndex(isSelected ? 10 : 1)
    }

    const map = mapRef.current
    const selected = selectedId === null ? undefined : markerRefs.current.get(selectedId)
    if (map && selected) map.panTo(selected.getPosition())
  }, [selectedId, markers])

  if (status === 'error') {
    return <MapFallback reason={error} />
  }

  /*
    isolate(= isolation: isolate)가 없으면 안 된다.
    카카오는 지도 안에 z-index 1~2짜리 레이어를 직접 만드는데, 이 래퍼가 쌓임 맥락을
    만들지 않으면 그 z-index가 바깥으로 새어나와 지도 위에 얹은 UI(바텀시트)와 같은 층에서
    경쟁한다. 실제로 핀을 누르면 시트가 떴다가 panTo 직후 지도 레이어에 덮였다.
    여기서 맥락을 끊어 카카오의 z-index가 이 div 안에서만 의미를 갖게 한다.
  */
  return (
    <div className="relative isolate h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-surface" />
      {status === 'loading' && (
        <p className="absolute inset-0 flex items-center justify-center text-[15px] text-muted">
          지도를 불러오는 중…
        </p>
      )}
    </div>
  )
}

/*
  SDK 로딩이 실패해도 화면이 깨지면 안 된다.
  네트워크가 막힌 술집 지하, 도메인 등록이 안 된 새 배포 주소 — 둘 다 흔한 상황이다.
*/
function MapFallback({ reason }: { reason: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[16px] text-text">지도를 불러오지 못했습니다.</p>
      {reason === 'no-key' && (
        <p className="text-[15px] text-muted">
          VITE_KAKAO_JS_KEY가 설정되지 않았습니다. README를 확인하세요.
        </p>
      )}
      <a
        href="#/"
        className="rounded-full border border-line px-5 py-2.5 text-[15px] text-text active:bg-surface-2"
      >
        리스트로 보기
      </a>
    </div>
  )
}
