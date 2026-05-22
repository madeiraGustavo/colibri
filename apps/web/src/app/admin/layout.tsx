import { AdminGuard } from '@/components/admin/AdminGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AdminGuard>{children}</AdminGuard>
      </div>
    </div>
  )
}
