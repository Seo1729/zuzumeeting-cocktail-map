# 인수인계 — 다른 컴퓨터에서 이어서 작업하기

Claude Code 세션은 기기 간에 옮겨지지 않습니다. 이 문서가 그 역할을 대신합니다.
새 컴퓨터에서 저장소를 클론한 뒤, Claude Code를 열고 **"docs/HANDOFF.md 읽고 이어서 진행해"**
라고 하면 됩니다.

---

## 1. 프로젝트 한 줄 요약

전북대 칵테일 동아리 신입부원용 **전주 칵테일바 정보 웹앱**.
부원이 폰으로 링크를 열어 "오늘 어디 갈까, 뭘 시킬까"를 3초 안에 정하는 것이 유일한 목적.

- 저장소: https://github.com/Seo1729/zuzumeeting-cocktail-map
- 원본 지시서: `docs/SPEC.md` — **판단이 갈리면 이 문서가 기준입니다**
- 운영진용 사용 설명서: `README.md`

---

## 2. 새 컴퓨터 세팅

```bash
git clone https://github.com/Seo1729/zuzumeeting-cocktail-map.git
cd zuzumeeting-cocktail-map
npm install
npm run dev
```

**Node.js 22.6 이상**이 필요합니다. `npm run validate`가 Node 내장 TypeScript 타입
스트리핑(`--experimental-strip-types`)을 쓰기 때문입니다. `node -v`로 확인하세요.

### git에 없어서 다시 만들어야 하는 것

| 파일 | 내용 | 없으면 |
|---|---|---|
| `.env.local` | `VITE_KAKAO_JS_KEY=...` | 지도 화면만 폴백 표시. 나머지는 정상 동작 |
| `node_modules/` | `npm install`로 생성 | — |
| `board-api/node_modules/` | `cd board-api && npm install` | 백엔드 연습 프로젝트를 볼 때만 필요 |

`.env.local`은 `.env.example`을 복사해서 만듭니다. 발급 절차는 `README.md` 4절에 있습니다.

---

## 3. 현재 상태

### 완료 — 지시서의 7단계 전부

| 단계 | 내용 |
|---|---|
| 1 | Vite + React 19 + TS strict + Tailwind v4, HashRouter |
| 2 | Zod 스키마, `npm run validate`, 빌드 차단 |
| 3 | 리스트 화면 (필터·정렬·URL 쿼리 동기화) |
| 4 | 상세 화면 (운영진 코멘트 강조, 딥링크, 기준일 고지) |
| 5 | 지도 화면 (`src/map/` 격리, SDK 동적 로드, 폴백) |
| 6 | PWA (manifest, 아이콘, 서비스워커 precache) |
| 7 | README |

`npm run build`는 경고 없이 통과합니다. `any` 0건, `window.kakao` 참조는 `src/map/` 안에만.

### ⚠️ 코드는 있지만 실물로 확인 못 한 것

**여기가 다음 사람이 제일 먼저 알아야 할 부분입니다.**

| 항목 | 어디까지 확인했나 | 왜 못 했나 |
|---|---|---|
| **지도 렌더링** | 가짜 SDK를 주입해 코드 경로만 검증(마커 생성·정리·선택·`panTo`·바텀시트) | **카카오 JS 키가 없었음.** 실제 지도 타일을 띄운 화면을 한 번도 못 봄 |
| **서비스워커 / 오프라인** | `sw.js` 생성과 precache 13개 항목을 정적으로 확인 | 개발 환경 브라우저가 서비스워커 등록을 차단 |
| **iOS 홈 화면 추가** | manifest와 `apple-touch-icon` 태그만 확인 | 실기기 없음 |

**지도는 "키만 꽂으면 끝"이 아닐 수 있습니다.** 눈으로 봐야 알 수 있는 것들:
핀 크기, `setBounds`의 줌 레벨(바가 2곳뿐일 때 과확대 가능), 바텀시트가 지도를 가리는 정도,
핀 끝점 offset이 실제 좌표를 정확히 가리키는지. 조정이 필요할 가능성이 높습니다.

### 미착수

- **실제 바 데이터.** `bars.json`에 `__SAMPLE__` 2건뿐입니다. **이게 가장 큰 남은 일입니다** —
  프론트는 다 만들었지만 데이터가 없어서 앱은 아직 쓸모가 없습니다
- Cloudflare Pages 배포

---

## 4. 절대 제약 — 새로 붙이기 전에 반드시 확인

`docs/SPEC.md`의 "절대 제약"입니다. **필요해 보여도 제안하지 말 것:**

