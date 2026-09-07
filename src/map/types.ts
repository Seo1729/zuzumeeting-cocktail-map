/*
  지도 관련 타입은 전부 여기에 있다.
  `window.kakao` 선언도 이 파일에만 존재한다 — src/map/ 밖에서는 카카오 SDK를 알 수 없어야 하고,
  나중에 다른 지도 제공자로 갈아끼울 때 이 폴더만 통째로 바꾸면 되게 하기 위해서다.
*/

/*
  KakaoMapView가 받는 마커 하나. 카카오 SDK와 무관한 순수 데이터.

  지시서의 스케치에는 selected 필드가 있었지만 뺐다.
  선택 상태를 마커 객체 안에 넣으면 마커를 하나 고를 때마다 markers 배열이 새로 만들어지고,
  그러면 "markers가 바뀌었으니 마커를 다시 그린다"는 이펙트가 매번 돌면서
  지도 화면이 선택할 때마다 전체 영역으로 되돌아간다.
  선택 상태는 selectedId prop 하나로만 관리한다.
*/
export interface MapMarker {
  id: string
  name: string
  lat: number
  lng: number
}

// --- 카카오맵 SDK 최소 타입 선언 ---
// 실제로 호출하는 것만 적는다. `any`를 쓰지 않기 위한 선언이지 완전한 타입 정의가 아니다.

export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void
}

export interface KakaoSize {
  readonly __brand?: 'Size'
}

export interface KakaoPoint {
  readonly __brand?: 'Point'
}

export interface KakaoMarkerImage {
  readonly __brand?: 'MarkerImage'
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  panTo(latlng: KakaoLatLng): void
  setLevel(level: number): void
  setBounds(bounds: KakaoLatLngBounds): void
  relayout(): void
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
  setImage(image: KakaoMarkerImage): void
  setZIndex(zIndex: number): void
  getPosition(): KakaoLatLng
}

export interface KakaoMaps {
  /** autoload=false로 불러왔을 때 실제 초기화를 시작하는 진입점. */
  load(callback: () => void): void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level?: number },
  ) => KakaoMap
  Marker: new (options: {
    position: KakaoLatLng
    title?: string
    image?: KakaoMarkerImage
    zIndex?: number
  }) => KakaoMarker
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options?: { offset?: KakaoPoint },
  ) => KakaoMarkerImage
  Size: new (width: number, height: number) => KakaoSize
  Point: new (x: number, y: number) => KakaoPoint
  event: {
    addListener(target: object, type: string, handler: () => void): void
  }
}

export interface KakaoNamespace {
  maps: KakaoMaps
}

declare global {
  interface Window {
    kakao?: KakaoNamespace
  }
}
