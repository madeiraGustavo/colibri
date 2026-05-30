import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchProducts, fetchCategories } from '@/lib/marketplace/api'
import { generateHomeMetadata } from '@/lib/marketplace/metadata'
import { siteConfig } from '@/config/site'
import { HeroSection } from '@/components/marketplace/HeroSection'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { SocialProofSection } from '@/components/marketplace/SocialProofSection'
import { ProjectsSection } from '@/components/marketplace/ProjectsSection'
import { TrustBadges } from '@/components/marketplace/TrustBadges'
import { DifferentialsSection } from '@/components/marketplace/DifferentialsSection'
import { ProcessSection } from '@/components/marketplace/ProcessSection'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { SkeletonCard } from '@/components/marketplace/SkeletonCard'
import { LocalBusinessJsonLd, BreadcrumbJsonLd } from '@/components/marketplace/JsonLd'
import { CatalogSection } from './CatalogSection'

export function generateMetadata(): Metadata {
  return generateHomeMetadata()
}

export default async function HomePage() {
  const [productsRes, categories] = await Promise.all([
    fetchProducts({ pageSize: 12 }),
    fetchCategories(),
  ])

  const products = productsRes.data

  return (
    <>
      {/* Structured Data */}
      <LocalBusinessJsonLd
        name={siteConfig.name}
        address={siteConfig.contacts.address}
        telephone={siteConfig.contacts.phone}
        openingHours={['Mo-Fr 08:00-18:00', 'Sa 08:00-12:00']}
      />
      <BreadcrumbJsonLd
        items={[
          { name: siteConfig.name, url: `https://${siteConfig.domain}/` },
        ]}
      />

      {/* Hero Section */}
      <HeroSection
        title="Toldos & Coberturas Sob Medida"
        subtitle="Fabricação e instalação de toldos, coberturas de policarbonato, lonas e estruturas metálicas. Qualidade industrial com atendimento personalizado."
        ctaPrimary={{ label: 'Ver Catálogo', href: '#catalogo' }}
        ctaSecondary={{ label: 'Solicitar Orçamento', href: '#orcamento' }}
        socialProof={{ count: 500, label: 'projetos entregues' }}
        categories={categories}
      />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Catalog Section (Client Component for search/filter interactivity) */}
      <section id="catalogo" className="mp-section">
        <div className="mp-container">
          <div className="mp-section-header">
            <h2 className="mp-heading-2">Nossos Produtos</h2>
            <p style={{ color: 'var(--mp-text-secondary)', marginTop: '12px', fontSize: '1.125rem' }}>
              Encontre o produto certo para o seu próximo projeto
            </p>
          </div>

          <Suspense fallback={<CatalogSkeleton />}>
            <CatalogSection
              initialProducts={products}
              categories={categories}
            />
          </Suspense>
        </div>
      </section>

      {/* Diferenciais (Wave 6) */}
      <DifferentialsSection />

      {/* Processo de trabalho (Wave 6) */}
      <ProcessSection />

      {/* Sobre a empresa */}
      <SocialProofSection />

      {/* Projects */}
      <ProjectsSection />
    </>
  )
}

function CatalogSkeleton() {
  return (
    <div className="mp-grid-catalog">
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
