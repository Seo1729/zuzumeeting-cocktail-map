# 전주 칵테일바 지도 앱 — 개발 지시서

> 사용법: 아래 `---` 부터 끝까지 전체를 Claude Code 첫 프롬프트로 붙여넣는다.
> 프로젝트 루트에 `docs/SPEC.md`로도 저장해두고, 세션이 길어져 맥락이 흐려지면
> "docs/SPEC.md 다시 읽고 진행해" 라고 지시한다.

---

# 프로젝트: 전북대 칵테일 동아리용 전주 칵테일바 지도 앱

## 1. 배경과 목표

전북대 칵테일 동아리 신입부원에게 **전주의 칵테일바 정보를 제공**하는 읽기 전용 웹앱을 만든다.
부원이 폰으로 링크를 열어 "오늘 어디 갈까, 가서 뭘 시킬까"를 3초 안에 정하게 하는 것이 유일한 목적이다.

대상 상권은 세 곳이다: **전북대 구정문 대학로 / 객사 / 신시가지**.
예상 데이터 규모는 바 40~60곳, 각 바당 시그니처 메뉴 2~5개.
사용자는 동아리 부원 20~30명. 그 이상 확장할 계획은 없다.

## 2. 절대 제약 (MUST NOT)

아래는 협상 대상이 아니다. 필요해 보여도 제안하지 말고 만들지 마라.

- **백엔드 서버, 데이터베이스, API 라우트를 만들지 마라.** 100% 정적 사이트다.
- **로그인, 회원가입, 인증을 만들지 마라.**
- **사용자 데이터를 저장하지 마라.** localStorage는 UI 상태(다크모드, 마지막 필터) 외에는 쓰지 마라.
- **리뷰, 평점 입력, 댓글, 좋아요 등 쓰기 기능을 만들지 마라.** 읽기 전용이다.
- **결제수단이 필요한 서비스를 도입하지 마라.** (Google Maps, Naver Cloud Platform 등)
- **Next.js, React Native, Electron을 쓰지 마라.**
- **상태관리 라이브러리(Redux, Zustand, Jotai)를 도입하지 마라.** 서버 상태가 없으므로 불필요하다.
- **테스트 프레임워크(Jest, Vitest, Playwright)를 셋업하지 마라.** 데이터 검증 스크립트 하나로 충분하다.
- **실제 존재하지 않는 가게 이름/주소/좌표를 지어내지 마라.** 샘플 데이터는 반드시 `__SAMPLE__` 접두사를 붙이고, 나머지는 사람이 채울 자리로 비워둬라.

## 3. 기술 스택 (확정. 변경 제안 금지)

| 레이어 | 선택 |
|---|---|
| 빌드 | Vite |
| 언어 | TypeScript (strict: true) |
| UI | React 18+ |
| 라우팅 | React Router (HashRouter — 정적 호스팅 404 방지) |
| 스타일 | Tailwind CSS |
| 데이터 검증 | Zod |
| 지도 | 카카오맵 JavaScript SDK |
| PWA | vite-plugin-pwa |
| 배포 | Cloudflare Pages (정적 빌드 산출물 업로드) |

패키지 매니저는 npm. 그 외 라이브러리를 추가하려면 **먼저 물어보고 승인을 받아라.**

## 4. 데이터 모델

데이터는 `src/data/bars.json` 파일 하나에 배열로 들어간다.
이 앱은 쓰기가 없으므로 정규화하지 말고 **메뉴를 바 안에 중첩**시킨다.

```ts
// src/domain/schema.ts
import { z } from "zod";

export const District = z.enum(["대학로", "객사", "신시가지"]);
export const BaseSpirit = z.enum([
  "GIN", "WHISKY", "RUM", "VODKA", "TEQUILA",
  "BRANDY", "LIQUEUR", "WINE", "NON_ALC",
]);

export const MenuItem = z.object({
  name: z.string().min(1),                 // "네그로니", "시그니처 - 전주의 밤"
  price: z.number().int().nonnegative(),   // 원 단위 정수. 절대 float 금지
  base: BaseSpirit,
  isSignature: z.boolean().default(false),
  desc: z.string().default(""),            // 한 줄 설명. 운영진 코멘트
});

export const Bar = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),    // kebab-case slug
  name: z.string().min(1),
  district: District,
  address: z.string().min(1),
  lat: z.number().min(35.7).max(35.9),     // 전주 범위 밖이면 오타
  lng: z.number().min(127.0).max(127.3),
  hours: z.string().default(""),           // "19:00 - 02:00"
  closedDays: z.array(z.string()).default([]),  // ["일"]
  tags: z.array(z.string()).default([]),   // ["조용함", "1인 가능", "위스키 강함"]
  beginnerFriendly: z.boolean().default(false),
  note: z.string().default(""),            // 운영진 한 줄 평. 이 앱의 핵심 가치
  menu: z.array(MenuItem).default([]),
  instagram: z.string().url().nullable().default(null),
  dataAsOf: z.string(),                    // "2026-09" — UI에 반드시 노출
});

export type Bar = z.infer<typeof Bar>;
export const BarList = z.array(Bar);
```

