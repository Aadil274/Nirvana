/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface': '#fdf9f5',
        'surface-cream': '#FBF7EF',
        'surface-white': '#FFFFFF',
        'surface-sand': '#F3EBDD',
        'surface-dim': '#ddd9d6',
        'ink': '#2B2A28',
        'ink-muted': '#6F6A60',
        'on-surface': '#1c1b1a',
        'on-surface-variant': '#3f484b',
        'primary': '#006070',
        'primary-container': '#1f7a8c',
        'on-primary': '#ffffff',
        'on-primary-container': '#e3f8ff',
        'teal-hover': '#17606F',
        'teal-tint': '#E3F1F4',
        'secondary': '#914d00',
        'secondary-container': '#fc9430',
        'saffron': '#F28C28',
        'saffron-tint': '#FDEBD3',
        'risk-low': '#4CAF7A',
        'risk-low-bg': '#E6F5ED',
        'risk-moderate': '#F2B134',
        'risk-moderate-bg': '#FDF3D8',
        'risk-high': '#EE7B30',
        'risk-high-bg': '#FDE6D6',
        'risk-severe': '#D9453D',
        'risk-severe-bg': '#FBE1DF',
        'error': '#ba1a1a',
        'outline': '#6f797c',
        'outline-sand': '#EADBCA'
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        regional: ['"Noto Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'pill': '9999px',
        'modal': '28px',
      },
      boxShadow: {
        'level1': '0 4px 16px -2px rgba(43, 42, 40, 0.05), 0 2px 6px -1px rgba(43, 42, 40, 0.03)',
        'level2': '0 12px 28px -4px rgba(43, 42, 40, 0.08), 0 4px 10px -2px rgba(43, 42, 40, 0.04)',
        'level3': '0 20px 38px -6px rgba(43, 42, 40, 0.10), 0 8px 16px -4px rgba(43, 42, 40, 0.05)',
        'severe-glow': '0 0 0 4px #FBE1DF, 0 8px 24px rgba(217, 69, 61, 0.12)',
        'saffron-glow': '0 0 0 4px #FDEBD3, 0 8px 24px rgba(242, 140, 40, 0.15)',
      }
    },
  },
  plugins: [],
}
