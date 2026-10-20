import { listAllBanners } from '@/services/banners.repository'
import { BannersManager } from '@/components/admin/BannersManager'

export const dynamic = 'force-dynamic'

export default async function AdminPortadaPage() {
  const banners = await listAllBanners()

  return (
    <div className="py-2">
      <BannersManager initialBanners={banners} />
    </div>
  )
}
