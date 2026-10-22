import { NextResponse } from 'next/server'
import {
  queryPublicCatalogPaginated,
  type PublicCatalogQueryParams,
} from '@/services/products.repository'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const params: PublicCatalogQueryParams = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      q: searchParams.get('q') ?? undefined,
      categoria: searchParams.get('categoria') ?? undefined,
      subcategoria: searchParams.get('subcategoria') ?? undefined,
      minPrice: searchParams.get('minPrice')
        ? Number(searchParams.get('minPrice'))
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? Number(searchParams.get('maxPrice'))
        : undefined,
      orden: searchParams.get('orden') ?? undefined,
      enStock: searchParams.get('enStock') === 'true',
    }

    const result = await queryPublicCatalogPaginated(params)

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in /api/catalog:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos del catálogo' },
      { status: 500 }
    )
  }
}
