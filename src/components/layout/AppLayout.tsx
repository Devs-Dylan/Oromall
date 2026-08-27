import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { NewsTickerBanner } from './NewsTickerBanner'
import { Toaster } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <NewsTickerBanner />
      <Footer />
      <Toaster />
    </div>
  )
}
