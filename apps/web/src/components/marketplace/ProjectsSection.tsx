import Link from 'next/link'

type ProjectCardSize = 'hero' | 'wide' | 'tall' | 'standard'

type Project = {
  title: string
  description: string
  location: string
  segment: string
  year: string
  size: ProjectCardSize
}

const PROJECTS: Project[] = [
  {
    title: 'Estrutura Metálica Premium',
    description: 'Cobertura sob medida com acabamento industrial',
    location: 'Zona Sul — SP',
    segment: 'Engenharia',
    year: '2026',
    size: 'hero',
  },
  {
    title: 'Cobertura Comercial',
    description: 'Proteção e fluxo para acesso principal',
    location: 'Centro — SP',
    segment: 'Comercial',
    year: '2025',
    size: 'tall',
  },
  {
    title: 'Toldo Retrátil',
    description: 'Conforto térmico e estética arquitetônica',
    location: 'Pinheiros — SP',
    segment: 'Gastronomia',
    year: '2025',
    size: 'wide',
  },
  {
    title: 'Lona Industrial',
    description: 'Cobertura de área de carga e docas',
    location: 'Guarulhos — SP',
    segment: 'Logística',
    year: '2024',
    size: 'standard',
  },
  {
    title: 'Policarbonato Alveolar',
    description: 'Iluminação natural com controle de intempéries',
    location: 'ABC — SP',
    segment: 'Residencial',
    year: '2024',
    size: 'tall',
  },
  {
    title: 'Cobertura para Passarela',
    description: 'Vãos amplos e desenho limpo, corporativo',
    location: 'Vila Olímpia — SP',
    segment: 'Corporativo',
    year: '2023',
    size: 'standard',
  },
]

const GRADIENTS = [
  'linear-gradient(145deg, #111111 0%, #2B2B2B 50%, rgba(244,180,0,0.25) 100%)',
  'linear-gradient(145deg, #1a1a1a 0%, #333333 60%, rgba(244,180,0,0.15) 100%)',
  'linear-gradient(160deg, #2B2B2B 0%, #111111 70%, rgba(244,180,0,0.2) 100%)',
  'linear-gradient(135deg, #111111 20%, #2B2B2B 80%)',
]

function projectPlaceholderDataUri(gradient: string) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111111"/>
      <stop offset="0.55" stop-color="#2B2B2B"/>
      <stop offset="1" stop-color="#111111"/>
    </linearGradient>
    <linearGradient id="a" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(244,180,0,0.0)"/>
      <stop offset="1" stop-color="rgba(244,180,0,0.24)"/>
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1600" height="1200" fill="url(#g)"/>
  <rect width="1600" height="1200" fill="${gradient}"/>
  <rect width="1600" height="1200" fill="url(#grid)" opacity="0.55"/>
  <g opacity="0.9">
    <path d="M240 860 L760 380 L1360 980" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="10"/>
    <path d="M260 920 L820 360" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="6"/>
    <path d="M880 560 L1320 1000" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="6"/>
    <rect x="260" y="820" width="520" height="260" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
    <rect x="320" y="880" width="180" height="140" rx="10" fill="rgba(255,255,255,0.06)"/>
    <rect x="530" y="880" width="180" height="140" rx="10" fill="rgba(255,255,255,0.06)"/>
  </g>
  <rect width="1600" height="1200" fill="url(#a)"/>
</svg>
  `.trim()

  // Minimal encoding: keep it simple and stable for Next/React rendering.
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, '')
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/%2C/g, ',')
    .replace(/%3B/g, ';')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%23/g, '#')
    .replace(/%22/g, "'")

  return `data:image/svg+xml,${encoded}`
}

function ProjectMedia({
  gradient,
  title,
  priority,
}: {
  gradient: string
  title: string
  priority?: boolean
}) {
  // width/height prevent CLS; object-fit gives "cinematic" crop feel.
  return (
    <div className="mp-project-media">
      <img
        src={projectPlaceholderDataUri(gradient)}
        alt={`Projeto — ${title}`}
        width={1600}
        height={1200}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="mp-project-media-img"
      />
      <div className="mp-project-media-glow" aria-hidden="true" />
      <div className="mp-project-media-overlay" aria-hidden="true" />
    </div>
  )
}

export function ProjectsSection() {
  return (
    <section className="mp-section">
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--mp-content-padding)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2 className="mp-heading-2" style={{ marginBottom: '8px' }}>
              Nossos Projetos
            </h2>
            <p
              style={{
                fontFamily: 'var(--mp-font-body)',
                fontSize: '1rem',
                color: 'var(--mp-text-secondary)',
                margin: 0,
              }}
            >
              Conheça alguns dos projetos que realizamos para nossos clientes
            </p>
          </div>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--mp-font-body)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: 'var(--mp-text-accent)',
              textDecoration: 'none',
              transition: 'opacity 200ms ease',
            }}
          >
            Ver Todos →
          </Link>
        </div>

        {/* Projects Showcase (Wave 5) */}
        <div className="mp-projects-showcase" aria-label="Showcase de projetos">
          {PROJECTS.map((project, index) => {
            const gradient = GRADIENTS[index % GRADIENTS.length] ?? GRADIENTS[0]!
            return (
              <article
                key={`${project.title}-${project.location}`}
                className="mp-project-card"
                data-size={project.size}
              >
                <ProjectMedia
                  gradient={gradient}
                  title={project.title}
                  priority={index === 0}
                />

                <div className="mp-project-overlay">
                  <div className="mp-project-meta-top">
                    <span className="mp-project-chip">{project.segment}</span>
                    <span className="mp-project-dot" aria-hidden="true" />
                    <span className="mp-project-subtle">{project.year}</span>
                  </div>

                  <div className="mp-project-meta-bottom">
                    <h3 className="mp-project-title">{project.title}</h3>
                    <p className="mp-project-desc">{project.description}</p>
                    <div className="mp-project-footer">
                      <span className="mp-project-location">{project.location}</span>
                      <span className="mp-project-cta" aria-hidden="true">
                        Ver projeto →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
