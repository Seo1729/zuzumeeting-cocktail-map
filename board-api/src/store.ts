import type { NewPost, Post } from './types.ts'

/*
  1단계 저장소: 그냥 메모리 배열.

  서버를 끄면 다 사라진다. 그게 정상이고, 2단계에서 SQLite로 바꾸면서
  "영속성(persistence)"이 왜 필요한지 몸으로 알게 된다.

  라우트(HTTP를 다루는 곳)와 저장소(데이터를 다루는 곳)를 파일로 나눠둔 이유는,
  2단계에서 이 파일 하나만 SQLite 버전으로 갈아끼우고 라우트는 손대지 않기 위해서다.
  지금 이 구분을 지켜두면 2단계가 30분이고, 안 지키면 하루가 된다.

  규칙 하나: 이 파일은 HTTP를 몰라야 한다.
  여기서 404나 상태 코드를 만들기 시작하면, 나중에 이 코드를 다른 곳
  (예: 텔레그램 봇, CLI)에서 재사용할 수 없게 된다.
  "없으면 undefined를 돌려주고, 404로 바꿀지는 라우트가 정한다."
*/

// 시드 데이터. 서버를 켜면 이 두 개가 들어 있다.
const posts: Post[] = [
  {
    id: 1,
    author: '운영진',
    title: '게시판 테스트',
    body: '첫 글입니다.',
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 2,
    author: '김부원',
    title: '객사 쪽 신규 바 다녀왔습니다',
    body: '진 베이스가 강했어요.',
    createdAt: '2026-09-03T15:30:00.000Z',
  },
]

/** 다음에 발급할 id. 2단계에서는 SQLite의 AUTOINCREMENT가 이 역할을 대신한다. */
let nextId = 3

/** id를 하나 발급하고 다음 값으로 넘긴다. createPost에서 쓰세요. */
export function takeNextId(): number {
  return nextId++
}

// ─────────────────────────────────────────────────────────────
// 완성된 예제 — 나머지는 이 모양을 따라 만드시면 됩니다.
// ─────────────────────────────────────────────────────────────

/** 최신 글이 위로. 목록은 보통 최신순이다. */
export function listPosts(): Post[] {
  return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ─────────────────────────────────────────────────────────────
// 여기부터 직접 채우세요.
// throw를 지우고 구현하면 됩니다. 시그니처는 바꾸셔도 됩니다.
// ─────────────────────────────────────────────────────────────

/** TODO(1-2): id로 글 하나 찾기. 없으면 undefined. */
export function getPost(id: number): Post | undefined {
  // 힌트: posts.find(...)
  throw new Error(`아직 구현하지 않았습니다: getPost(${id})`)
}

/** TODO(1-3): 새 글 만들기. 만들어진 글을 돌려준다. */
export function createPost(input: NewPost): Post {
  /*
    - id는 takeNextId()로 받는다
    - createdAt은 서버가 지금 시각으로 넣는다 → new Date().toISOString()
    - 만든 글을 posts에 넣고 그대로 돌려준다
      (클라이언트가 방금 만들어진 id를 알아야 하기 때문)
  */
  throw new Error(`아직 구현하지 않았습니다: createPost(${input.title})`)
}

/** TODO(1-4): 글 수정. 없으면 undefined. */
export function updatePost(id: number, patch: Partial<NewPost>): Post | undefined {
  /*
    - patch에 들어온 필드만 바꾼다. title만 왔으면 body는 그대로 둔다
    - PATCH는 "보낸 것만 바꾼다", PUT은 "통째로 갈아끼운다". 우리는 PATCH를 만든다
  */
  throw new Error(`아직 구현하지 않았습니다: updatePost(${id}, ${JSON.stringify(patch)})`)
}

/** TODO(1-5): 글 삭제. 지웠으면 true, 없는 id였으면 false. */
export function removePost(id: number): boolean {
  // 힌트: findIndex + splice
  throw new Error(`아직 구현하지 않았습니다: removePost(${id})`)
}
