import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ProductDetailSkeleton } from '@/components/public/ProductDetailSkeleton'

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-black selection:text-white">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-[1760px] w-full px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-12 sm:pb-16">
        <ProductDetailSkeleton />
      </main>

      <PublicFooter />
    </div>
  )
}
