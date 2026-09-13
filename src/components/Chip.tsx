interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
  /** 상권 칩에만 찍는 색점. 그 외 칩은 넘기지 않는다. */
  dotColor?: string
}

/*
  필터 칩. 최소 44px 높이 — 어두운 데서 엄지로 누르는 버튼이다.
  선택 상태는 색만이 아니라 테두리로도 구분한다.

  안 고른 칩은 속을 비워 테두리만 남긴다. 전에는 안 고른 것도 surface로 채워져 있어서
  칩 일고여덟 개가 전부 비슷한 덩어리로 보였고, 고른 하나가 묻혔다.
*/
export default function Chip({ label, selected, onClick, dotColor }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'flex h-11 shrink-0 items-center gap-[7px] rounded-full border px-4 text-[15px] whitespace-nowrap transition-colors',
        selected
          ? 'border-accent bg-accent font-bold text-accent-ink'
          : 'border-line bg-transparent font-medium text-text/80 active:bg-surface-2',
      ].join(' ')}
    >
      {/*
        고른 칩에서는 점을 감춘다. 칩 전체가 이미 그 색으로 차 있어서
        같은 색 점을 또 찍으면 얼룩으로 보인다.
      */}
      {dotColor && !selected && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {label}
    </button>
  )
}
