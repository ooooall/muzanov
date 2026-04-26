import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base:     '#f8fafc',
        canvas:   '#f1f5f9',
        elevated: '#ffffff',
        panel:    '#ffffff',
        panel2:   '#f8fafc',
        hover:    '#eef2f7',
        active:   '#e2e8f0',

        accent:   '#f5c518',
        'accent-soft': 'rgba(245,197,24,0.10)',
        success:  '#3aae5f',
        'success-soft': 'rgba(58,174,95,0.10)',
        danger:   '#aa2a3a',
        'danger-soft': 'rgba(170,42,58,0.10)',

        border: 'rgba(15,23,42,0.12)',
        'border-soft':   'rgba(15,23,42,0.06)',
        'border-strong': 'rgba(15,23,42,0.18)',
        'border-bright': 'rgba(15,23,42,0.26)',

        text: {
          1: '#0f172a',
          2: '#1e293b',
          3: '#475569',
          4: '#64748b',
          5: '#94a3b8',
        },

        status: {
          idle:       '#5a5a5a',
          scheduled:  '#808080',
          progress:   '#f5c518',
          paused:     '#c8a200',
          attention:  '#c8a200',
          rework:     '#a08800',
          completed:  '#3aae5f',
        },
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Monaco', 'monospace'],
      },

      borderRadius: {
        sm:   '4px',
        DEFAULT: '6px',
        lg:   '8px',
        xl:   '12px',
        pill: '999px',
      },

      boxShadow: {
        sm:   '0 2px 8px rgba(15,23,42,0.08)',
        DEFAULT: '0 8px 24px rgba(15,23,42,0.10)',
        lg:   '0 12px 32px rgba(15,23,42,0.12)',
        drawer: '0 -8px 30px rgba(15,23,42,0.16)',
      },

      letterSpacing: {
        tight:  '0.02em',
        base:   '0.08em',
        wide:   '0.14em',
        wider:  '0.18em',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 200ms ease forwards',
        'slide-up':   'slideUp 320ms cubic-bezier(0.2,0.85,0.2,1) forwards',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
