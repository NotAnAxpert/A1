export const colors = {
  background: '#F7F6F3',
  surface: 'rgba(255, 255, 255, 0.7)',
  surfaceSolid: '#FFFFFF',
  primary: '#7B61FF',
  primaryLight: 'rgba(123, 97, 255, 0.12)',
  success: '#00D4AA',
  successLight: 'rgba(0, 212, 170, 0.12)',
  error: '#FF6B9D',
  errorLight: 'rgba(255, 107, 157, 0.12)',
  warning: '#FFB847',
  text: '#1A1A2E',
  textSecondary: '#6B6B8D',
  textMuted: '#9D9DB8',
  border: 'rgba(123, 97, 255, 0.15)',
  borderStrong: 'rgba(123, 97, 255, 0.3)',

  der: '#00BFFF',
  die: '#FF6B9D',
  das: '#00D4AA',
  plural: '#B8FF57',

  accent1: '#FF6B9D',
  accent2: '#00D4AA',
  accent3: '#B8FF57',
  accent4: '#FFB847',
};

export const articleColors: Record<string, string> = {
  der: colors.der,
  die: colors.die,
  das: colors.das,
  plural: colors.plural,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  hero: 48,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};

export const shadow = {
  shadowColor: '#7B61FF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

export const MAX_WIDTH = 480;
