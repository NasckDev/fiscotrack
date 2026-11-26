/**
 * Paleta do FiscoTrack, identidade "livro-caixa moderno": verde-floresta para seriedade, lima para
 * o valor que pede ação e laranja-terra para prejuízo.
 * Fonte única das cores: o tema do Ant Design, os gráficos e o teste de contraste leem daqui; as
 * mesmas cores existem como variáveis CSS (`--ft-*`) em `src/index.css`.
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
  /** Borda de campo de formulário (3:1). */
  readonly border: string;
  /** Linhas e separadores decorativos. */
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
  /** Barras ligadas ao DARF (isenção ultrapassada) sobre superfícies (3:1). */
  readonly darfBar: string;
  readonly chartLine: string;
  readonly chartGrid: string;
  readonly categorical: readonly string[];
  readonly focus: string;
  /** Cartão herói (verde-floresta) e seus textos. */
  readonly hero: string;
  readonly heroText: string;
  readonly heroMuted: string;
  readonly heroSoft: string;
  /** Contorno do botão secundário dentro do cartão herói (decorativo: o botão tem texto). */
  readonly heroLine: string;
  /** Lima: só sobre o verde escuro ou como fundo de selo. */
  readonly lime: string;
  readonly onLime: string;
  /** Aba ativa da barra superior. */
  readonly navActiveBg: string;
  readonly navActiveText: string;
  readonly navText: string;
  readonly spotlightBg: string;
  readonly spotlightText: string;
}

const LIGHT: Palette = {
  bgLayout: '#eef1ec',
  bgContainer: '#ffffff',
  bgElevated: '#ffffff',
  bgSubtle: '#eef1ec',
  text: '#0f2a1f',
  textMuted: '#52665c',
  border: '#6e8378',
  borderSoft: '#cbd5cd',
  primary: '#123d2c',
  primaryHover: '#1b5640',
  primaryActive: '#0b2a1e',
  primarySurface: '#e2ebe4',
  onPrimary: '#d4f25a',
  gain: '#1e6b49',
  loss: '#9b4a17',
  darf: '#4a5a00',
  info: '#2d5b70',
  gainSurface: '#e1eee6',
  lossSurface: '#f7e7dc',
  darfSurface: '#f1f9d2',
  infoSurface: '#e3eef2',
  gainFill: '#123d2c',
  lossFill: '#c2662d',
  darfBar: '#6b7a12',
  chartLine: '#123d2c',
  chartGrid: '#cbd5cd',
  categorical: ['#0f2a1f', '#2f6b4f', '#5c8a72', '#6b7a12', '#3d6475', '#8a5a2b', '#4f4a6b'],
  focus: '#123d2c',
  hero: '#123d2c',
  heroText: '#ffffff',
  heroMuted: '#a9c2b5',
  heroSoft: '#cfe0d6',
  heroLine: '#4e7a64',
  lime: '#d4f25a',
  onLime: '#0f2a1f',
  navActiveBg: '#0f2a1f',
  navActiveText: '#ffffff',
  navText: '#52665c',
  spotlightBg: '#0f2a1f',
  spotlightText: '#ffffff',
};

const DARK: Palette = {
  bgLayout: '#0c1712',
  bgContainer: '#13231b',
  bgElevated: '#192d23',
  bgSubtle: '#192d23',
  text: '#e9f2ec',
  textMuted: '#9db3a7',
  border: '#6c8a7a',
  borderSoft: '#2a4035',
  primary: '#d4f25a',
  primaryHover: '#e0f68a',
  primaryActive: '#bfdb45',
  primarySurface: '#1f3a2c',
  onPrimary: '#0f2a1f',
  gain: '#8fd3ae',
  loss: '#e08a55',
  darf: '#d4f25a',
  info: '#8cc3d9',
  gainSurface: '#163a2a',
  lossSurface: '#3a2216',
  darfSurface: '#2a3613',
  infoSurface: '#14303b',
  gainFill: '#7cc59c',
  lossFill: '#e08a55',
  darfBar: '#d4f25a',
  chartLine: '#d4f25a',
  chartGrid: '#2a4035',
  categorical: ['#d4f25a', '#7cc59c', '#a9c2b5', '#5fa8c2', '#e0a86e', '#b9a2dc', '#c0c4d6'],
  focus: '#d4f25a',
  hero: '#0b2a1e',
  heroText: '#ffffff',
  heroMuted: '#a9c2b5',
  heroSoft: '#cfe0d6',
  heroLine: '#4e7a64',
  lime: '#d4f25a',
  onLime: '#0f2a1f',
  navActiveBg: '#e9f2ec',
  navActiveText: '#0f2a1f',
  navText: '#9db3a7',
  spotlightBg: '#e9f2ec',
  spotlightText: '#0f2a1f',
};

export const PALETTES: Readonly<Record<ThemeMode, Palette>> = { light: LIGHT, dark: DARK };

export const FONT_SANS = "'Manrope Variable', Manrope, Arial, system-ui, sans-serif";
/** Só para trechos de código (atalhos, CSV de exemplo); valores usam Manrope tabular. */
export const FONT_MONO = "ui-monospace, 'SFMono-Regular', Consolas, monospace";
