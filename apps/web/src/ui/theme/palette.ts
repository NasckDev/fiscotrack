/**
 * Paleta do FiscoTrack: verde-floresta, creme, menta (ganho), rosa (perda) e dourado (DARF).
 * Fonte única das cores: o tema do Ant Design, os gráficos e o teste de contraste leem daqui.
 * Os pares de texto e fundo são conferidos por `test/contrast.test.ts` (WCAG 2.2 AA).
 */

export type ThemeMode = 'light' | 'dark';

export interface Palette {
  readonly bgLayout: string;
  readonly bgContainer: string;
  readonly bgElevated: string;
  readonly bgSubtle: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  readonly borderSoft: string;
  readonly primary: string;
  readonly primaryHover: string;
  readonly primaryActive: string;
  readonly primarySurface: string;
  /** Texto sobre `primary` (botão principal). */
  readonly onPrimary: string;
  /** Tons para texto e ícones, com contraste AA sobre os fundos de superfície. */
  readonly gain: string;
  readonly loss: string;
  readonly darf: string;
  readonly info: string;
  readonly gainSurface: string;
  readonly lossSurface: string;
  readonly darfSurface: string;
  readonly infoSurface: string;
  /** Preenchimentos de gráfico (contraste de interface, 3:1). */
  readonly gainFill: string;
  readonly lossFill: string;
  readonly darfFill: string;
  /** Dourado das barras de DARF sobre superfícies (3:1); o dourado da marca fica no cartão de destaque. */
  readonly darfBar: string;
  readonly chartLine: string;
  readonly chartGrid: string;
  readonly categorical: readonly string[];
  readonly focus: string;
  readonly siderBg: string;
  readonly siderText: string;
  readonly siderSelectedBg: string;
  readonly siderSelectedText: string;
  readonly heroFrom: string;
  readonly heroTo: string;
  readonly heroText: string;
  readonly heroMuted: string;
  readonly spotlightBg: string;
  readonly spotlightText: string;
}

const LIGHT: Palette = {
  bgLayout: '#f7f6f1',
  bgContainer: '#ffffff',
  bgElevated: '#ffffff',
  bgSubtle: '#efeee6',
  text: '#0e1f18',
  textMuted: '#4b5a53',
  border: '#7c8478',
  borderSoft: '#e3e1d6',
  primary: '#0e3b2e',
  primaryHover: '#17624a',
  primaryActive: '#07231b',
  primarySurface: '#e1eee7',
  onPrimary: '#f7f6f1',
  gain: '#0f7a50',
  loss: '#b92b47',
  darf: '#7e5a0b',
  info: '#1d5c7a',
  gainSurface: '#e1f3ea',
  lossSurface: '#fbe6ea',
  darfSurface: '#f8efd6',
  infoSurface: '#e2eff5',
  gainFill: '#1f9d6b',
  lossFill: '#d64561',
  darfFill: '#c8961c',
  darfBar: '#b3820f',
  chartLine: '#0e3b2e',
  chartGrid: '#e3e1d6',
  categorical: ['#0f5c63', '#5b7a99', '#8a6fb0', '#a8895a', '#3f8f86', '#7a8b6f', '#4a4e69'],
  focus: '#1d5fd6',
  siderBg: '#0e3b2e',
  siderText: '#cfe3d8',
  siderSelectedBg: '#1d5a46',
  siderSelectedText: '#ffffff',
  heroFrom: '#0e3b2e',
  heroTo: '#124a39',
  heroText: '#f7f6f1',
  heroMuted: '#b9d3c6',
  spotlightBg: '#0e1f18',
  spotlightText: '#f7f6f1',
};

const DARK: Palette = {
  bgLayout: '#0b1512',
  bgContainer: '#111e19',
  bgElevated: '#16271f',
  bgSubtle: '#16271f',
  text: '#e8f0eb',
  textMuted: '#9fb5aa',
  border: '#5b7167',
  borderSoft: '#22372e',
  primary: '#46c894',
  primaryHover: '#6ad9ab',
  primaryActive: '#8fe6c1',
  primarySurface: '#14342a',
  onPrimary: '#06140e',
  gain: '#4fd6a0',
  loss: '#ff8ea3',
  darf: '#f0c25a',
  info: '#7cc4e0',
  gainSurface: '#0f2e22',
  lossSurface: '#3a1620',
  darfSurface: '#33280c',
  infoSurface: '#10303d',
  gainFill: '#3fbf8a',
  lossFill: '#f0657f',
  darfFill: '#e0b040',
  darfBar: '#e0b040',
  chartLine: '#6fddb0',
  chartGrid: '#22372e',
  categorical: ['#5bb5c9', '#8fa8c8', '#b9a2dc', '#d4bf94', '#6fc3b5', '#9fb28f', '#c0c4d6'],
  focus: '#7db2ff',
  siderBg: '#0b1512',
  siderText: '#b7cbc0',
  siderSelectedBg: '#14342a',
  siderSelectedText: '#e8f0eb',
  heroFrom: '#0f4a38',
  heroTo: '#0c2f24',
  heroText: '#f7f6f1',
  heroMuted: '#b9d3c6',
  spotlightBg: '#d9e6df',
  spotlightText: '#06140e',
};

export const PALETTES: Readonly<Record<ThemeMode, Palette>> = { light: LIGHT, dark: DARK };

export const FONT_SANS = "'Manrope Variable', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FONT_MONO =
  "'JetBrains Mono Variable', ui-monospace, 'SFMono-Regular', Consolas, monospace";
