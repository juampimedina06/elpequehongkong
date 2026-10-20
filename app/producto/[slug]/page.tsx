import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActiveProductBySlugWithRelations } from '@/services/products.repository'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { ProductDetailView } from '@/components/public/ProductDetailView'
import { formatCurrency } from '@/utils/formatters'

export const revalidate = 60

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getActiveProductBySlugWithRelations(slug)

  if (!product) {
    return {
      title: 'Producto no encontrado',
      description: 'El producto que buscas no existe o ya no está disponible.',
    }
  }

  const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0]
  const cleanDescription = product.description
    ? product.description.slice(0, 160)
    : `Comprá ${product.name} por ${formatCurrency(product.base_price)} en El Peque Hong Kong.`

  return {
    title: product.name,
    description: cleanDescription,
    openGraph: {
      title: `${product.name} | El Peque Hong Kong`,
      description: cleanDescription,
      type: 'website',
      images: primaryImage
        ? [
            {
              url: primaryImage.url,
              alt: product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | El Peque Hong Kong`,
      description: cleanDescription,
      images: primaryImage ? [primaryImage.url] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getActiveProductBySlugWithRelations(slug)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailView product={product} />
      </main>

      <PublicFooter />
    </div>
  )
}
