import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/*
  모바일 우선 레이아웃.
  데스크톱에서는 가운데 정렬된 max-width 480px 컬럼으로만 보인다.
*/
export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  /*
    상세 화면에서는 탭바를 숨긴다.

    바 상세는 하단에 '길찾기' 버튼이 고정으로 붙어 자리가 겹친다.
    칵테일 상세는 버튼이 없지만 같이 숨긴다 — 둘 다 목록에서 하나를 골라 들어간
    화면이라, 탭이 보이면 어디까지가 '지금 보던 목록'인지 흐려진다.
    돌아가는 길은 각 화면 위쪽의 ← 버튼이다.
  */
  const showTabBar = !pathname.startsWith('/bar/') && !isMenuDetail(pathname)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-ink">
      <main className={showTabBar ? 'flex-1 pb-[var(--tabbar-h)]' : 'flex-1'}>{children}</main>
      {showTabBar && <TabBar />}
    </div>
  )
}

/*
  '/menu'는 목록이라 탭바를 두고, '/menu/무엇'은 상세라 숨긴다.
  startsWith('/menu/')로 구분한다 — 뒤에 슬래시가 붙어야만 상세다.
*/
function isMenuDetail(pathname: string): boolean {
  return pathname.startsWith('/menu/')
}

function TabBar() {
  return (
    <nav className="fixed bottom-0 z-30 w-full max-w-[480px] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {/*
        칵테일 탭을 가운데 둔다. 리스트("어디 갈까")와 지도가 둘 다 장소를 다루는 화면이고
        칵테일은 "뭘 시킬까"라 성격이 다른데, 끝에 붙이면 곁다리로 보인다.
      */}
      <div className="grid grid-cols-3">
        <TabLink to="/" label="리스트" icon={<ListIcon />} />
        <TabLink to="/menu" label="칵테일" icon={<GlassIcon />} />
        <TabLink to="/map" label="지도" icon={<MapIcon />} />
      </div>
    </nav>
  )
}

/*
  아이콘과 글자를 같이 둔다. 글자만 있을 때는 두 칸이 똑같이 생겨서
  어느 쪽에 있는지 색 하나로만 구분해야 했다.
  고른 쪽은 위쪽 막대로도 표시한다 — 색만으로 상태를 전하지 않기 위해서다.
*/
function TabLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          'relative flex flex-col items-center justify-center gap-1 py-3 text-[15px] transition-colors',
          isActive ? 'font-bold text-accent' : 'font-semibold text-muted',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute top-0 h-[2px] w-[30px] rounded-b-sm bg-accent"
            />
          )}
          {icon}
          {label}
        </>
      )}
    </NavLink>
  )
}

function ListIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-[21px] w-[21px]"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

/* 마티니 잔. 앱 아이콘과 같은 모양이라 설명 없이 읽힌다. */
function GlassIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[21px] w-[21px]"
    >
      <path d="M4 5h16l-8 8z" />
      <path d="M12 13v6M8.5 19h7" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[21px] w-[21px]"
    >
      <path d="M9 3.5L3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6z" />
      <path d="M9 3.5V18M15 6v14.5" />
    </svg>
  )
}
