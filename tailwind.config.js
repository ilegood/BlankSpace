/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#17171D',
          sidebar: '#1E1E27',
          document: '#22222C',
          card: '#292936',
          text: '#E8E7EF',
          subtext: '#A5A3B5',
          border: '#3A3948',
          accent: '#A995F5',
          highlight: '#B7A5FF',
        },
        lavender: {
          50: '#F8F8FD',
          100: '#F2F1FD',
          200: '#E6E3FC',
          300: '#D5CFFB',
          400: '#B4A6F7',
          500: '#937BEF',
          600: '#7E61E7',
          700: '#6845DB',
          800: '#5638B8',
          900: '#462E94',
          950: '#2C1D5E',
        },
        workspace: {
          bg: '#F9FAFD',
          sidebar: '#F8F9FD',
          card: '#FFFFFF',
          border: '#ECEEF3',
        }
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'soft-hover': '0 8px 24px rgba(126, 97, 231, 0.08)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}

