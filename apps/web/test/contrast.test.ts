import { describe, expect, it } from 'vitest';
import { PALETTES, type Palette, type ThemeMode } from '../src/ui/theme/palette';

/** Luminância relativa (WCAG 2.x). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const TEXT = 4.5;
const UI = 3;

type Pair = readonly [
  name: string,
  foreground: keyof Palette,
  background: keyof Palette,
  min: number,
];

const SURFACES = ['bgLayout', 'bgContainer', 'bgElevated', 'bgSubtle'] as const;

const PAIRS: readonly Pair[] = [
  ...SURFACES.flatMap((surface): Pair[] => [
    [`texto em ${surface}`, 'text', surface, TEXT],
    [`texto secundário em ${surface}`, 'textMuted', surface, TEXT],
  ]),
  ['link/primária em bgContainer', 'primary', 'bgContainer', TEXT],
  ['link/primária em bgLayout', 'primary', 'bgLayout', TEXT],
  ['link/primária em primarySurface', 'primary', 'primarySurface', TEXT],
  ['texto em primarySurface', 'text', 'primarySurface', TEXT],
  ['texto do botão principal', 'onPrimary', 'primary', TEXT],
  ['ganho em bgContainer', 'gain', 'bgContainer', TEXT],
  ['ganho em gainSurface', 'gain', 'gainSurface', TEXT],
  ['perda em bgContainer', 'loss', 'bgContainer', TEXT],
  ['perda em lossSurface', 'loss', 'lossSurface', TEXT],
  ['perda em bgSubtle', 'loss', 'bgSubtle', TEXT],
  ['DARF em bgContainer', 'darf', 'bgContainer', TEXT],
  ['DARF em darfSurface', 'darf', 'darfSurface', TEXT],
  ['info em bgContainer', 'info', 'bgContainer', TEXT],
  ['info em infoSurface', 'info', 'infoSurface', TEXT],
  ['texto em darfSurface (aviso)', 'text', 'darfSurface', TEXT],
  ['texto em infoSurface (aviso)', 'text', 'infoSurface', TEXT],
  ['texto em lossSurface (erro)', 'text', 'lossSurface', TEXT],
  ['texto em gainSurface (sucesso)', 'text', 'gainSurface', TEXT],
  ['borda de campo em bgContainer', 'border', 'bgContainer', UI],
  ['borda de campo em bgLayout', 'border', 'bgLayout', UI],
  ['foco em bgContainer', 'focus', 'bgContainer', UI],
  ['foco em bgLayout', 'focus', 'bgLayout', UI],
  ['barra de ganho', 'gainFill', 'bgContainer', UI],
  ['barra de perda', 'lossFill', 'bgContainer', UI],
  ['barra de DARF', 'darfBar', 'bgContainer', UI],
  ['linha do gráfico', 'chartLine', 'bgContainer', UI],
  ['texto do menu lateral', 'siderText', 'siderBg', TEXT],
  ['texto do menu lateral em hover', 'siderText', 'siderSelectedBg', TEXT],
  ['item selecionado do menu lateral', 'siderSelectedText', 'siderSelectedBg', TEXT],
  ['texto do cartão de destaque (início)', 'heroText', 'heroFrom', TEXT],
  ['texto do cartão de destaque (fim)', 'heroText', 'heroTo', TEXT],
  ['texto secundário do destaque (início)', 'heroMuted', 'heroFrom', TEXT],
  ['texto secundário do destaque (fim)', 'heroMuted', 'heroTo', TEXT],
  ['valor do DARF no destaque (texto grande, início)', 'darfFill', 'heroFrom', UI],
  ['valor do DARF no destaque (texto grande, fim)', 'darfFill', 'heroTo', UI],
  ['dica de ferramenta', 'spotlightText', 'spotlightBg', TEXT],
];

describe.each(Object.keys(PALETTES) as ThemeMode[])('contraste AA, tema %s', (mode) => {
  const palette = PALETTES[mode];

  it.each(PAIRS)('%s', (_name, foreground, background, min) => {
    const ratio = contrast(String(palette[foreground]), String(palette[background]));
    expect(
      ratio,
      `${String(palette[foreground])} sobre ${String(palette[background])}`,
    ).toBeGreaterThanOrEqual(min);
  });

  it('as cores categóricas têm 3:1 sobre o fundo do cartão', () => {
    for (const color of palette.categorical) {
      expect(contrast(color, palette.bgContainer), color).toBeGreaterThanOrEqual(UI);
    }
  });
});
