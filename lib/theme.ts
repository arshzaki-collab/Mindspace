export const Colors = {
  primary: {
    50: '#F7F3FF',
    100: '#EFE8FF',
    200: '#DFD2FF',
    300: '#C6A9FF',
    400: '#A77BFF',
    500: '#8B5CF6',
    600: '#6D35E8',
    700: '#5426BD',
    800: '#3E1C89',
    900: '#26114E',
  },
  accent: {
    50: '#ECFFFA',
    100: '#D8FAF2',
    400: '#48DCC1',
    500: '#16B99A',
    600: '#0C9279',
    700: '#0A6B59',
  },
  neon: {
    purple: '#A970FF',
    pink: '#FF78B7',
    cyan: '#45D6E8',
    lime: '#9BE15D',
    yellow: '#F2C84B',
  },
  pastel: {
    lavender: '#F3EEFF',
    pink: '#FFF0F7',
    blue: '#EEF7FF',
    mint: '#ECFBF6',
    peach: '#FFF5EB',
    butter: '#FFF8E7',
  },
  neutral: {
    50: '#FFFFFF',
    100: '#FAFAFC',
    200: '#ECECF1',
    300: '#D8D9E0',
    400: '#A5A7B1',
    500: '#737681',
    600: '#555861',
    700: '#3B3D46',
    800: '#23252C',
    900: '#111218',
    950: '#07080C',
  },
  success: '#159A77',
  warning: '#C98724',
  error: '#D64B5B',
  white: '#FFFFFF',
  black: '#07080C',
  border: '#ECECF1',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 26, full: 9999 };

export const Typography = {
  display: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

export const Shadows = {
  sm: { shadowColor: '#121018', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.045, shadowRadius: 10, elevation: 2 },
  md: { shadowColor: '#121018', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  lg: { shadowColor: '#121018', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.11, shadowRadius: 28, elevation: 8 },
};
