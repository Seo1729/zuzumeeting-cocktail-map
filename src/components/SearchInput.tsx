import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** 스크린리더용 이름. 화면에는 라벨을 두지 않으므로 이 값이 유일한 이름이다. */
  label: string
}

/*
  리스트의 바 검색과 상세의 메뉴 검색이 같이 쓴다.

  type="search"가 아니라 type="text"를 쓴다. search는 브라우저마다 제멋대로인 기본
  지우기 버튼이 붙어서, 우리가 그린 ✕ 버튼과 두 개가 겹쳐 보이는 기기가 있다.

  enterKeyHint="search"로 모바일 키보드의 확인 키를 "검색"으로 바꾼다. 실제로는
  글자를 칠 때마다 결과가 바뀌므로 엔터를 누를 일이 없지만, 키가 "다음"이나 "이동"이면
  누르고 나서 뭔가 더 있을 거라 기대하게 된다.
*/
export default function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  /*
    화면에 보이는 글자(draft)를 부모의 value와 따로 들고 있는다.

    리스트 화면의 검색어는 URL 쿼리스트링이 원본이라, 한 글자 칠 때마다
    입력 → URL 갱신 → 라우터 → 다시 렌더 → 입력창 value 로 한 바퀴를 돌아온다.
    이 왕복이 입력창을 붙잡고 있으면 두 가지가 깨진다.
      · 왕복 중에 값이 가공되면 친 글자가 바뀐다 (뒤 공백이 잘려 띄어쓰기를 못 치던 버그).
      · 한글은 자모를 조합하는 중에 입력창의 값이 밖에서 바뀌면 조합이 끊겨
        글자가 쪼개지거나 중복된다. 부원 대부분이 한글로 치는 앱이라 가장 아프다.
    그래서 입력창은 자기 draft만 보고, URL은 그 결과를 뒤따라 적기만 한다.
  */
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | null>(null)

  /*
    밖에서 값이 바뀐 경우(필터 초기화 등)만 draft를 따라가게 한다.

    입력창에 포커스가 있는 동안에는 따라가지 않는다. 빠르게 'a', 'ab'를 치면 부모 값은
    'a'가 나중에 도착하는데, 그때 draft(이미 'ab')를 'a'로 되돌리면 방금 친 글자가 사라진다.
    포커스가 있다는 것은 지금 사용자가 직접 치고 있다는 뜻이라 draft가 항상 옳다.
  */
  useEffect(() => {
    if (document.activeElement === inputRef.current) return
    setDraft(value)
  }, [value])

  const handleChange = (next: string) => {
    setDraft(next)
    onChange(next)
  }

  return (
    <div className="relative">
      {/*
        돋보기. 글자를 읽기 전에 여기가 입력칸이라는 걸 알리는 유일한 표시다.
        aria-hidden — 옆의 input이 이미 aria-label로 이름을 갖고 있어 두 번 읽을 이유가 없다.
      */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="pointer-events-none absolute top-1/2 left-4 h-[19px] w-[19px] -translate-y-1/2 text-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        aria-label={label}
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        // pl-11: 돋보기 자리. pr-12: ✕ 버튼이 글자 위에 겹치지 않도록.
        className="w-full rounded-[14px] border border-line bg-surface py-3.5 pr-12 pl-11 text-[16px] text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/*
        값이 있을 때만 지우기 버튼을 보여준다. 빈 칸 옆의 ✕는 무엇을 지우는지 알 수 없다.
        44px 정사각형을 확보한다 — 어두운 술집에서 엄지로 누르는 버튼이다.

        ✕를 누르면 입력창이 아니라 이 버튼이 포커스를 받으므로, 위 effect의 포커스 검사를
        통과해 draft가 알아서 비워진다. 그래도 draft를 직접 비워 왕복을 기다리지 않는다.
      */}
      {draft !== '' && (
        <button
          type="button"
          onClick={() => handleChange('')}
          aria-label={`${label} 지우기`}
          className="absolute top-1/2 right-1 h-11 w-11 -translate-y-1/2 rounded-lg text-[16px] text-muted active:bg-surface-2"
        >
          ✕
        </button>
      )}
    </div>
  )
}
