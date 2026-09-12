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
        <TabLink to="/" label="리스트" />
        <TabLink to="/map" label="지도" />
      </div>
    </nav>
  )
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          'py-4 text-center text-[15px] font-semibold transition-colors',
          isActive ? 'text-accent' : 'text-muted',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}
