/**
 * ProcessSection — processo de trabalho industrial (Wave 6).
 * Etapas numeradas, linguagem de fabricação e engenharia.
 */

type Step = {
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    title: 'Projeto & medição',
    description:
      'Visita técnica, levantamento das medidas e definição da solução estrutural ideal para o local.',
  },
  {
    title: 'Engenharia & orçamento',
    description:
      'Dimensionamento estrutural, escolha de materiais e proposta detalhada, sem surpresas.',
  },
  {
    title: 'Fabricação própria',
    description:
      'Corte, solda e montagem em nossa estrutura, com controle de qualidade em cada etapa.',
  },
  {
    title: 'Instalação & entrega',
    description:
      'Equipe própria realiza a instalação com acabamento industrial e validação final em obra.',
  },
]

export function ProcessSection() {
  return (
    <section
      id="processo"
      className="mp-section mp-section--frame"
      aria-labelledby="process-heading"
    >
      <div className="mp-blueprint" aria-hidden="true" />
      <div className="mp-container">
        <header className="mp-inst-header mp-inst-header--split">
          <div>
            <span className="mp-kicker">Como trabalhamos</span>
            <h2 id="process-heading" className="mp-inst-header__title" style={{ marginTop: '1rem' }}>
              Do projeto à obra entregue
            </h2>
          </div>
          <p className="mp-inst-header__lead">
            Um processo controlado de ponta a ponta, conduzido por equipe própria — previsível,
            técnico e sem intermediários.
          </p>
        </header>

        <ol className="mp-process mp-process--4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="mp-process-step">
              <span className="mp-process-step__num">{String(index + 1).padStart(2, '0')}</span>
              <span className="mp-process-step__rule" aria-hidden="true" />
              <h3 className="mp-process-step__title">{step.title}</h3>
              <p className="mp-process-step__desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
