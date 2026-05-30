import type { ReactNode } from 'react'

/**
 * DifferentialsSection — diferenciais institucionais (Wave 6).
 * Linguagem industrial: blocos robustos, engenharia e fabricação própria.
 */

type Differential = {
  icon: ReactNode
  title: string
  description: string
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  width: 26,
  height: 26,
  'aria-hidden': true,
}

const DIFFERENTIALS: Differential[] = [
  {
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V9l8-5 8 5v11" />
        <path d="M9 20v-6h6v6" />
        <path d="M3 20h18" />
      </svg>
    ),
    title: 'Fabricação própria',
    description:
      'Toda a produção é feita internamente, do projeto à instalação. Sem terceirização, sem perda de controle sobre o padrão de qualidade.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="16" rx="0.5" />
        <path d="M4 9h16M9 4v16" strokeOpacity="0.4" />
        <path d="M12 12l4 4" />
      </svg>
    ),
    title: 'Engenharia estrutural',
    description:
      'Estruturas metálicas dimensionadas para suportar carga real, vento e uso intenso, com cálculo técnico e materiais certificados.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Durabilidade comprovada',
    description:
      'Tratamento anticorrosivo, solda de precisão e acabamento industrial garantem vida útil prolongada em qualquer ambiente.',
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v6l9 4 9-4V7" strokeOpacity="0.5" />
        <path d="M12 11v6" />
      </svg>
    ),
    title: 'Acabamento premium',
    description:
      'Cada detalhe é tratado com rigor: alinhamento, fixação e estética pensados para um resultado robusto e impecável.',
  },
]

export function DifferentialsSection() {
  return (
    <section
      id="diferenciais"
      className="mp-section mp-section--frame mp-section--surface"
      aria-labelledby="differentials-heading"
    >
      <div className="mp-blueprint" aria-hidden="true" />
      <div className="mp-container">
        <header className="mp-inst-header mp-inst-header--split">
          <div>
            <span className="mp-kicker">Por que a Colibri</span>
            <h2
              id="differentials-heading"
              className="mp-inst-header__title"
              style={{ marginTop: '1rem' }}
            >
              Robustez de quem fabrica
            </h2>
          </div>
          <p className="mp-inst-header__lead">
            Não somos uma revenda. Somos indústria — e isso aparece na engenharia, no acabamento e
            na vida útil de cada estrutura que entregamos.
          </p>
        </header>

        <div className="mp-feature-grid">
          {DIFFERENTIALS.map((item) => (
            <article key={item.title} className="mp-feature">
              <span className="mp-feature__icon">{item.icon}</span>
              <div>
                <h3 className="mp-feature__title">{item.title}</h3>
                <p className="mp-feature__desc">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
