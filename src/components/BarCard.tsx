import { Link } from 'react-router-dom'
import { DISTRICT_DOT, type Bar } from '../domain/schema'
import { formatPrice, headlineMenu } from '../domain/selectors'

/*
  리스트의 카드 한 장. "오늘 어디 갈까"를 3초 안에 정하게 하는 것이 목적이라
  운영진 한 줄 평(note)까지 카드에서 바로 보여준다.
*/
export default function BarCard({ bar }: { bar: Bar }) {
  const menu = headlineMenu(bar)

  /*
    아직 위치만 있고 평도 메뉴도 없는 곳.

    전에는 이름 한 줄만 덩그러니 남아서 고장난 카드처럼 보였다. 비어 있다는 것을
    말로 밝히고 테두리를 점선으로 바꿔, 채워진 카드와 한눈에 구분되게 한다.
    누르면 주소와 길찾기는 나오므로 링크는 그대로 살려둔다.
  */
  const isStub = !bar.note && !menu && bar.tags.length === 0

  if (isStub) {
    return (
      <Link
        to={`/bar/${bar.id}`}
        className="flex items-center gap-2 rounded-[18px] border border-dashed border-line bg-ink/40 px-4 py-4 active:bg-surface"
      >
        <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-line" />
        <h2 className="text-[19px] font-bold tracking-[-0.02em] text-text/75">{bar.name}</h2>
        <span className="text-[15px] text-muted">{bar.district}</span>
        <span className="ml-auto shrink-0 text-[15px] text-muted/80">위치만 등록됨</span>
      </Link>
    )
  }

  return (
    /*
      위쪽 1px 하이라이트 + 옅은 세로 그러데이션.
      배경이 거의 검정이라 테두리만으로는 카드가 바닥에 붙어 보인다.
    */
    <Link
      to={`/bar/${bar.id}`}
      className="block rounded-[18px] border border-line bg-gradient-to-b from-[#1a1a23] to-surface px-4 pt-[15px] pb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_1px_2px_rgba(0,0,0,0.4)] active:bg-surface-2"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ backgroundColor: DISTRICT_DOT[bar.district] }}
        />
        <h2 className="text-[19px] font-bold tracking-[-0.02em] text-text">{bar.name}</h2>
        <span className="text-[15px] text-muted">{bar.district}</span>

        {bar.beginnerFriendly && (
          <span className="ml-auto flex shrink-0 items-center gap-[5px] rounded-[7px] bg-accent/15 px-2.5 py-1 text-[15px] font-semibold text-accent">
            <StarIcon />
            입문
          </span>
        )}
      </div>

      {/*
        대표 메뉴. 이름과 값을 양끝으로 벌린다.
        전에는 값이 이름 바로 뒤에 붙어 있어서, 카드가 여러 장 쌓이면 값의 위치가
        이름 길이마다 달라져 세로로 훑어 비교할 수가 없었다.
      */}
      {menu && (
        <div className="mt-[11px] flex items-baseline gap-2.5">
          <div className="flex min-w-0 items-baseline gap-[7px]">
            {menu.isSignature && (
              <span className="shrink-0 rounded-[5px] bg-accent px-1.5 py-0.5 text-[15px] font-bold text-accent-ink">
                시그니처
              </span>
            )}
            <span className="truncate text-[15px] text-text/90">{menu.name}</span>
          </div>
          <span className="ml-auto shrink-0 text-[15px] font-bold text-accent tabular-nums">
            {formatPrice(menu.price)}
          </span>
        </div>
      )}

      {bar.tags.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {bar.tags.slice(0, 3).map((tag) => (
            <li key={tag} className="rounded-[7px] bg-surface-2 px-2.5 py-1 text-[15px] text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {/* 한 줄 평은 이 앱의 존재 이유라, 가는 선으로 끊어 따로 읽히게 둔다. */}
      {bar.note && (
        <p className="mt-[13px] line-clamp-2 border-t border-surface-2 pt-3 text-[15px] leading-relaxed text-text/70">
          {bar.note}
        </p>
      )}
    </Link>
  )
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
    >
      <path d="M12 3l2.4 5.3 5.6.7-4.2 3.9 1.1 5.6L12 15.8 7.1 18.5l1.1-5.6L4 9l5.6-.7z" />
    </svg>
  )
}
