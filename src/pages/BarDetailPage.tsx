import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import SearchInput from '../components/SearchInput'
import { findBar } from '../domain/bars'
import { BASE_SPIRIT_LABEL, DISTRICT_DOT, type Bar, type MenuItem } from '../domain/schema'
import { filterMenu, formatPrice, orderedMenu } from '../domain/selectors'

/*
  메뉴가 이보다 적으면 검색칸을 띄우지 않는다.

  메뉴 한두 개짜리 바에 검색칸이 붙으면 화면만 차지하고 누를 이유가 없다.
  지금 데이터가 정확히 그 모양이다 — 아람이 33개, 나머지는 0~1개.
  한 화면에 안 들어오기 시작하는 지점이 대략 여기다.
*/
const MENU_SEARCH_MIN = 8

export default function BarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const bar = id ? findBar(id) : undefined

  if (!bar) return <NotFound />

  // pb는 하단 '길찾기' 버튼(fixed)에 가리지 않도록 그 높이 + 홈 인디케이터만큼 비운 값이다.
  return (
    <article className="pb-[calc(104px+env(safe-area-inset-bottom))]">
      <TopBar />

      {/* 상권을 이름 위로 올린다. 어느 동네 이야기인지 알고 이름을 읽는 편이 자연스럽다. */}
      <header className="px-4 pt-1">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: DISTRICT_DOT[bar.district] }}
          />
          <p className="text-[15px] font-semibold tracking-[0.04em] text-muted">{bar.district}</p>
        </div>
        <h1 className="mt-1.5 text-[30px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          {bar.name}
        </h1>
      </header>

      {/* 운영진 코멘트. 카카오맵에 없는 유일한 정보이고 이 앱의 존재 이유라 가장 크게 놓는다. */}
      {bar.note && (
        <section className="mx-4 mt-4 rounded-[18px] border border-accent/30 bg-gradient-to-b from-accent/12 to-accent/5 px-4 pt-[15px] pb-4">
          <div className="flex items-center gap-1.5">
            <QuoteIcon />
            <p className="text-[15px] font-bold tracking-[0.03em] text-accent">운영진 한 줄 평</p>
          </div>
          <p className="mt-2 text-[19px] leading-[1.5] font-semibold tracking-[-0.015em] text-text">
            {bar.note}
          </p>
        </section>
      )}

      {/* 태그를 정보표 위로 올렸다. 어떤 성격의 바인지 먼저 알고 주소를 보는 순서가 맞다. */}
      {(bar.beginnerFriendly || bar.tags.length > 0) && (
        <ul className="mt-3.5 flex flex-wrap gap-1.5 px-4">
          {bar.beginnerFriendly && (
            <li className="flex items-center gap-[5px] rounded-lg bg-accent/15 px-2.5 py-1.5 text-[15px] font-semibold text-accent">
              <StarIcon />
              입문자 추천
            </li>
          )}
          {bar.tags.map((tag) => (
            <li key={tag} className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[15px] text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {/* 주소·시간·휴무일을 한 덩어리 판으로 묶는다. 전에는 줄만 그어져 배경에 흩어져 있었다. */}
      <section className="mx-4 mt-4 rounded-2xl border border-surface-2 bg-ink/50 px-3.5 py-1">
        <InfoRow label="주소" value={bar.address} />
        <InfoRow label="영업시간" value={bar.hours} numeric />
        <InfoRow
          label="휴무일"
          value={bar.closedDays.length > 0 ? bar.closedDays.join(', ') : ''}
        />
      </section>

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

  /*
    pt는 노치 높이만큼 위를 띄운 값이다. 배경이 반투명이라, 띄운 만큼 노치 뒤까지
    배경색이 깔려서 본문이 노치 밑으로 비쳐 지나가지 않는다.
  */
  return (
    <div className="sticky top-0 z-20 bg-ink/95 px-2 pt-[calc(8px+env(safe-area-inset-top))] pb-2 backdrop-blur">
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

function InfoRow({
  label,
  value,
  numeric = false,
}: {
  label: string
  value: string
  /** 영업시간처럼 숫자가 주인 값. 자릿수가 흔들리지 않게 고정폭 숫자로 쓴다. */
  numeric?: boolean
}) {
  // 값이 비어 있으면 줄 자체를 감춘다. "정보 없음"을 굳이 보여줄 이유가 없다.
  if (!value) return null
  return (
    <div className="flex gap-3 border-b border-surface-2 py-[11px] last:border-b-0">
      <span className="w-[62px] shrink-0 text-[15px] text-muted">{label}</span>
      <span className={['text-[15px] text-text/90', numeric ? 'tabular-nums' : ''].join(' ')}>
        {value}
      </span>
    </div>
  )
}

function MenuSection({ bar }: { bar: Bar }) {
  /*
    메뉴 검색어는 URL에 넣지 않는다.

    리스트의 필터는 "이 조건으로 본 화면"을 오픈채팅방에 공유하려고 URL에 둔다.
    반면 메뉴 검색은 바 앞에 서서 한 잔 고르는 동안만 쓰고 버리는 상태다.
    공유할 일이 없는 값을 URL에 넣으면 뒤로가기 이력만 지저분해진다.
  */
  const [keyword, setKeyword] = useState('')

  const ordered = useMemo(() => orderedMenu(bar), [bar])
  const shown = useMemo(() => filterMenu(ordered, keyword), [ordered, keyword])

  if (bar.menu.length === 0) {
    return (
      <section className="mt-6 px-4">
        <h2 className="text-[18px] font-bold">메뉴</h2>
        <p className="mt-2 text-[15px] text-muted">아직 등록된 메뉴가 없습니다.</p>
      </section>
    )
  }

  const searchable = bar.menu.length >= MENU_SEARCH_MIN

  return (
    <section className="mt-6 px-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-bold">메뉴</h2>
        {/* 검색 중에는 몇 개로 좁혀졌는지, 아니면 전체가 몇 개인지 알려준다. */}
        <p className="shrink-0 text-[15px] text-muted">
          {keyword !== '' ? `${shown.length} / ${ordered.length}개` : `${ordered.length}개`}
        </p>
      </div>

      {searchable && (
        <div className="mt-3">
          <SearchInput
            label="메뉴 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="메뉴, 재료, 기주로 검색 (예: 라임, 진)"
          />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted">'{keyword}'에 해당하는 메뉴가 없습니다.</p>
      ) : (
        <ul className="mt-2">
          {shown.map((item, index) => (
            <MenuRow key={`${item.name}-${index}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="flex items-baseline gap-2.5 border-b border-surface-2 py-[13px] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[16px] font-semibold text-text">
          {item.isSignature && (
            <span className="mr-1.5 rounded-[5px] bg-accent px-1.5 py-0.5 text-[15px] font-bold text-accent-ink">
              시그니처
            </span>
          )}
          {item.name}
        </p>
        <p className="mt-1 text-[15px] text-muted">
          {BASE_SPIRIT_LABEL[item.base]}
          {item.desc && ` · ${item.desc}`}
        </p>
      </div>
      {/*
        값은 오른쪽 끝에 고정폭 숫자로. 108개가 쌓이는 화면이라
        자릿수가 흔들리면 세로로 훑으며 비교할 수가 없다.
        시그니처만 금색 — 전부 금색이면 강조가 아니라 배경이 된다.
      */}
      <p
        className={[
          'ml-auto shrink-0 text-[16px] font-bold tabular-nums',
          item.isSignature ? 'text-accent' : 'text-text/90',
        ].join(' ')}
      >
        {formatPrice(item.price)}
      </p>
    </li>
  )
}

function ActionBar({ bar }: { bar: Bar }) {
  // 카카오맵 길찾기 딥링크. 가게 이름에 쉼표나 공백이 있어도 깨지지 않게 인코딩한다.
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(bar.name)},${bar.lat},${bar.lng}`

  /*
    네이버 지도 길찾기.

    좌표 순서가 카카오와 반대다. 카카오는 lat,lng인데 네이버는 lng,lat로 받는다.
    뒤집어 넣으면 엉뚱한 곳을 찍고도 주소가 멀쩡해 보여서 알아채기 어렵다.

    앞의 '-'는 출발지를 비워 현재 위치를 쓰게 하는 자리다.

    네이버는 카카오의 link API 같은 공식 링크 규격을 내놓지 않았다. 이 주소는
    문서화된 것이 아니라 실제 지도 페이지가 쓰는 형식이라, 네이버가 구조를 바꾸면
    예고 없이 깨질 수 있다. 그래서 카카오 버튼을 남겨뒀다.
  */
  const naverUrl = `https://map.naver.com/p/directions/-/${bar.lng},${bar.lat},${encodeURIComponent(bar.name)}/-/transit`

  return (
    <div className="fixed bottom-0 z-30 w-full max-w-[480px] border-t border-line bg-surface/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
      {/* whitespace-nowrap: 줄바꿈이 생기면 바가 두꺼워져 본문 아래가 가린다. */}
      <div className="flex gap-2">
        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 flex-1 items-center justify-center gap-[7px] rounded-[14px] bg-accent text-[16px] font-bold whitespace-nowrap text-accent-ink active:opacity-80"
        >
          <PinIcon />
          카카오맵 길찾기
        </a>
        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 flex-1 items-center justify-center gap-[7px] rounded-[14px] border border-line bg-surface-2/60 text-[16px] font-semibold whitespace-nowrap text-text active:bg-surface-2"
        >
          <PinIcon />
          네이버 길찾기
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

/* 아이콘은 전부 선으로 그린 SVG다. 이모지는 기기마다 모양이 달라 쓰지 않는다. */

function QuoteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-[13px] w-[13px]">
      <path d="M9.5 5.5C6.4 6.9 4.5 9.6 4.5 12.8v5.7h6.4v-6.4H7.7c0-1.9 1-3.4 2.9-4.3zm9.9 0c-3.1 1.4-5 4.1-5 7.3v5.7h6.4v-6.4h-3.2c0-1.9 1-3.4 2.9-4.3z" />
    </svg>
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

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[17px] w-[17px]"
    >
      <path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
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
