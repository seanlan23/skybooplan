import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FlightSearchBar from '@/components/search/FlightSearchBar'
import { PlanHotelsSection } from '@/components/layout/PlanHotelsSection'
import TransportChat from '@/components/TransportChat'
import { FlightsPlanGridGate } from '@/components/layout/FlightsPlanGridGate'
import { SearchContentOverlay } from '@/components/layout/SearchContentOverlay'
import { FlightSearchLoadingOverlay } from '@/components/search/FlightSearchLoadingOverlay'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Header />

      <section className="relative shrink-0 bg-white border-b border-slate-100">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(7,112,227,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <FlightSearchBar />
        </div>
      </section>

      <SearchContentOverlay>
        <FlightsPlanGridGate />
        <PlanHotelsSection />
      </SearchContentOverlay>

      <Footer />
      <TransportChat />
      <FlightSearchLoadingOverlay />
    </main>
  )
}
