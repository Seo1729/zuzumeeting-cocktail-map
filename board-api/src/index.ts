import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { posts } from './routes/posts.ts'

/*
  서버 진입점.

  여기서는 앱을 조립하고 포트를 여는 일만 한다.
  라우트가 늘어나면 routes/ 아래에 파일을 만들고 여기에 route()로 붙인다.
*/

const app = new Hono()

/** 서버가 살아있는지 확인용. 배포하면 이런 엔드포인트가 꼭 필요해진다. */
app.get('/health', (c) => c.json({ ok: true }))

// /posts 로 시작하는 요청은 전부 routes/posts.ts가 처리한다.
app.route('/posts', posts)

// 어디에도 걸리지 않은 요청. 이게 없으면 Hono가 밋밋한 기본 404를 준다.
app.notFound((c) => c.json({ error: '그런 주소는 없습니다' }, 404))

/*
  라우트 안에서 에러가 터졌을 때의 마지막 그물.
  이게 없으면 서버가 스택 트레이스를 그대로 응답에 실어 보낼 수 있다.
  내부 구조를 공격자에게 알려주는 흔한 실수라, 서버에는 남기고 응답에는 안 담는다.
*/
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: '서버 오류' }, 500)
})

const port = Number(process.env['PORT'] ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n게시판 API 실행 중 → http://localhost:${info.port}`)
  console.log(`확인: curl http://localhost:${info.port}/posts\n`)
})

/*
  지금은 localhost에만 열려 있다. 같은 와이파이의 폰에서도 접속하려면
  serve에 hostname: '0.0.0.0'을 넘겨야 한다.

  다만 그 순간부터 같은 네트워크의 누구나 이 서버에 글을 쓸 수 있게 된다.
  인증이 없는 4단계 이전에는 localhost로만 두는 것을 권한다.
*/
