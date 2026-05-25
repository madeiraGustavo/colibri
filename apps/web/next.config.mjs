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
      // Legacy wave-3 paths → canonical (store root)
      { source: '/categoria/:slug', destination: '/produtos/categoria/:slug', permanent: true },
      { source: '/category/:slug', destination: '/produtos/categoria/:slug', permanent: true },
      { source: '/register', destination: '/registro', permanent: true },
      // Wave 5: legacy dashboard admin UI → /admin
      { source: '/dashboard/marketplace', destination: '/admin', permanent: false },
      { source: '/dashboard/marketplace/:path*', destination: '/admin/:path*', permanent: false },
    ]
  },
}

export default nextConfig
