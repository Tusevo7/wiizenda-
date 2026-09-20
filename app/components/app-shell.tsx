import AppHeader from './app-header'
import BottomNav from './bottom-nav'

type AppShellProps = {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <AppHeader />

      <main className="pb-24 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}