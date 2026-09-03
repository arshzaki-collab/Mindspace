export const Colors = {
  canvas: '#FAF8F5',
  white: '#FFFFFF',
  ink: '#17171C',
  body: '#5A5A65',
  muted: '#8A8A96',
  border: 'rgba(23, 23, 28, 0.06)',
  primary: { 50: '#F4F0FF', 100: '#E8E1FF', 200: '#D5C8FF', 300: '#B8A3FF', 400: '#9478FF', 500: '#6C47FF', 600: '#5B3EE4', 700: '#4B30C7', 800: '#37239A', 900: '#241463' },
  accent: { 50: '#F0FBF6', 100: '#E2F6EE', 400: '#54B88C', 500: '#1B8057', 600: '#176D4B', 700: '#12563C' },
  pastel: { lavender: '#EFEAFF', mint: '#E2F6EE', peach: '#FEEFE6', blue: '#E6F2FE', pink: '#FBEAF3', butter: '#FFF5D9' },
  neon: { pink: '#FF5FA2', yellow: '#FFD84D', lime: '#B8E986', cyan: '#59D8FF', purple: '#9B7CFF' },
  sky: '#1E65B8',
  peachAccent: '#C45314',
  success: '#1B8057',
  warning: '#B66A19',
  error: '#C94C5C',
  black: '#17171C',
  neutral: { 50: '#FFFFFF', 100: '#F7F6F4', 200: '#EEECE9', 300: '#DDD9D4', 400: '#B4B0AA', 500: '#8A8A96', 600: '#6D6B72', 700: '#5A5A65', 800: '#303037', 900: '#17171C', 950: '#0F0F13' },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { xs: 10, sm: 14, md: 18, lg: 22, xl: 28, full: 9999 };

export const Typography = {
  display: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40 },
  h1: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '500' as const, lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: '700' as const, lineHeight: 15 },
};

export const Shadows = {
  sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.035, shadowRadius: 18, elevation: 2 },
  md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.055, shadowRadius: 28, elevation: 4 },
  lg: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.07, shadowRadius: 36, elevation: 7 },
  glow: { shadowColor: '#6C47FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 6 },
};
