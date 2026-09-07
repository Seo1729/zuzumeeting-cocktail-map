interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

/*
  필터 칩. 최소 44px 높이 — 어두운 데서 엄지로 누르는 버튼이다.
  선택 상태는 색만이 아니라 테두리로도 구분한다.
*/
export default function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'shrink-0 rounded-full border px-4 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors',
        selected
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line bg-surface text-muted active:bg-surface-2',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
