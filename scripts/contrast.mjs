/* eslint-disable no-console -- script de linha de comando */
// Confere o contraste (WCAG) dos pares de cor do tema. Uso: node scripts/contrast.mjs
const luminance = (hex) => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const THEMES = {
  claro: {
    bg: '#f7f6f1',
    card: '#ffffff',
    subtle: '#efeee6',
    text: '#0e1f18',
    muted: '#4b5a53',
    accent: '#0e3b2e',
    onAccent: '#f7f6f1',
    accentSurface: '#e1eee7',
    border: '#7c8478',
    success: '#0f7a50',
    successSurface: '#e1f3ea',
    danger: '#b92b47',
    dangerSurface: '#fbe6ea',
    warning: '#7e5a0b',
    warningSurface: '#f8efd6',
    info: '#1d5c7a',
    infoSurface: '#e2eff5',
    focus: '#1d5fd6',
  },
  escuro: {
    bg: '#0b1512',
    card: '#111e19',
    subtle: '#16271f',
    text: '#e8f0eb',
    muted: '#9fb5aa',
    accent: '#46c894',
    onAccent: '#06140e',
    accentSurface: '#14342a',
    border: '#5b7167',
    success: '#4fd6a0',
    successSurface: '#0f2e22',
    danger: '#ff8ea3',
    dangerSurface: '#3a1620',
    warning: '#f0c25a',
    warningSurface: '#33280c',
    info: '#7cc4e0',
    infoSurface: '#10303d',
    focus: '#7db2ff',
  },
};

const text = (t) => [
  ['texto/fundo', t.text, t.bg],
  ['texto/cartão', t.text, t.card],
  ['mudo/fundo', t.muted, t.bg],
  ['mudo/cartão', t.muted, t.card],
  ['mudo/subtle', t.muted, t.subtle],
  ['destaque/fundo', t.accent, t.bg],
  ['destaque/cartão', t.accent, t.card],
  ['destaque/superfície', t.accent, t.accentSurface],
  ['botão primário', t.onAccent, t.accent],
  ['ganho/cartão', t.success, t.card],
  ['ganho/superfície', t.success, t.successSurface],
  ['perda/cartão', t.danger, t.card],
  ['perda/superfície', t.danger, t.dangerSurface],
  ['DARF/cartão', t.warning, t.card],
  ['DARF/superfície', t.warning, t.warningSurface],
  ['info/superfície', t.info, t.infoSurface],
];
const ui = (t) => [
  ['borda de campo/cartão', t.border, t.card],
  ['foco/cartão', t.focus, t.card],
  ['foco/fundo', t.focus, t.bg],
];

let failures = 0;
for (const [name, theme] of Object.entries(THEMES)) {
  for (const [kind, min, pairs] of [
    ['texto', 4.5, text(theme)],
    ['interface', 3, ui(theme)],
  ]) {
    for (const [label, fg, bg] of pairs) {
      const value = ratio(fg, bg);
      const ok = value >= min;
      if (!ok) failures += 1;
      console.log(
        `${ok ? 'OK  ' : 'FALHA'} ${name} ${kind} ${label}: ${value.toFixed(2)} (mín. ${min})`,
      );
    }
  }
}
process.exit(failures === 0 ? 0 : 1);
