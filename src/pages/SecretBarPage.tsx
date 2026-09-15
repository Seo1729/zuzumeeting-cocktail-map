import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BASE_SPIRIT_LABEL, type Bar } from '../domain/schema'
import {
  SECRET_COUPON,
  SECRET_INSTAGRAM,
  SECRET_INTRO,
  SECRET_SIGNATURES,
  checkSecret,
  type SecretSignature,
} from '../domain/secret'
import { useSecretUnlock } from './useSecretUnlock'

/*
  '더 작은 바'의 상세 화면. 잠겨 있으면 잠금 화면, 풀었으면 전용 화면.

  평범한 바 상세(주소·영업시간·길찾기)를 대신 차지한다. 홈바는 걸어 들어가는 곳이
  아니라 연락해서 가는 곳이라, 길찾기 버튼이 있으면 안내가 아니라 오해가 된다.
*/
export default function SecretBarPage({ bar }: { bar: Bar }) {
  const { unlockedAt, unlock } = useSecretUnlock()

  return (
    <article className="pb-[calc(40px+env(safe-area-inset-bottom))]">
      <TopBar />
      {unlockedAt === null ? (
        <LockScreen name={bar.name} onUnlock={unlock} />
      ) : (
        <Reward name={bar.name} unlockedAt={unlockedAt} />
      )}
    </article>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  // BarDetailPage와 같은 처리. 링크로 바로 들어오면 뒤로가기가 앱 밖으로 나간다.
  const goBack = () => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }

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

/* ---------- 잠금 화면 ---------- */

/*
  잠겨 있다는 것이 "고장"이 아니라 "의도"로 읽혀야 한다.
  자물쇠 그림과 잠겨 있다는 문장이 그 역할을 한다.

  비밀번호가 무엇인지는 화면에서 일절 알려주지 않는다 — 그건 카톡방에서 직접 흘린다.
  그래서 placeholder도 '비밀번호'까지만 쓴다. '홈바 아이디'라고 적으면 그 자체가 답의
  절반이라, 안내 문장만 지우고 이걸 남겨두면 지운 의미가 없다. 오류 문구도 마찬가지다.

  화면에 남는 단서는 인스타 프로필 링크 하나뿐이다.
*/
function LockScreen({ name, onUnlock }: { name: string; onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (checkSecret(input)) onUnlock()
    else setWrong(true)
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-line bg-surface text-accent">
          <LockIcon />
        </span>
        <h1 className="mt-4 text-[27px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          {name}
        </h1>
        <p className="mt-2 text-[16px] text-muted">아직 잠겨 있습니다.</p>
      </div>

      <section className="mt-7 rounded-[18px] border border-line bg-surface px-4 pt-4 pb-[18px]">
        <form onSubmit={submit}>
          {/*
            화면에 라벨을 두지 않고 aria-label로 이름을 준다 — SearchInput과 같은 규칙이다.

            type="password"라 글자가 가려진다. 가려서 지킬 비밀이 있어서가 아니라
            (옆에서 볼 사람도 없고, 애초에 정적 웹앱이라 지킬 수 있는 것도 아니다)
            점으로 찍혀야 '비밀번호를 치는 중'이라는 느낌이 나기 때문이다.

            대신 대가가 있다. 밑줄이 제자리에 들어갔는지 눈으로 확인할 수 없어서,
            틀렸을 때 어디가 틀렸는지 알 방법이 없다. 그래서 오타가 나기 쉬운 것들
            (대소문자, 공백, @)은 정규화에서 조용히 흘려보낸다.
            autoComplete="off" — 비밀번호 저장 팝업이 뜰 자리가 아니다.
          */}
          <input
            type="password"
            aria-label="비밀번호"
            enterKeyHint="go"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setWrong(false)
            }}
            placeholder="비밀번호"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={wrong}
            aria-describedby={wrong ? 'secret-error' : undefined}
            className={[
              'h-13 w-full rounded-[14px] border bg-ink px-4 text-[16px] text-text outline-none placeholder:text-muted/70',
              wrong ? 'border-accent' : 'border-line focus:border-muted',
            ].join(' ')}
          />

          {/* role=alert: 스크린리더가 틀렸다는 사실을 바로 읽어준다. */}
          {wrong && (
            <p id="secret-error" role="alert" className="mt-2.5 text-[15px] text-accent">
              비밀번호가 맞지 않습니다.
            </p>
          )}

          <button
            type="submit"
            className="mt-3.5 h-13 w-full rounded-[14px] bg-accent text-[16px] font-bold text-accent-ink active:opacity-80"
          >
            열기
          </button>
        </form>
      </section>

      <a
        href={SECRET_INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-13 items-center justify-center gap-2 rounded-[14px] border border-line bg-surface-2/60 text-[16px] font-semibold text-text active:bg-surface-2"
      >
        인스타 프로필 열기
        <ArrowOutIcon />
      </a>
    </div>
  )
}

/* ---------- 전용 화면 ---------- */

