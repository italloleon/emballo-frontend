import { type ReactNode, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { useAuthStore } from '@/store/auth'
import { getRouteTitle } from '@/lib/routeTitles'

interface PageShellProps {
  title: string
  showBack?: boolean
  children?: ReactNode
}

export function PageShell({ title, showBack = false, children }: PageShellProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const isStudent = user?.role === 'student'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const displayTitle = getRouteTitle(location.pathname, user?.role) || title

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  if (isStudent) {
    return (
      <div className="flex flex-col min-h-svh bg-bg-900">
        <Topbar title={displayTitle} showBack={showBack} />
        <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
          {children ?? <Outlet />}
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh bg-bg-900">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          title={displayTitle}
          showBack={showBack}
          showMenu
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
