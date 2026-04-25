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
        base:     '#000000',
        canvas:   '#0a0a0a',
        elevated: '#121212',
        panel:    '#151515',
        panel2:   '#181818',
        hover:    '#1e1e1e',
        active:   '#242424',

        accent:   '#f5c518',
        'accent-soft': 'rgba(245,197,24,0.10)',
        success:  '#3aae5f',
        'success-soft': 'rgba(58,174,95,0.10)',
        danger:   '#aa2a3a',
        'danger-soft': 'rgba(170,42,58,0.10)',

        border: 'rgba(255,255,255,0.07)',
        'border-soft':   'rgba(255,255,255,0.04)',
        'border-strong': 'rgba(255,255,255,0.11)',
        'border-bright': 'rgba(255,255,255,0.20)',

        text: {
          1: '#f5f5f5',
          2: '#c0c0c0',
          3: '#8a8a8a',
          4: '#5a5a5a',
          5: '#3a3a3a',
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
        sm:   '0 2px 8px rgba(0,0,0,0.25)',
        DEFAULT: '0 4px 16px rgba(0,0,0,0.30)',
        lg:   '0 4px 20px rgba(0,0,0,0.30)',
        drawer: '0 -8px 30px rgba(0,0,0,0.4)',
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
