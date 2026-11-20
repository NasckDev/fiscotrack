import type { CSSProperties } from 'react';
import { FONT_MONO } from './theme/palette';

/** Valores financeiros: fonte mono com algarismos tabulares, para alinhar colunas. */
export const MONO_STYLE: CSSProperties = {
  fontFamily: FONT_MONO,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};
