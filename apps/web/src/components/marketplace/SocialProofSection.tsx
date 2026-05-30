'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Static Data ─── */

const METRICS = [
  { value: 300, suffix: '+', label: 'Projetos Entregues' },
  { value: 500, suffix: '+', label: 'Clientes Atendidos' },
  { value: 10, suffix: '+', label: 'Anos de Experiência' },
  { value: 100, suffix: '%', label: 'Fabricação Própria' },
]

const CAPABILITIES = [
  'Projeto e engenharia',
  'Corte e solda de precisão',
  'Instalação especializada',
  'Garantia de acabamento',
]

const TESTIMONIALS = [
  {
    rating: 5,
    text: 'Excelente qualidade nos toldos e coberturas. Atendimento profissional do início ao fim. Recomendo para qualquer projeto comercial ou residencial.',
    author: 'Carlos Mendes',
    role: 'Proprietário, Restaurante Vila Nova',
  },
]

/* ─── Count-Up Hook ─── */

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!trigger) return

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReduced) {
      setValue(target)
      return
    }

    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, trigger])

  return value
}

/* ─── Stat Plate ─── */

function StatPlate({
  value,
  suffix,
  label,
  inView,
  accent,
}: {
  value: number
  suffix: string
  label: string
  inView: boolean
  accent?: boolean
}) {
  const displayValue = useCountUp(value, 1500, inView)

  return (
    <div className={`mp-stat-plate${accent ? ' mp-stat-plate--accent' : ''}`}>
      <span className="mp-stat-plate__value" aria-label={`${value}${suffix}`}>
        {displayValue}
        {suffix}
      </span>
      <span className="mp-stat-plate__label">{label}</span>
    </div>
  )
}

/* ─── Check Icon ─── */

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.5 3.5L13 4" />
    </svg>
  )
}

/* ─── Star Rating ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={i < rating ? 'var(--mp-accent)' : 'none'}
          stroke={i < rating ? 'var(--mp-accent)' : 'var(--mp-text-muted)'}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.26 5.06 16.7l.94-5.49-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

/* ─── Main Component ─── */

export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="sobre"
      className="mp-section mp-section--frame"
      aria-labelledby="social-proof-heading"
    >
      <div className="mp-blueprint" aria-hidden="true" />
      <div className="mp-container">
        <div className="mp-about-grid">
          {/* Left column: About narrative */}
          <div>
            <span className="mp-kicker">Sobre a Colibri</span>
            <h2 id="social-proof-heading" className="mp-inst-header__title" style={{ marginTop: '1rem' }}>
              Fabricação própria, padrão industrial
            </h2>
            <p className="mp-about-copy" style={{ marginTop: '1.5rem' }}>
              Somos uma indústria especializada em toldos, coberturas, lonas técnicas e estruturas
              metálicas sob medida. Com mais de uma década de atuação, conduzimos cada projeto
              internamente — da engenharia ao acabamento — para garantir robustez, durabilidade e
              precisão construtiva.
            </p>
            <p className="mp-about-copy">
              Atendemos obras comerciais, residenciais e industriais em toda a região de São Paulo,
              com equipe técnica própria e controle total da produção.
            </p>

            <ul className="mp-checklist">
              {CAPABILITIES.map((item) => (
                <li key={item} className="mp-checklist__item">
                  <span className="mp-checklist__mark">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: Industrial stat plates */}
          <div className="mp-stat-stack">
            {METRICS.map((metric, index) => (
              <StatPlate
                key={metric.label}
                value={metric.value}
                suffix={metric.suffix}
                label={metric.label}
                inView={inView}
                accent={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Testimonial */}
        {TESTIMONIALS.map((testimonial) => (
          <figure key={testimonial.author} className="mp-quote">
            <span className="mp-quote__mark" aria-hidden="true">
              &ldquo;
            </span>
            <StarRating rating={testimonial.rating} />
            <blockquote className="mp-quote__text">{testimonial.text}</blockquote>
            <figcaption>
              <span className="mp-quote__author">{testimonial.author}</span>
              <span className="mp-quote__role" style={{ marginLeft: '0.75rem' }}>
                {testimonial.role}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