**검증 스크립트**를 만들어라: `npm run validate` 실행 시 `bars.json`을 `BarList`로 파싱하고,
실패하면 어떤 인덱스의 어떤 필드가 왜 틀렸는지 출력하고 exit code 1로 종료한다.
`npm run build`는 validate를 먼저 실행한 뒤 진행되게 한다.

샘플 데이터는 `__SAMPLE__` 접두사가 붙은 2건만 넣어라. 실제 데이터는 사람이 채운다.

## 5. 디렉토리 구조

```
src/
  domain/
    schema.ts          # Zod 스키마 + 타입
    selectors.ts       # 필터/정렬/그룹핑 순수 함수 (React 의존 금지)
  data/
    bars.json
  map/                 # ★ 지도 관련 코드는 이 폴더 밖으로 절대 나가지 않는다
    KakaoMapView.tsx   # 카카오 SDK를 감싼 유일한 컴포넌트
    useKakaoLoader.ts
    types.ts           # MapMarker { id, name, lat, lng, selected }
  components/
  pages/
    MapPage.tsx
    ListPage.tsx
    BarDetailPage.tsx
  App.tsx
scripts/
  validate.ts
```

**지도 격리 규칙 (중요)**: `window.kakao` 참조는 `src/map/` 안에서만 허용한다.
`KakaoMapView`는 아래 네 개의 props만 받는다. 이렇게 하면 나중에 다른 지도 제공자로
교체할 때 이 폴더만 갈아끼우면 된다.

- `markers: MapMarker[]`
- `selectedId: string | null`
- `onSelect(id)`
- `userLocation: UserLocation | null`

> **`userLocation`은 원래 지시서에 없던 네 번째 prop이다.** "지도에 내 위치를 표시"
> 기능을 추가하면서 승인을 받아 늘렸다. 사용자 위치를 `markers`에 섞지 않은 이유는,
> `MapMarker`가 "누르면 바텀시트가 열리는 바"라는 뜻이라 참조점을 같은 배열에 넣으면
> `onSelect(id)` 계약이 깨지기 때문이다.
>
> 이 기능에 따라붙는 제약 두 가지:
> - **위치를 저장하지 않는다.** 2절의 "사용자 데이터를 저장하지 마라"에 걸린다.
>   메모리에만 두고 탭을 닫으면 사라진다.
> - **위치를 URL 쿼리에 넣지 않는다.** 필터 상태를 URL에 담아 링크를 공유하는 앱이라,
>   좌표가 섞이면 오픈채팅방에 링크를 붙여넣는 순간 자기 위치가 공개된다.
>
> 좌표가 전주 밖인지 판단하는 일은 `KakaoMapView`가 아니라 `MapPage`가 한다.
> 지도 레이어에 "전주"라는 도메인 개념을 넣지 않기 위해서다.

## 6. 화면 명세

### 6-1. 리스트 화면 (`/`, 기본 진입점)

**지도보다 리스트를 먼저 만든다.** 지도가 없어도 앱이 완전히 동작해야 한다.

- 상단: 상권 필터 칩 (전체 / 대학로 / 객사 / 신시가지)
- 보조 필터: `입문자 추천만`, 가격대 슬라이더 또는 구간 칩
- 카드 1개당 표시: 바 이름 / 상권 / 대표 메뉴 1개와 가격 / 태그 2~3개 / 운영진 한 줄 평
- 정렬: 이름순, 최저가순
- 필터 상태는 URL 쿼리스트링에 반영 (링크 공유 가능해야 함)

### 6-2. 바 상세 화면 (`/bar/:id`)

- 이름, 주소, 영업시간, 휴무일, 태그
- **운영진 코멘트를 가장 크고 눈에 띄게** 배치한다. 카카오맵에 없는 유일한 정보이고 이 앱의 존재 이유다.
- 메뉴 리스트: 시그니처는 상단에 배지와 함께 고정, 가격은 `12,000원` 형식
- 하단 고정 액션 버튼 2개
  - `카카오맵으로 길찾기` → `https://map.kakao.com/link/to/{name},{lat},{lng}` 새 탭
  - `인스타그램` (값이 있을 때만 노출)
- 화면 최하단에 작게: `정보 기준: {dataAsOf} · 가격과 영업 정보는 변경되었을 수 있습니다`

