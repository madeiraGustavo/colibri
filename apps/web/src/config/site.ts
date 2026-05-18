/**
 * Brand_Config — Single source of truth for all brand-specific values.
 *
 * Every component that needs brand identity (name, contacts, colors, categories)
 * MUST import from this file. No brand values should be hardcoded elsewhere.
 */

export interface SiteConfig {
  /** Company display name */
  name: string;
  /** Short tagline for headers and banners */
  tagline: string;
  /** SEO meta description */
  description: string;
  /** Production domain (without protocol) */
  domain: string;
  /** Business contact information */
  contacts: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  /** Product/service categories offered */
  categories: string[];
  /** Brand color palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Social media links */
  social: {
    instagram?: string;
    facebook?: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "Toldos Colibri",
  tagline: "Qualidade e proteção para seu espaço",
  description:
    "Toldos Colibri — fabricação e instalação de toldos, coberturas, capotas, capas de mesa e produtos de lona. Solicite seu orçamento.",
  domain: "toldoscolibri.com.br",
  contacts: {
    phone: "(32) 98432-7514",
    whatsapp: "5532984327514",
    email: "morcorjcolibri@gmail.com",
    address: "Rio Pomba, MG — Brasil",
  },
  categories: [
    "toldos",
    "coberturas",
    "capotas",
    "capas de mesa",
    "produtos de lona",
  ],
  colors: {
    primary: "#D4A017",
    secondary: "#1A1A1A",
    accent: "#F59E0B",
  },
  social: {
    instagram: "https://instagram.com/toldoscolibri",
    facebook: "https://facebook.com/toldoscolibri",
  },
};
