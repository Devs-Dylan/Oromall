import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { NewsTickerBanner } from './NewsTickerBanner'
import { MobileBottomNav } from './MobileBottomNav'
import { Toaster } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <NewsTickerBanner />
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </div>
  )
}
