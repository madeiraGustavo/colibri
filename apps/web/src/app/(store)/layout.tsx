import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader'
import { MarketplaceFooter } from '@/components/marketplace/MarketplaceFooter'
import { ToastContainer } from '@/components/marketplace/Toast'
import { WhatsAppCTA } from '@/components/marketplace/WhatsAppCTA'
import './store.css'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketplace min-h-screen flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
      <MarketplaceFooter />
      <WhatsAppCTA />
      <ToastContainer />
    </div>
  )
}
