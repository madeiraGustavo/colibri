import type { ReactNode } from 'react'

/** Ícones lineares do manual de identidade Colibri (toldo, lona, estrutura, metalon, solda). */

const iconClass = 'w-7 h-7'

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={iconClass}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Toldo — estrutura com lona inclinada */
export function IconToldo() {
  return (
    <IconBase>
      <path d="M5 20V11M19 20V11" />
      <path d="M5 11L12 5L19 11" />
      <path d="M5 14L12 9L19 14" />
      <path d="M3 20H21" />
    </IconBase>
  )
}

/** Lona — rolo + trecho estendido */
export function IconLona() {
  return (
    <IconBase>
      <ellipse cx="7" cy="10" rx="4" ry="4.5" />
      <path d="M11 6.5H20V13.5H11V6.5Z" />
      <path d="M11 8H20M11 12H20" strokeOpacity="0.45" />
      <path d="M7 14.5V20" />
    </IconBase>
  )
}

/** Estrutura — treliça / cobertura metálica */
export function IconEstrutura() {
  return (
    <IconBase>
      <path d="M4 20L12 6L20 20" />
      <path d="M8 20L12 12L16 20" />
      <path d="M6.5 15.5H17.5" />
      <path d="M3 20H21" />
    </IconBase>
  )
}

/** Metalon — perfil tubular quadrado */
export function IconMetalon() {
  return (
    <IconBase>
      <rect x="5" y="5" width="14" height="14" rx="0.5" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="0.5" />
      <path d="M5 12H19M12 5V19" strokeOpacity="0.35" />
    </IconBase>
  )
}

/** Solda — maçarico / aço */
export function IconSolda() {
  return (
    <IconBase>
      <path d="M9 20V14L11 8H14L16 14V20" />
      <path d="M10 20H15" />
      <path d="M16 10L20 6" />
      <path d="M20 6C21.5 7 22 8.5 21.5 10C20.5 9.5 19 8.5 18 7" />
      <circle cx="20.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  )
}
