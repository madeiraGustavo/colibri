import type { Metadata } from 'next'
import { Suspense } from 'react'
import { fetchProducts, fetchCategories } from '@/lib/marketplace/api'
import { siteConfig } from '@/config/site'
import { Breadcrumb } from '@/components/marketplace/Breadcrumb'
import { SkeletonCard } from '@/components/marketplace/SkeletonCard'
import { CatalogSection } from '../CatalogSection'

export const metadata: Metadata = {
  title: `Produtos | ${siteConfig.name}`,
  description: `Catálogo completo de toldos, coberturas, capotas e produtos de lona — ${siteConfig.name}.`,
}

export default async function ProdutosPage() {
  const [productsRes, categories] = await Promise.all([
    fetchProducts({ pageSize: 24 }),
    fetchCategories(),
  ])

  return (
    <div className="mp-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Início', href: '/' }, { label: 'Produtos' }]} />
        <div className="mb-10">
          <h1 className="mp-heading-2">Produtos</h1>
          <p style={{ color: 'var(--mp-text-secondary)', marginTop: '8px', fontSize: '1.125rem' }}>
            Catálogo completo — encontre o produto ideal para seu projeto
          </p>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <CatalogSection initialProducts={productsRes.data} categories={categories} />
        </Suspense>
      </div>
    </div>
  )
}
