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
    size: 'standard',
  },
  {
    title: 'Cobertura para Passarela',
    description: 'Vãos amplos e desenho limpo, corporativo',
    location: 'Vila Olímpia — SP',
    segment: 'Corporativo',
    year: '2023',
    size: 'tall',
  },
]

const GRADIENTS = [
  'linear-gradient(145deg, #111111 0%, #2B2B2B 50%, rgba(244,180,0,0.25) 100%)',
  'linear-gradient(145deg, #1a1a1a 0%, #333333 60%, rgba(244,180,0,0.15) 100%)',
  'linear-gradient(160deg, #2B2B2B 0%, #111111 70%, rgba(244,180,0,0.2) 100%)',
  'linear-gradient(135deg, #111111 20%, #2B2B2B 80%)',
]

function ProjectMedia({
  gradient,
  title,
}: {
  gradient: string
  title: string
}) {
  return (
    <div
      className="mp-project-media"
      style={{ backgroundImage: gradient }}
      role="img"
      aria-label={`Projeto — ${title}`}
    >
      <div className="mp-project-media-glow" aria-hidden="true" />
      <div className="mp-project-media-overlay" aria-hidden="true" />
    </div>
  )
}

export function ProjectsSection() {
  return (
    <section className="mp-section">
      <div className="mp-container mp-container-wide">
        {/* Header */}
        <div className="mp-section-header flex items-center justify-between flex-wrap gap-4">
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
              <Link
                key={`${project.title}-${project.location}`}
                className="mp-project-card"
                data-size={project.size}
                href="/orcamento"
                aria-label={`Solicitar orçamento — ${project.title}`}
              >
                <ProjectMedia gradient={gradient} title={project.title} />

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
                        Solicitar orçamento →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