function Reward({ name, unlockedAt }: { name: string; unlockedAt: string }) {
  return (
    <div className="px-4 pt-1">
      <header>
        <div className="flex items-center gap-[7px]">
          <span className="text-accent">
            <UnlockedIcon />
          </span>
          <p className="text-[15px] font-semibold tracking-[0.06em] text-accent">잠금 해제</p>
        </div>
        <h1 className="mt-[7px] text-[30px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          {name}
        </h1>
      </header>

      {/* 소개 문구는 리스트의 '운영진 한 줄 평'과 같은 문법으로 둔다. */}
      <section className="mt-4 rounded-[18px] border border-accent/30 bg-gradient-to-b from-accent/12 to-accent/5 px-4 pt-[15px] pb-4">
        <p className="text-[19px] leading-[1.5] font-semibold tracking-[-0.015em] text-text">
          {SECRET_INTRO}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-[18px] font-bold">시그니처</h2>
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {SECRET_SIGNATURES.map((signature) => (
            <li key={signature.name}>
              <SignatureCard signature={signature} />
            </li>
          ))}
        </ul>
      </section>

      <CouponSection />

      {/*
        해제 시각. 캡쳐가 그냥 화면이 아니라 티켓처럼 보이게 하는 장치다.
        판정 근거는 아니다 — 순서는 카톡이 도착한 시각으로 정해진다.
      */}
      <p className="pt-7 text-center text-[15px] text-muted tabular-nums">
        {formatUnlockedAt(unlockedAt)} 해제
      </p>
    </div>
  )
}

function SignatureCard({ signature }: { signature: SecretSignature }) {
  // 도수는 재본 것만 적는다. 없는 값을 지어내면 다음에 누가 그걸 사실로 옮긴다.
  const meta = [BASE_SPIRIT_LABEL[signature.base], signature.abv].filter(
    (part): part is string => part !== null,
  )

  return (
    <div className="rounded-[18px] border border-line bg-surface px-4 pt-[15px] pb-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-bold text-text">{signature.name}</h3>
        <span className="shrink-0 text-[15px] text-muted tabular-nums">{meta.join(' · ')}</span>
      </div>
      {signature.ingredients && (
        <p className="mt-1.5 text-[15px] leading-relaxed text-text/80">{signature.ingredients}</p>
      )}
      {signature.note && (
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{signature.note}</p>
      )}
    </div>
  )
}

/*
  쿠폰.

  초록(discount)을 쓴다. 이 앱에서 초록은 이미 "돈이 걸린 정보"라는 뜻으로
  제휴 할인에 쓰고 있어서, 설명 없이 같은 뜻으로 읽힌다.
  금색(accent)은 시그니처 배지와 한 줄 평이 이미 쓰고 있어 여기 또 쓰면 묻힌다.
*/
function CouponSection() {
  return (
    <section className="mt-6 rounded-[18px] border border-discount/40 bg-discount/10 px-4 pt-4 pb-[18px]">
      <div className="flex items-center gap-1.5">
        <span className="text-discount">
          <TicketIcon />
        </span>
        <p className="text-[15px] font-bold tracking-[0.03em] text-discount">쿠폰</p>
      </div>

      <p className="mt-2.5 text-[15px] leading-relaxed text-text/85">
        이 화면을 캡쳐해서 카톡으로 보내주세요. 아래 둘 중 하나를 고르시면 됩니다.
      </p>

      {/*
        가로로 반씩 나누지 않고 세로로 쌓는다. 두 이용권의 글자 수가 크게 달라서
        같은 너비에 넣으면 긴 쪽만 두세 줄로 접히고 짧은 쪽은 텅 비어, 둘이 대등한
        선택지로 보이지 않는다.
      */}
      <ul className="mt-3 flex flex-col gap-2">
        {SECRET_COUPON.choices.map((choice) => (
          <li
            key={choice}
            className="rounded-xl border border-discount/30 bg-ink/40 px-3.5 py-3 text-[16px] font-bold text-text"
          >
            {choice}
          </li>
        ))}
      </ul>

      <a
        href={SECRET_INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-13 items-center justify-center gap-2 rounded-[14px] border border-line bg-surface-2/60 text-[16px] font-semibold text-text active:bg-surface-2"
      >
        인스타 프로필 열기
        <ArrowOutIcon />
      </a>
    </section>
  )
}

/*
  해제 시각 표기.

  toLocaleString을 쓰지 않는다. 기기 언어 설정에 따라 "9/15/2026, 11:04 PM"처럼
  나와서, 같은 화면을 캡쳐해도 사람마다 다른 모양이 된다.
*/
function formatUnlockedAt(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${at.getFullYear()}.${pad(at.getMonth() + 1)}.${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`
}

/* ---------- 아이콘 ---------- */
/* 이 앱의 다른 화면과 같은 규칙 — 선으로 그린 SVG만 쓰고 이모지는 쓰지 않는다. */

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.4" />
      <path d="M7.8 10.5V7.2a4.2 4.2 0 0 1 8.4 0v3.3" />
    </svg>
  )
}

/* 고리가 열린 자물쇠. 잠금 화면의 아이콘과 짝이 되어 "풀렸다"가 그림으로 읽힌다. */
function UnlockedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.4" />
      <path d="M7.8 10.5V7.2a4.2 4.2 0 0 1 8.2-1.3" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <path d="M3 9.2V6.5h18v2.7a2.8 2.8 0 0 0 0 5.6v2.7H3v-2.7a2.8 2.8 0 0 0 0-5.6z" />
      <path d="M14 6.5v11" strokeDasharray="2 2.4" />
    </svg>
  )
}

function ArrowOutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14.5V20H4V6h5.5" />
    </svg>
  )
}
