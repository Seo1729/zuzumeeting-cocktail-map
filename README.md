# 전주 칵테일바 지도

전북대 칵테일 동아리 신입부원에게 전주의 칵테일바 정보를 알려주는 **읽기 전용** 웹앱입니다.
부원이 폰으로 링크를 열어 "오늘 어디 갈까, 가서 뭘 시킬까"를 3초 안에 정하는 것이 목적입니다.

대상 상권은 **대학로 / 객사 / 신시가지** 세 곳입니다.

---

## 이 앱에 없는 것 (일부러 없습니다)

로그인, 회원가입, 리뷰, 평점, 댓글, 좋아요, 백엔드 서버, 데이터베이스가 **없습니다.**
전부 정적 파일이고, 데이터는 `src/data/bars.json` 파일 하나가 전부입니다.
새 기능을 붙이기 전에 `docs/SPEC.md`의 "절대 제약"을 먼저 읽어주세요.

---

## 1. 로컬에서 실행하기

**Node.js 22.6 이상**이 필요합니다. ([nodejs.org](https://nodejs.org)에서 LTS 버전 설치)

> 22.6 미만에서는 `npm run validate`가 `bad option: --experimental-strip-types` 오류로 실패합니다.
> 검증 스크립트를 TypeScript 그대로 실행하는 데 Node의 내장 기능을 쓰기 때문입니다.
> `node -v`로 버전을 확인하세요.

```bash
npm install
npm run dev
```

터미널에 뜨는 주소(보통 `http://localhost:5173`)를 브라우저에서 엽니다.

> 지도 화면은 카카오 키가 없으면 "지도를 불러오지 못했습니다"가 뜹니다. **정상입니다.**
> 리스트와 상세 화면은 키 없이도 완전히 동작합니다. 키 설정은 아래 4번을 보세요.

### 명령어 목록

| 명령어 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run validate` | `bars.json`이 올바른지 검사 |
| `npm run build` | 검사 → 타입 검사 → 빌드 (`dist/` 생성) |
| `npm run preview` | 빌드한 결과를 실제 배포처럼 미리보기 |
| `npm run icons` | 앱 아이콘 PNG 다시 생성 (거의 쓸 일 없음) |

---

## 2. 바 정보 추가하기 ★ 운영진이 제일 많이 할 일

모든 데이터는 **`src/data/bars.json`** 한 파일에 들어 있습니다. 이 파일만 고치면 됩니다.

### 2-1. 순서

1. `src/data/bars.json`을 메모장이 아닌 **VS Code** 같은 편집기로 엽니다 (따옴표 자동 변환 사고 방지)
2. 아래 템플릿을 복사해서 배열 안에 붙여넣습니다. **앞 항목 끝에 쉼표 `,`를 찍는 것을 잊지 마세요**
3. 값을 채웁니다
4. `npm run validate`를 실행합니다
5. `검증 통과`가 뜨면 끝. 오류가 뜨면 **몇 번째 바의 어떤 칸이 왜 틀렸는지 알려줍니다**

### 2-2. 복사해서 쓰는 템플릿

```json
  {
    "id": "moon-bar",
    "name": "문 바",
    "district": "대학로",
    "address": "전주시 덕진구 백제대로 000",
    "lat": 35.8467,
    "lng": 127.1290,
    "hours": "19:00 - 02:00",
    "closedDays": ["일"],
    "tags": ["조용함", "1인 가능"],
    "beginnerFriendly": true,
    "note": "여기에 운영진 한 줄 평을 씁니다. 이 앱에서 가장 중요한 칸입니다.",
    "menu": [
      {
        "name": "시그니처 - 전주의 밤",
        "price": 14000,
        "base": "GIN",
        "isSignature": true,
        "desc": "달지 않고 허브 향이 강합니다"
      },
      {
        "name": "네그로니",
        "price": 12000,
        "base": "GIN",
        "isSignature": false,
        "desc": ""
      }
    ],
    "instagram": null,
    "dataAsOf": "2026-09"
  }
```

### 2-3. 칸 설명

| 칸 | 뜻 | 주의사항 |
|---|---|---|
| `id` | 주소창에 들어가는 이름표 | **영어 소문자·숫자·하이픈만.** 공백·한글·대문자·밑줄 금지. 예: `moon-bar`. 다른 바와 겹치면 안 됩니다 |
| `name` | 가게 이름 | |
| `district` | 상권 | **`대학로` / `객사` / `신시가지` 셋 중 하나.** 다른 값은 오류 |
| `address` | 주소 | |
| `lat` | 위도 | `35.8xx`. 아래 3번 참고 |
| `lng` | 경도 | `127.1xx`. **위도와 바꿔 쓰기 쉬우니 주의** |
| `hours` | 영업시간 | `"19:00 - 02:00"` 처럼 자유롭게. 모르면 `""` |
| `closedDays` | 휴무일 | `["일"]`, `["월","화"]`. 없거나 모르면 `[]` |
| `tags` | 태그 | `["조용함", "1인 가능", "위스키 강함"]`. 리스트 카드에는 앞 3개만 보입니다 |
| `beginnerFriendly` | 입문자 추천 여부 | `true` 또는 `false`. 따옴표 없이 씁니다 |
| `note` | **운영진 한 줄 평** | 상세 화면에서 가장 크게 나옵니다. 카카오맵에 없는 정보이고 **이 앱의 존재 이유입니다** |
| `menu` | 메뉴 목록 | 아래 참고. 없으면 `[]` |
| `instagram` | 인스타 주소 | `"https://www.instagram.com/xxx"` 또는 `null`. `null`이면 버튼이 안 나옵니다 |
| `dataAsOf` | 정보 기준 시점 | `"2026-09"` 형식. 상세 화면 맨 아래에 표시됩니다 |

**메뉴 한 개(`menu` 안의 항목)**

| 칸 | 뜻 | 주의사항 |
|---|---|---|
| `name` | 메뉴 이름 | |
| `price` | 가격 | **원 단위 정수.** `14000` (O) / `14,000` `14000원` `14000.5` (X) |
| `base` | 베이스 주류 | `GIN` `WHISKY` `RUM` `VODKA` `TEQUILA` `BRANDY` `LIQUEUR` `WINE` `NON_ALC` 중 하나 |
| `isSignature` | 시그니처 여부 | `true`면 상세 화면 메뉴 맨 위에 배지와 함께 고정됩니다 |
| `desc` | 한 줄 설명 | 없으면 `""` |

### 2-4. 자주 나는 오류

`npm run validate`가 알려주는 메시지와 뜻입니다.

| 메시지 | 뜻 |
|---|---|
| `kebab-case 소문자/숫자/하이픈만 사용할 수 있습니다` | `id`에 대문자·공백·한글·밑줄이 들어갔습니다 |
| `Too big: expected number to be <=35.9` | `lat`에 경도(127.x)를 넣었습니다. `lat`↔`lng`를 바꿔 넣으세요 |
| `Invalid option: expected one of "대학로"｜"객사"｜"신시가지"` | `district` 값이 셋 중 하나가 아닙니다 |
| `expected int, received number` | `price`에 소수점이 들어갔습니다 |
| `id "xxx"가 3번째와 7번째에 중복됩니다` | 같은 `id`를 두 번 썼습니다 |
| `bars.json이 올바른 JSON이 아닙니다` | 쉼표를 빠뜨렸거나 더 찍었습니다. 알려주는 줄 번호 근처를 보세요 |

빌드는 통과하지만 **경고**로 알려주는 것들도 있습니다: `note`가 비었을 때, 메뉴가 0개일 때,
`__SAMPLE__` 샘플 데이터가 남아 있을 때, `dataAsOf`가 `2026-09` 형식이 아닐 때.

> **샘플 2건은 실제 데이터를 채운 뒤 지우세요.** `__SAMPLE__`로 시작하는 항목입니다.

---

## 3. 좌표(위도·경도) 구하는 법

1. PC에서 [카카오맵](https://map.kakao.com)을 열고 가게를 검색합니다
2. 가게 위치에서 **마우스 우클릭** → 좌표를 보여주는 메뉴 항목을 누릅니다
   (`이 위치의 좌표 보기` 등, 카카오맵 버전에 따라 문구가 다릅니다)
3. 나오는 두 숫자 중
   - **35.8xx** 로 시작하는 것이 **위도 = `lat`**
   - **127.1xx** 로 시작하는 것이 **경도 = `lng`**
4. 헷갈려서 바꿔 넣어도 괜찮습니다. `npm run validate`가 전주 범위(위도 35.7~35.9, 경도 127.0~127.3)를
   벗어난 값을 **빌드 전에 잡아줍니다.**

---

## 4. 카카오맵 키 설정 (지도 화면을 쓰려면)

지도 화면만 이 키가 필요합니다. 리스트와 상세는 키 없이 동작합니다.

### 4-1. 키 발급

1. [카카오 개발자 사이트](https://developers.kakao.com)에 로그인
2. **내 애플리케이션 → 애플리케이션 추가하기**
3. 만든 앱 → **앱 키** → **JavaScript 키**를 복사

### 4-2. 로컬에 넣기

`.env.example`을 복사해 `.env.local` 파일을 만들고 값을 채웁니다.

```
VITE_KAKAO_JS_KEY=여기에_복사한_JavaScript_키
```

`.env.local`은 git에 올라가지 않습니다. 개발 서버를 껐다 켜야 반영됩니다.

### 4-3. 키 보안에 대해 — 중요

**이 키는 브라우저에 그대로 노출됩니다. 숨길 방법이 없고, 숨기려 하지 마세요.**
정적 사이트에서 카카오맵을 쓰는 이상 누구나 개발자 도구로 키를 볼 수 있습니다.

대신 **도메인 등록으로 방어합니다.** 카카오 개발자 콘솔에서:

**내 애플리케이션 → 앱 설정 → 플랫폼 → Web → 사이트 도메인**에
아래 주소들을 등록하세요.

```
http://localhost:5173
https://실제-배포-주소.pages.dev
```

여기 등록된 도메인에서 온 요청만 지도가 뜹니다. 남이 키를 복사해가도 자기 사이트에서는 못 씁니다.
**배포 주소를 등록하지 않으면 배포된 사이트에서 지도가 안 뜹니다.** 5번의 4단계를 꼭 하세요.

---

## 5. 배포하기 (Cloudflare Pages)

1. 이 폴더를 GitHub 저장소에 push 합니다
2. [Cloudflare Pages](https://pages.cloudflare.com) → **Create a project → Connect to Git** → 저장소 선택
3. 빌드 설정을 이렇게 넣습니다
   | 항목 | 값 |
   |---|---|
   | Framework preset | `None` (또는 Vite) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
4. **Settings → Environment variables**에 `VITE_KAKAO_JS_KEY`를 추가합니다 (Production/Preview 둘 다)
5. 배포되면 `xxx.pages.dev` 주소가 나옵니다. **이 주소를 카카오 개발자 콘솔 웹 플랫폼에 등록합니다** (4-3 참고)
6. 부원 오픈채팅방에 링크를 공유하고 **"홈 화면에 추가"** 를 안내합니다

이후에는 `bars.json`을 고쳐서 push하면 Cloudflare가 자동으로 다시 배포합니다.
`bars.json`이 잘못되어 있으면 **빌드가 실패해서 잘못된 데이터가 배포되지 않습니다.**

---

## 6. 홈 화면에 추가 안내 (부원용 문구)

> **아이폰**: Safari로 링크를 열고 → 아래 공유 버튼 → `홈 화면에 추가`
> **안드로이드**: Chrome으로 링크를 열고 → 오른쪽 위 ⋮ → `홈 화면에 추가`

---

## 7. 폴더 구조

```
src/
  domain/
    schema.ts        데이터 정의(Zod). 여기가 데이터의 진짜 규칙
    selectors.ts     필터·정렬 계산. React를 쓰지 않는 순수 함수만
    bars.ts          bars.json을 읽는 유일한 통로
  data/
    bars.json        ★ 데이터 전부. 운영진이 고치는 파일
  map/               ★ 카카오맵 관련 코드는 이 폴더 밖으로 나가지 않는다
    KakaoMapView.tsx SDK를 감싼 유일한 컴포넌트
    useKakaoLoader.ts SDK 동적 로딩
    types.ts         MapMarker + SDK 타입 선언
  components/        Chip, BarCard, AppShell
  pages/             ListPage, BarDetailPage, MapPage, useBarQuery
scripts/
  validate.ts        npm run validate
  make-icons.ts      npm run icons
docs/
  SPEC.md            원본 개발 지시서
board-api/           ※ 이 앱과 무관한 백엔드 학습용 연습 프로젝트
```

> **`board-api/`는 이 앱의 일부가 아닙니다.** 백엔드 공부용으로 따로 만든
> 게시판 API 연습 프로젝트이고, 이 앱은 그 서버를 호출하지 않습니다.
> 지우거나 무시하셔도 앱 동작에는 아무 영향이 없습니다. 자세한 내용은
> `board-api/README.md`를 보세요.

### 코드 규칙 두 가지

1. **`window.kakao` 참조는 `src/map/` 안에서만.** 나중에 다른 지도 서비스로 갈아탈 때 이 폴더만
   통째로 바꾸면 되게 하려는 것입니다. `KakaoMapView`는 `markers`, `selectedId`, `onSelect`
   세 개의 props만 받습니다.
2. **`src/domain/selectors.ts`에는 React를 import하지 않습니다.** 화면이 바뀌어도 계산 로직은
   그대로 쓸 수 있어야 합니다.

---

## 8. 필터 링크 공유하기

필터 상태가 주소에 그대로 들어갑니다. 주소를 복사해서 보내면 상대도 같은 화면을 봅니다.

```
#/?district=객사                     객사만
#/?beginner=1                        입문자 추천만
#/?price=under&sort=price            1만원 이하, 최저가순
#/?district=대학로&beginner=1         대학로 + 입문자 추천
```

`district`: `대학로` `객사` `신시가지` · `beginner`: `1` ·
`price`: `under`(1만원 이하) `mid`(1~1.5만원) `over`(1.5만원 이상) · `sort`: `name` `price`

---

## 9. PWA(홈 화면 앱) 확인하는 법

빌드 결과에는 서비스워커가 포함되어 있어, 한 번 연 뒤에는 네트워크가 없어도 리스트와 상세가 열립니다.
직접 확인하려면:

```bash
npm run build
npx vite preview --port 4173
```

크롬에서 `http://localhost:4173` 접속 후 개발자 도구에서

- **Application → Service Workers**: 등록되어 있는지
- **Application → Manifest**: 이름·아이콘이 보이는지
- **Network 탭 → Offline 체크 후 새로고침**: 리스트·상세가 뜨는지 (지도는 당연히 안 뜹니다)

아이폰 홈 화면 아이콘은 실제 기기에서만 확인됩니다. 같은 와이파이에서 보려면
`npx vite preview --host`로 실행한 뒤 나오는 네트워크 주소로 접속하세요.

> 지도 타일은 **일부러 캐시하지 않습니다.** 용량을 금방 채우고, 오래된 타일은 오히려 틀린 정보라서요.

---

## 10. 아이콘 바꾸기

`scripts/make-icons.ts`가 마티니 잔 모양을 코드로 그립니다. 모양이나 색을 바꾸려면
파일 위쪽의 `BG`, `FG` 색상값과 `inGlass()` 함수를 고치고 `npm run icons`를 실행하세요.
`public/`의 PNG들이 새로 만들어집니다. `public/favicon.svg`는 따로 손으로 고쳐야 합니다.
