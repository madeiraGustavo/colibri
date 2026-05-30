import {
  IconEstrutura,
  IconLona,
  IconMetalon,
  IconSolda,
  IconToldo,
} from '@/components/marketplace/icons/ColibriServiceIcons'

/**
 * TrustBadges — ícones de serviço do manual Colibri
 * (toldo, lona, estrutura, metalon, solda/aço).
 */

const services = [
  {
    icon: <IconToldo />,
    title: 'Toldos',
    description: 'Retráteis, fixos e articulados sob medida para comércio e residência',
  },
  {
    icon: <IconLona />,
    title: 'Lonas',
    description: 'Lonas técnicas e coberturas em PVC com acabamento industrial',
  },
  {
    icon: <IconEstrutura />,
    title: 'Estruturas',
    description: 'Coberturas, pergolados e estruturas para áreas comerciais',
  },
  {
    icon: <IconMetalon />,
    title: 'Metalon',
    description: 'Perfis e estruturas em metalon com corte e solda de precisão',
  },
  {
    icon: <IconSolda />,
    title: 'Aço & Solda',
    description: 'Serralheria e solda para projetos robustos e duráveis',
  },
] as const

export function TrustBadges() {
  return (
    <section
      id="categorias"
      className="mp-section mp-section--compact mp-section--frame"
      aria-labelledby="services-heading"
    >
      <div className="mp-blueprint" aria-hidden="true" />
      <div className="mp-container">
        <header className="mp-inst-header mp-inst-header--split">
          <div>
            <span className="mp-kicker">Capacidade de fabricação</span>
            <h2 id="services-heading" className="mp-inst-header__title" style={{ marginTop: '1rem' }}>
              O que fabricamos
            </h2>
          </div>
          <p className="mp-inst-header__lead">
            Produção própria em toldos, lonas técnicas e estruturas metálicas — do corte e solda ao
            acabamento final, com controle integral de qualidade.
          </p>
        </header>

        <div className="mp-spec-grid mp-spec-grid--5">
          {services.map((service, index) => (
            <div key={service.title} className="mp-spec-cell">
              <div className="mp-spec-cell__top">
                <span className="mp-spec-cell__icon">{service.icon}</span>
                <span className="mp-spec-cell__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mp-spec-cell__title">{service.title}</h3>
              <p className="mp-spec-cell__desc">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
