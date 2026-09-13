import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/*
  모바일 우선 레이아웃.
  데스크톱에서는 가운데 정렬된 max-width 480px 컬럼으로만 보인다.
*/
export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  // 상세 화면은 하단에 자체 액션 버튼이 붙으므로 탭바를 숨긴다.
  const showTabBar = !pathname.startsWith('/bar/')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-ink">
      <main className={showTabBar ? 'flex-1 pb-[var(--tabbar-h)]' : 'flex-1'}>{children}</main>
      {showTabBar && <TabBar />}
    </div>
  )
}

function TabBar() {
  return (
    <nav className="fixed bottom-0 z-30 w-full max-w-[480px] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-2">
        <TabLink to="/" label="리스트" icon={<ListIcon />} />
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
