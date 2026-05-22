/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      // ── Temporary /marketplace → root redirects (Wave 4, removed in Wave 9) ──
      { source: '/marketplace', destination: '/', permanent: true },
      { source: '/marketplace/product/:slug', destination: '/produtos/:slug', permanent: true },
      { source: '/marketplace/category/:slug', destination: '/produtos/categoria/:slug', permanent: true },
      { source: '/marketplace/produtos', destination: '/produtos', permanent: true },
      { source: '/marketplace/produtos/:slug', destination: '/produtos/:slug', permanent: true },
      { source: '/marketplace/cart', destination: '/carrinho', permanent: true },
      { source: '/marketplace/checkout', destination: '/checkout', permanent: true },
      { source: '/marketplace/minha-conta', destination: '/minha-conta', permanent: true },
      { source: '/marketplace/login', destination: '/login', permanent: true },
      { source: '/marketplace/register', destination: '/registro', permanent: true },
      { source: '/marketplace/orcamento', destination: '/orcamento', permanent: true },
      // Legacy wave-3 paths → canonical
      { source: '/categoria/:slug', destination: '/produtos/categoria/:slug', permanent: true },
      { source: '/category/:slug', destination: '/produtos/categoria/:slug', permanent: true },
      { source: '/register', destination: '/registro', permanent: true },
    ]
  },
}

export default nextConfig