- 백엔드 서버, DB, API 라우트 없음. 100% 정적 사이트
- 로그인/회원가입/인증 없음
- 리뷰·평점·댓글·좋아요 등 **쓰기 기능 없음. 읽기 전용**
- 결제수단이 필요한 서비스 금지 (Google Maps 등)
- Next.js / React Native / Electron 금지
- 상태관리 라이브러리(Redux, Zustand 등) 금지
- 테스트 프레임워크 금지 — 검증 스크립트 하나로 충분
- **실존하지 않는 가게 이름·주소·좌표를 지어내지 말 것.** 샘플은 `__SAMPLE__` 접두사

스택 변경 제안도 금지입니다. 새 라이브러리는 **먼저 물어보고 승인**을 받으세요.

---

## 5. 코드에서 지켜야 할 규칙 2가지

**1. `window.kakao` 참조는 `src/map/` 안에서만.**
`KakaoMapView`는 `markers` / `selectedId` / `onSelect` 세 props만 받습니다.
다른 지도 서비스로 갈아탈 때 이 폴더만 통째로 바꾸기 위한 경계입니다.

> 지시서 스케치의 `MapMarker.selected` 필드는 **일부러 뺐습니다.** 선택 상태를 마커
> 객체에 넣으면 핀 하나 고를 때마다 `markers` 배열 identity가 바뀌고, 마커 재생성
> 이펙트가 매번 돌면서 지도가 선택할 때마다 전체 영역으로 리셋됩니다.
> 이유는 `src/map/types.ts` 주석에 남겨뒀습니다.

**2. `src/domain/`에는 React를 import하지 않습니다.**
`selectors.ts`는 순수 함수만 둡니다. 화면이 바뀌어도 계산 로직은 그대로 쓸 수 있어야 합니다.

---

## 6. 다음 할 일 (우선순위)

1. **카카오 키 발급 → `.env.local` → 지도 실물 확인** (README 4절). 이상한 점 조정
2. **`bars.json`에 실제 데이터 채우기** ← 진짜 일. README 2절에 템플릿과 칸 설명
3. `__SAMPLE__` 2건 삭제
4. Cloudflare Pages 배포 (README 5절) → `pages.dev` 주소를 카카오 콘솔에 등록
5. 부원 오픈채팅방에 링크 + "홈 화면에 추가" 안내

### 데이터가 들어간 뒤에 판단할 것 (지금 만들지 말 것)

검색, "지금 영업 중" 표시, 거리순 정렬. 전부 지시서에 없습니다.
**부원들이 며칠 실제로 써보고 나온 불만으로 정하는 게 맞습니다.**
지금 넣으면 안 쓸 기능을 만들 가능성이 큽니다.

---

## 7. 작업하며 실제로 부딪힌 함정들

| 함정 | 대응 |
|---|---|
| **커밋 전 검증을 안 해서 깨진 `bars.json`을 push한 적 있음** | 데이터 수정 후 반드시 `npm run validate`. 커밋 전 `npm run build`가 더 안전 |
| 외장/네트워크 드라이브에서 `git init`이 "dubious ownership"으로 거부 | `git config --global --add safe.directory '<경로>'` |
| Node 22.6 미만에서 `bad option: --experimental-strip-types` | Node 22.6+ 설치 |
| `.env.local`을 만들어도 지도가 안 뜸 | **개발 서버 재시작.** Vite는 환경변수를 시작할 때 한 번만 읽음 |
| 카카오 도메인 등록에 포트를 빼먹어 지도가 안 뜸 | `http://localhost:5173` 처럼 **포트까지** 등록 |
| PowerShell에서 `curl`이 다른 명령의 별칭이라 API 테스트 실패 | Git Bash를 쓰거나 `curl.exe`로 호출 |
| `npm install`이 매우 느림 (드라이브에 따라 수 분) | 정상. 백그라운드로 돌리고 기다릴 것 |

---

## 8. `board-api/`는 이 앱과 무관합니다

백엔드 학습용 **연습 프로젝트**입니다. 저장소만 같이 쓸 뿐 앱은 이 서버를 호출하지 않습니다.
서버가 죽어도 앱은 멀쩡합니다.

1단계(메모리 배열 CRUD) 골격만 있고 `GET /posts` 하나만 구현돼 있습니다.
나머지는 **학습자가 직접 채울 TODO 스텁**이니 **대신 구현해주지 마세요.**
힌트와 질문만 남겨둔 상태입니다. 자세한 내용은 `board-api/README.md`.

**4단계(인증)를 끝내기 전에는 이 서버를 앱에 연결하지 않습니다.**
