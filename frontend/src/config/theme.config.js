/**
 * THEME CONFIGURATION
 * ---------------------------------------------------------------------------
 * tailwind.config.js imports this file directly, so changing a value here
 * re-themes the entire storefront and admin without touching component code.
 *
 * NOTE ON LEGACY TOKEN NAMES:
 * This codebase's ~50 components already use Tailwind classes named
 * `emerald`, `emerald-light`, `emerald-dark`, `gold`, `gold-light`,
 * `gold-dark`, `ivory`, `charcoal`, `muted` and `terracotta` everywhere
 * (buttons, badges, prices, nav states, admin UI, forms...). Those names
 * were the previous (fashion-brand) design system's palette.
 *
 * Rather than hand-editing className strings across every component (high
 * risk of breaking working functionality for a purely cosmetic change),
 * this file keeps the token NAMES and repoints their VALUES to the new
 * Flerläss Global red/black/white identity:
 *
 *   emerald  -> brand red   (primary actions, links, active/hover states)
 *   gold     -> near-black  (secondary accents: "New" badges, cart count)
 *   ivory    -> white       (page background)
 *   charcoal -> near-black  (body text)
 *   muted    -> gray        (secondary text)
 *   terracotta -> brand red (was used for "sale"/danger accents)
 *
 * Net effect: every existing component automatically renders in the new
 * red/black/white palette with zero risk to working logic. New sections
 * (Home hero, category cards, trade-in, global sourcing, etc.) also use a
 * few clearer new token names below (`primary`, `surface`, `border`, `ink`).
 */

export const THEME = {
  colors: {
    // Legacy token names, repointed to the new brand palette.
    emerald: {
      DEFAULT: '#C90016', // brand red — primary
      light: '#E8394F',
      dark: '#970010',
    },
    gold: {
      DEFAULT: '#171717', // near-black — secondary accent
      light: '#3F3F3F',
      dark: '#000000',
    },
    ivory: '#FFFFFF',
    charcoal: '#171717',
    muted: '#6B7280',
    terracotta: '#C90016',
    whatsapp: '#25D366',

    // New, clearly-named tokens for newly built sections.
    primary: '#C90016',
    primaryHover: '#A80012',
    black: '#111111',
    surface: '#F7F7F7',
    border: '#E5E5E5',
    ink: '#171717',
  },

  fontFamily: {
    display: ['"Sora"', 'sans-serif'],
    body: ['"Inter"', 'sans-serif'],
  },

  boxShadow: {
    card: '0 2px 12px rgba(17, 17, 17, 0.06)',
    'card-hover': '0 10px 28px rgba(17, 17, 17, 0.12)',
  },

  borderRadius: {
    xl: '0.75rem',
  },
};
