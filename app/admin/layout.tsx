import type { Metadata } from 'next'
import { getCurrentAdminUser } from '@/actions/auth/get-user'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const metadata: Metadata = {
  title: {
    default: 'Panel de Control | El Peque Hong Kong',
    template: '%s | Admin — El Peque Hong Kong',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminUser = await getCurrentAdminUser()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9fa] text-zinc-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader adminEmail={adminUser?.email} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
