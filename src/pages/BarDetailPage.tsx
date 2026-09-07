import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { findBar } from '../domain/bars'
import { BASE_SPIRIT_LABEL, type Bar, type MenuItem } from '../domain/schema'
import { formatPrice, orderedMenu } from '../domain/selectors'

export default function BarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const bar = id ? findBar(id) : undefined

  if (!bar) return <NotFound />

  return (
    <article className="pb-[104px]">
      <TopBar />

      <header className="px-4 pt-2">
        <h1 className="text-[24px] leading-tight font-bold">{bar.name}</h1>
        <p className="mt-1 text-[15px] text-muted">{bar.district}</p>
      </header>

      {/* 운영진 코멘트. 카카오맵에 없는 유일한 정보이고 이 앱의 존재 이유라 가장 크게 놓는다. */}
      {bar.note && (
        <section className="mx-4 mt-4 rounded-2xl border border-accent/35 bg-accent/10 p-4">
          <p className="text-[15px] font-semibold text-accent">운영진 한 줄 평</p>
          <p className="mt-2 text-[18px] leading-relaxed font-medium text-text">{bar.note}</p>
        </section>
      )}

      <section className="mt-5 px-4">
        <InfoRow label="주소" value={bar.address} />
        <InfoRow label="영업시간" value={bar.hours} />
        <InfoRow
          label="휴무일"
          value={bar.closedDays.length > 0 ? bar.closedDays.join(', ') : ''}
        />
      </section>

      {(bar.beginnerFriendly || bar.tags.length > 0) && (
        <ul className="mt-4 flex flex-wrap gap-1.5 px-4">
          {bar.beginnerFriendly && (
            <li className="rounded-md bg-accent/15 px-2.5 py-1.5 text-[15px] text-accent">
              입문자 추천
            </li>
          )}
          {bar.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-surface-2 px-2.5 py-1.5 text-[15px] text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <MenuSection bar={bar} />

      <p className="px-4 pt-8 text-[15px] leading-relaxed text-muted">
        정보 기준: {bar.dataAsOf} · 가격과 영업 정보는 변경되었을 수 있습니다
      </p>

      <ActionBar bar={bar} />
    </article>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  // 링크를 직접 열고 들어온 경우(history가 없음) 뒤로가기가 앱 밖으로 나가버린다.
  // React Router는 첫 진입 항목의 key를 'default'로 둔다. 그때는 리스트로 보낸다.
  const goBack = () => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }

  return (
    <div className="sticky top-0 z-20 bg-ink/95 px-2 py-2 backdrop-blur">
      <button
        type="button"
        onClick={goBack}
        className="rounded-lg px-3 py-2 text-[15px] text-muted active:bg-surface-2"
      >
        ← 목록
      </button>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  // 값이 비어 있으면 줄 자체를 감춘다. "정보 없음"을 굳이 보여줄 이유가 없다.
  if (!value) return null
  return (
    <div className="flex gap-3 border-b border-line py-3 last:border-b-0">
      <span className="w-[68px] shrink-0 text-[15px] text-muted">{label}</span>
      <span className="text-[15px] text-text">{value}</span>
    </div>
  )
}

function MenuSection({ bar }: { bar: Bar }) {
  if (bar.menu.length === 0) {
    return (
      <section className="mt-6 px-4">
        <h2 className="text-[18px] font-bold">메뉴</h2>
        <p className="mt-2 text-[15px] text-muted">아직 등록된 메뉴가 없습니다.</p>
      </section>
    )
  }

  return (
    <section className="mt-6 px-4">
      <h2 className="text-[18px] font-bold">메뉴</h2>
      <ul className="mt-2">
        {orderedMenu(bar).map((item, index) => (
          <MenuRow key={`${item.name}-${index}`} item={item} />
        ))}
      </ul>
    </section>
  )
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[16px] font-medium text-text">
          {item.isSignature && (
            <span className="mr-1.5 rounded bg-accent px-1.5 py-0.5 text-[15px] font-semibold text-accent-ink">
              시그니처
            </span>
          )}
          {item.name}
        </p>
        <p className="shrink-0 text-[16px] font-semibold text-text">{formatPrice(item.price)}</p>
      </div>
      <p className="mt-1 text-[15px] text-muted">
        {BASE_SPIRIT_LABEL[item.base]}
        {item.desc && ` · ${item.desc}`}
      </p>
    </li>
  )
}

function ActionBar({ bar }: { bar: Bar }) {
  // 카카오맵 길찾기 딥링크. 가게 이름에 쉼표나 공백이 있어도 깨지지 않게 인코딩한다.
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(bar.name)},${bar.lat},${bar.lng}`

  return (
    <div className="fixed bottom-0 z-30 w-full max-w-[480px] border-t border-line bg-surface/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
      <div className="flex gap-2">
        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-accent py-3.5 text-center text-[16px] font-bold text-accent-ink active:opacity-80"
        >
          카카오맵으로 길찾기
        </a>
        {bar.instagram && (
          <a
            href={bar.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl border border-line px-5 py-3.5 text-center text-[16px] font-semibold text-text active:bg-surface-2"
          >
            인스타
          </a>
        )}
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-[16px] text-muted">찾을 수 없는 바입니다.</p>
      <Link
        to="/"
        className="mt-4 inline-block rounded-full border border-line px-5 py-2.5 text-[15px] text-text active:bg-surface-2"
      >
        목록으로
      </Link>
    </div>
  )
}
