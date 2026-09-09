# cocktail-board-api

백엔드 학습용 게시판 API. **연습 프로젝트입니다.**

같은 저장소에 있지만 **동아리 앱과 완전히 별개로 돕니다.**
앱은 이 서버를 호출하지 않으므로, 이 서버가 죽어도 부원들이 쓰는 앱은
아무 영향을 받지 않습니다. 저장소만 같이 쓸 뿐 실행은 따로입니다.

**4단계(인증)를 끝내기 전에는 이 서버를 앱에 연결하지 마세요.**

---

## 실행

저장소 루트가 아니라 **이 폴더에서** 실행합니다. 루트의 `npm` 명령과 별개입니다.

```bash
cd board-api
npm install
npm run dev
```

`npm run dev`는 파일을 고치면 자동으로 재시작합니다(`node --watch`).
빌드 단계가 없습니다 — Node 24가 TypeScript를 그대로 실행합니다.

| 명령어 | 하는 일 |
|---|---|
| `npm run dev` | 자동 재시작 개발 서버 |
| `npm start` | 그냥 실행 |
| `npm run typecheck` | 타입 검사 (`tsc --noEmit`) |

---

## 지금 되는 것

```bash
curl http://localhost:3000/health
curl http://localhost:3000/posts
```

`GET /posts` **하나만 구현돼 있습니다.** 이게 완성된 예제고, 나머지는 이 모양을 따라 만드시면 됩니다.

---

## 1단계 과제

`src/store.ts`와 `src/routes/posts.ts`에 `TODO(1-x)` 주석이 있습니다.
`throw`를 지우고 구현하세요. 순서대로 하시는 걸 권합니다.

| | 만들 것 | 확인 방법 |
|---|---|---|
| 1-2 | `GET /posts/:id` | `curl http://localhost:3000/posts/1` |
| 1-3 | `POST /posts` | 아래 참고 |
| 1-4 | `PATCH /posts/:id` | 아래 참고 |
| 1-5 | `DELETE /posts/:id` | 아래 참고 |

### 확인용 curl

PowerShell에서는 `curl`이 다른 명령(`Invoke-WebRequest`)의 별칭이라 아래가 안 됩니다.
**Git Bash**에서 실행하거나, PowerShell이면 `curl.exe`로 쓰세요.

```bash
# 글 하나
curl -i http://localhost:3000/posts/1

# 새 글
curl -i -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"author":"나","title":"제목","body":"내용"}'

# 수정 (title만 바꾸기)
curl -i -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"바뀐 제목"}'

# 삭제
curl -i -X DELETE http://localhost:3000/posts/1
```

`-i`는 응답 헤더와 **상태 코드**를 같이 보여줍니다. 백엔드를 배울 때는
본문보다 상태 코드를 먼저 보는 습관이 중요합니다.

### 스스로 확인할 것

구현했다고 끝이 아닙니다. 이것들이 어떻게 동작하는지 직접 쳐보세요.

- `GET /posts/999` — 없는 글. 404가 나오나요?
- `GET /posts/abc` — 숫자가 아닌 id. 무슨 일이 벌어지나요?
- `POST` 할 때 `title`을 빼고 보내면? `body`에 숫자를 넣으면?
- `POST` 할 때 `id`를 직접 넣어 보내면? 서버가 그걸 받아주나요? (받아주면 안 됩니다)
- `DELETE` 를 같은 id로 두 번 하면?

**마지막 두 개가 3단계와 4단계로 이어지는 질문입니다.**

---

## 폴더 구조

```
src/
  index.ts          서버 조립 + 포트 열기. 라우트 로직은 여기 넣지 않는다
  types.ts          Post 타입
  store.ts          데이터를 다루는 곳. HTTP를 모른다
  routes/
    posts.ts        HTTP를 다루는 곳. 값 꺼내고 → store 부르고 → 상태 코드와 함께 응답
```

### 이 구조를 지켜야 하는 이유

**`store.ts`는 HTTP를 몰라야 합니다.** 저장소가 404를 만들기 시작하면
같은 로직을 다른 곳(CLI, 봇, 배치 작업)에서 재사용할 수 없게 됩니다.
"없으면 `undefined`를 돌려주고, 그걸 404로 바꿀지는 라우트가 정한다."

2단계에서 `store.ts`만 SQLite 버전으로 갈아끼우고 `routes/`는 손대지 않는 게 목표입니다.
지금 이 경계를 지켜두면 2단계가 30분이고, 안 지키면 하루가 됩니다.

