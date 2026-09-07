/*
  게시글 하나의 모양.

  1단계에서는 이 타입만 있으면 된다. 2단계에서 SQLite로 옮길 때 이 모양이
  그대로 테이블 컬럼이 된다고 생각하면 편하다.
*/

export interface Post {
  id: number
  /** 글쓴이 이름. 4단계에서 로그인을 붙이면 이 필드는 사라지고 userId가 대신 들어온다. */
  author: string
  title: string
  body: string
  /** ISO 8601 문자열. 예: "2026-09-07T12:34:56.000Z" */
  createdAt: string
}

/** 클라이언트가 새 글을 만들 때 보내는 것. id와 createdAt은 서버가 정한다. */
export type NewPost = Pick<Post, 'author' | 'title' | 'body'>

/*
  왜 id와 createdAt을 클라이언트가 못 보내게 하나?

  클라이언트가 보내는 값은 전부 조작될 수 있다. id를 마음대로 정하게 두면
  남의 글을 덮어쓸 수 있고, createdAt을 정하게 두면 목록 맨 위에 영원히
  고정되는 글을 만들 수 있다.

  "서버가 정해야 하는 값과 클라이언트가 정해도 되는 값을 나눈다" —
  이게 백엔드에서 제일 먼저 몸에 익혀야 하는 감각이다.
*/
