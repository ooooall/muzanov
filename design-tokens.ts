/**
 * QUARTERS · Design Tokens
 * Single source of truth — used in Next.js (Tailwind + CSS vars)
 */

export const colors = {
  // Surfaces — true black industrial base
  bg: {
    base:     '#000000',
    canvas:   '#0a0a0a',
    elevated: '#121212',
    panel:    '#151515',
    panel2:   '#181818',
    hover:    '#1e1e1e',
    active:   '#242424',
  },

  // Borders
  border: {
    soft:   'rgba(255, 255, 255, 0.04)',
    base:   'rgba(255, 255, 255, 0.07)',
    strong: 'rgba(255, 255, 255, 0.11)',
    bright: 'rgba(255, 255, 255, 0.20)',
  },

  // Typography
  text: {
    1: '#f5f5f5',
    2: '#c0c0c0',
    3: '#8a8a8a',
    4: '#5a5a5a',
    5: '#3a3a3a',
  },

  // Status palette — monochrome + yellow + green ONLY
  // No orange, red, purple
  status: {
    idle:       '#5a5a5a',
    scheduled:  '#808080',
    progress:   '#f5c518',
    paused:     '#c8a200',
    attention:  '#c8a200',
    postponed:  '#606060',
    rework:     '#a08800',
    completed:  '#3aae5f',
  },

  // Accent
  accent:      '#f5c518',
  accentSoft:  'rgba(245, 197, 24, 0.10)',
  success:     '#3aae5f',
  successSoft: 'rgba(58, 174, 95, 0.10)',
  danger:      '#aa2a3a',
  dangerSoft:  'rgba(170, 42, 58, 0.10)',
} as const

export const radius = {
  sm: '4px',
  base: '6px',
  lg: '8px',
  xl: '12px',
  pill: '999px',
} as const

export const shadows = {
  // Neutral black only — no colored glows
  sm:   '0 2px 8px rgba(0, 0, 0, 0.25)',
  base: '0 4px 16px rgba(0, 0, 0, 0.30)',
  lg:   '0 4px 20px rgba(0, 0, 0, 0.30)',
  // No shadow above lg
} as const

export const typography = {
  fontSans: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"SF Pro Text"',
    '"SF Pro Display"',
    '"Inter"',
    'system-ui',
    'sans-serif',
  ].join(', '),
  fontMono: [
    'ui-monospace',
    '"SF Mono"',
    '"JetBrains Mono"',
    'Menlo',
    'Monaco',
    'monospace',
  ].join(', '),

  // Weights
  weight: {
    regular: 400,
    medium:  500,
    // No 600+ — keep it lean
  },

  // Letter-spacing for uppercase labels
  tracking: {
    tight:  '0.02em',
    base:   '0.08em',
    wide:   '0.14em',
    wider:  '0.18em',
  },
} as const

// Tailwind config extension (copy into tailwind.config.ts → theme.extend)
export const tailwindExtend = {
  colors: {
    base:     colors.bg.base,
    canvas:   colors.bg.canvas,
    elevated: colors.bg.elevated,
    panel:    colors.bg.panel,
    hover:    colors.bg.hover,

    accent:  colors.accent,
    success: colors.success,
    danger:  colors.danger,

    border:       colors.border.base,
    'border-strong': colors.border.strong,

    text: {
      1: colors.text[1],
      2: colors.text[2],
      3: colors.text[3],
      4: colors.text[4],
    },

    status: {
      idle:      colors.status.idle,
      progress:  colors.status.progress,
      completed: colors.status.completed,
      attention: colors.status.attention,
    },
  },

  borderRadius: {
    sm:   radius.sm,
    DEFAULT: radius.base,
    lg:   radius.lg,
    xl:   radius.xl,
    pill: radius.pill,
  },

  boxShadow: {
    sm:   shadows.sm,
    DEFAULT: shadows.base,
    lg:   shadows.lg,
  },

  fontFamily: {
    sans: typography.fontSans.split(', '),
    mono: typography.fontMono.split(', '),
  },
} as const