---

## 전체 커리큘럼

| 단계 | 만드는 것 | 배우는 것 |
|---|---|---|
| **1** | **메모리 배열 CRUD** ← 지금 여기 | HTTP 메서드, 라우팅, 상태 코드, REST |
| 2 | SQLite로 교체 (`node:sqlite`, 내장) | 스키마 설계, SQL, prepared statement와 SQL 인젝션 |
| 3 | Zod로 입력 검증 | 서버는 클라이언트를 믿지 않는다, 일관된 에러 응답 |
| 4 | 로그인 | 비밀번호 해싱, 세션 vs JWT, 쿠키, 권한 |
| 5 | 운영 | CORS, 요청 제한, 로깅, `.env`, 정상 종료 |
| 6 | Cloudflare Tunnel로 외부 공개 | HTTPS, 인터넷에 노출한다는 것의 무게 |
| **7** | **Docker화 + 홈 데스크탑 상시 운영** | 이미지·볼륨, 재시작 정책, 서버를 직접 켜놓고 관리한다는 것 |

> 원래 7단계는 "Workers + D1으로 이전(서버리스)"이었다. 서버를 직접 띄워놓고 운영하는
> 경험을 원해서 Docker + 상시 서버 방향으로 바꿨다. **서버리스와 상시 운영은 반대
> 방향의 지식이다** — 서버리스는 "운영을 안 해도 되게" 만드는 쪽이고, 이 7단계는
> "운영을 직접 해보는" 쪽이다. 둘 다 궁금하면 7단계를 끝낸 뒤 별도로 Workers+D1도
> 시도해볼 수 있다. 그때는 SQLite를 D1으로, Docker 없이 git push 배포로 바뀐다.

---

## 7단계 참고 — 홈 데스크탑을 상시 서버로 쓸 때

아직 1단계도 안 끝났으니 지금 당장 할 일은 아니지만, 나중에 7단계에 왔을 때
반드시 챙길 것 세 가지를 미리 적어둔다. 이걸 안 챙기면 "컨테이너는 떠 있는데
접속이 안 되는" 원인 불명의 문제로 착각하게 된다.

| 문제 | 안 챙기면 벌어지는 일 | 해결 |
|---|---|---|
| 절전 모드 | 화면이 꺼지고 컴퓨터가 잠들면 컨테이너도 응답을 멈춘다 | 설정 → 전원 → 절전 안 함 |
| 재부팅 후 자동 시작 | 정전·업데이트로 재부팅되면 Docker도 컨테이너도 다시 안 켜진다 | Docker Desktop "시작 시 실행" + 컨테이너에 `restart: always` |
| SQLite 파일 위치 | 컨테이너 안에 DB 파일을 두면 이미지를 다시 빌드할 때 데이터가 통째로 날아간다 | 볼륨 마운트로 컨테이너 밖에 저장: `docker run -v ./data:/app/data ...` |

세 번째가 특히 배울 가치가 있는 함정이다. "컨테이너는 매번 새로 만들어지는 게
정상이고, 데이터는 컨테이너 밖에 살아야 한다"는 감각은 Docker를 쓰는 이상
어디서나 반복된다.

---

## 보안 주의 — 4단계(인증) 전까지 꼭 지킬 것

지금 서버는 **localhost에만** 열려 있습니다. 이대로 두세요.

`src/index.ts`의 `serve()`에 `hostname: '0.0.0.0'`을 넣으면 같은 와이파이의
다른 기기에서 접속할 수 있게 됩니다. 편해 보이지만, **그 순간부터 같은 네트워크의
누구나 글을 쓰고 지울 수 있습니다.** 인증이 없으니까요.

인터넷에 공개하는 건 **4단계(인증)를 끝낸 뒤**입니다.
인증 없는 쓰기 엔드포인트를 인터넷에 열면 스캐너가 몇 시간 안에 찾아냅니다.

`.env`와 `*.db`는 `.gitignore`에 이미 들어가 있습니다. 저장소에 올리지 마세요.

---

## 참고

- [Hono 문서](https://hono.dev) — 라우팅, `c.req`, `c.json` 사용법
- [MDN HTTP 상태 코드](https://developer.mozilla.org/ko/docs/Web/HTTP/Status) — 뭘 언제 쓰는지
- `node:sqlite`는 Node 22.5+ 내장입니다. 2단계에서 별도 설치 없이 씁니다