### 6-3. 지도 화면 (`/map`)

- 카카오맵 SDK로 전주 중심 좌표에 지도를 띄우고 전체 바에 마커를 찍는다
- 상권 필터 칩으로 마커를 필터링
- 마커 클릭 시 하단에 바텀시트로 요약 카드 표시, 카드 탭 시 상세 화면으로 이동
- 리스트/지도 전환은 하단 탭바 또는 상단 토글

### 6-4. 공통

- **모바일 우선.** 데스크톱은 가운데 정렬된 max-width 480px 컬럼으로 처리한다.
- 다크 테마를 기본으로 한다. 밤에 어두운 바 안에서 보는 앱이다.
- 폰트 크기는 최소 15px. 조명 어두운 환경 + 음주 상태를 가정한다.

## 7. 작업 순서

각 단계가 끝나면 **멈추고 요약을 보고한 뒤 다음 단계 진행 여부를 물어라.** 한 번에 다 하지 마라.

1. **스캐폴딩** — Vite + React + TS + Tailwind 초기화, HashRouter 설정, 빈 3개 페이지 라우팅
2. **도메인** — `schema.ts` 작성, `bars.json`에 `__SAMPLE__` 2건, `scripts/validate.ts`, `npm run validate` 동작 확인
3. **리스트 화면** — 카드 UI, 상권 필터, 정렬, URL 쿼리 동기화
4. **상세 화면** — 메뉴 렌더링, 딥링크 버튼, 기준일 고지 문구
5. **지도 화면** — `src/map/` 격리 원칙 지켜 카카오 SDK 연동. 환경변수 `VITE_KAKAO_JS_KEY` 사용
6. **PWA + 배포** — manifest, 아이콘, 서비스워커. 정적 자산은 precache, `bars.json`은 StaleWhileRevalidate, 지도 타일은 캐시하지 않음
7. **README** — 로컬 실행법, `bars.json` 채우는 법, 좌표 구하는 법, 배포법

## 8. 카카오맵 연동 시 주의사항

React 입문자가 만든 프로젝트라는 전제로 아래를 반드시 지켜라.

- SDK는 `index.html`에 `<script>`로 넣지 말고 `useKakaoLoader` 훅에서 동적 로드한다 (`autoload=false` 후 `kakao.maps.load()`)
- 지도 인스턴스와 마커 배열은 `useRef`로 보관한다. state에 넣지 마라
- `useEffect` cleanup에서 마커를 반드시 `setMap(null)` 처리한다. StrictMode 이중 렌더링으로 마커가 2배 찍히는 문제를 막아야 한다
- JS 키는 클라이언트에 노출될 수밖에 없다. 숨기려 하지 말고 README에 **카카오 개발자 콘솔 웹 플랫폼 도메인 등록으로 방어한다**고 명시하라
- SDK 로딩 실패 시 화면이 깨지지 않고 "지도를 불러오지 못했습니다. 리스트로 보기" 폴백을 보여줘야 한다

## 9. 완료 기준 (Definition of Done)

- [ ] `npm run build`가 경고 없이 통과하고, 잘못된 `bars.json`을 넣으면 빌드가 실패한다
- [ ] TypeScript strict 모드에서 `any`가 하나도 없다
- [ ] 지도 없이도(네트워크 차단 상태) 리스트와 상세 화면이 동작한다
- [ ] `window.kakao` 참조가 `src/map/` 밖에 존재하지 않는다
- [ ] iPhone Safari 기준 홈 화면 추가가 되고, 아이콘과 앱 이름이 정상 표시된다
- [ ] 모든 바 상세 화면 하단에 데이터 기준일 고지가 노출된다
- [ ] README만 읽고 처음 보는 사람이 `bars.json`에 새 바를 추가할 수 있다

---

## 부록 A. 좌표 수집 방법 (운영진 안내용)

1. PC 카카오맵에서 가게를 검색한다
2. 가게를 우클릭 → `이 위치의 좌표 보기` 또는 URL의 좌표 파라미터를 확인한다
3. 위도(lat, 35.8xx), 경도(lng, 127.1xx) 순서를 헷갈리지 않게 주의한다
4. Zod 스키마가 전주 범위를 벗어난 좌표를 빌드 시점에 잡아준다

## 부록 B. 배포

1. GitHub에 레포 push
2. Cloudflare Pages → Connect to Git → 빌드 명령 `npm run build`, 출력 디렉토리 `dist`
3. 환경변수 `VITE_KAKAO_JS_KEY` 등록
4. 발급된 `*.pages.dev` 도메인을 카카오 개발자 콘솔 웹 플랫폼에 등록
5. 부원 오픈채팅방에 링크 공유 + "홈 화면에 추가" 안내
