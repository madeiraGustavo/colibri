import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { OrcamentoForm } from './OrcamentoForm'

export const metadata: Metadata = {
  title: `Solicitar Orçamento | ${siteConfig.name}`,
  description: `Solicite um orçamento gratuito para toldos, coberturas, capotas e produtos de lona. ${siteConfig.name} — qualidade e proteção para seu espaço.`,
  openGraph: {
    title: `Solicitar Orçamento | ${siteConfig.name}`,
    description: `Solicite um orçamento gratuito para toldos, coberturas, capotas e produtos de lona.`,
    siteName: siteConfig.name,
    type: 'website',
  },
  alternates: {
    canonical: `https://${siteConfig.domain}/orcamento`,
  },
}

export default function OrcamentoPage() {
  return <OrcamentoForm />
}
