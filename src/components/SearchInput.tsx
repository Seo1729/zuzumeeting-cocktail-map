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
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // pr-12: ✕ 버튼이 글자 위에 겹치지 않도록 오른쪽을 비워둔다.
        className="w-full rounded-xl border border-line bg-surface py-3 pr-12 pl-4 text-[16px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/*
        값이 있을 때만 지우기 버튼을 보여준다. 빈 칸 옆의 ✕는 무엇을 지우는지 알 수 없다.
        44px 정사각형을 확보한다 — 어두운 술집에서 엄지로 누르는 버튼이다.
      */}
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`${label} 지우기`}
          className="absolute top-1/2 right-1 h-11 w-11 -translate-y-1/2 rounded-lg text-[16px] text-muted active:bg-surface-2"
        >
          ✕
        </button>
      )}
    </div>
  )
}
