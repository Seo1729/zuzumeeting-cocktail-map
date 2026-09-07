import { Link } from 'react-router-dom'
import type { Bar } from '../domain/schema'
import { formatPrice, headlineMenu } from '../domain/selectors'

/*
  리스트의 카드 한 장. "오늘 어디 갈까"를 3초 안에 정하게 하는 것이 목적이라
  운영진 한 줄 평(note)까지 카드에서 바로 보여준다.
*/
export default function BarCard({ bar }: { bar: Bar }) {
  const menu = headlineMenu(bar)

  return (
    <Link
      to={`/bar/${bar.id}`}
      className="block rounded-2xl border border-line bg-surface p-4 active:bg-surface-2"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-[18px] font-bold text-text">{bar.name}</h2>
        <span className="text-[15px] text-muted">{bar.district}</span>
      </div>

      {menu && (
        <p className="mt-2 text-[15px] text-text">
          {menu.isSignature && <span className="mr-1.5 text-accent">시그니처</span>}
          {menu.name}
          <span className="ml-2 font-semibold">{formatPrice(menu.price)}</span>
        </p>
      )}

      {(bar.beginnerFriendly || bar.tags.length > 0) && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {bar.beginnerFriendly && (
            <li className="rounded-md bg-accent/15 px-2 py-1 text-[15px] text-accent">
              입문자 추천
            </li>
          )}
          {bar.tags.slice(0, 3).map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2 py-1 text-[15px] text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {bar.note && (
        <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-muted">{bar.note}</p>
      )}
    </Link>
  )
}
