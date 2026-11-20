import { theme, type ThemeConfig } from 'antd';
import { FONT_MONO, FONT_SANS, PALETTES, type ThemeMode } from './palette';

export interface ThemeOptions {
  /** Celular: alvos de toque de 44 px. */
  readonly mobile: boolean;
  /** Sem animações (preferência do sistema e testes). */
  readonly reducedMotion: boolean;
}

/** Converte a paleta do FiscoTrack nos tokens do Ant Design (claro e escuro). */
export function buildTheme(mode: ThemeMode, options: ThemeOptions): ThemeConfig {
  const p = PALETTES[mode];
  const isDark = mode === 'dark';
  const controlHeight = options.mobile ? 44 : 40;

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorPrimaryHover: p.primaryHover,
      colorPrimaryActive: p.primaryActive,
      colorPrimaryBg: p.primarySurface,
      colorSuccess: p.gain,
      colorSuccessBg: p.gainSurface,
      colorSuccessText: p.gain,
      colorError: p.loss,
      colorErrorBg: p.lossSurface,
      colorErrorText: p.loss,
      colorWarning: p.darfFill,
      colorWarningBg: p.darfSurface,
      colorWarningText: p.darf,
      colorInfo: p.info,
      colorInfoBg: p.infoSurface,
      colorInfoText: p.info,
      colorLink: isDark ? p.primary : p.primary,
      colorLinkHover: p.primaryHover,
      colorLinkActive: p.primaryActive,
      colorBgLayout: p.bgLayout,
      colorBgContainer: p.bgContainer,
      colorBgElevated: p.bgElevated,
      colorBgSpotlight: p.spotlightBg,
      colorTextLightSolid: p.spotlightText,
      colorFillAlter: p.bgSubtle,
      colorText: p.text,
      colorTextSecondary: p.textMuted,
      colorTextTertiary: p.textMuted,
      colorTextDescription: p.textMuted,
      colorTextPlaceholder: p.border,
      colorBorder: p.border,
      colorBorderSecondary: p.borderSoft,
      colorSplit: p.borderSoft,
      colorFillSecondary: p.primarySurface,
      colorFillTertiary: p.bgSubtle,
      colorFillQuaternary: p.bgSubtle,
      controlOutline: p.focus,
      colorBgMask: isDark ? 'rgb(0 0 0 / 0.65)' : 'rgb(11 21 18 / 0.55)',
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 15,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 18,
      fontSizeHeading4: 16,
      borderRadius: 12,
      borderRadiusLG: 16,
      borderRadiusSM: 8,
      controlHeight,
      controlHeightSM: options.mobile ? 44 : 32,
      controlHeightLG: options.mobile ? 48 : 48,
      lineHeight: 1.55,
      motion: !options.reducedMotion,
      wireframe: false,
    },
    components: {
      Layout: {
        bodyBg: p.bgLayout,
        headerBg: p.bgContainer,
        headerPadding: '0 24px',
        headerHeight: 64,
        siderBg: p.siderBg,
        triggerBg: p.siderSelectedBg,
        triggerColor: p.siderSelectedText,
      },
      Menu: {
        darkItemBg: p.siderBg,
        darkSubMenuItemBg: p.siderBg,
        darkItemColor: p.siderText,
        darkItemHoverBg: p.siderSelectedBg,
        darkItemHoverColor: p.siderSelectedText,
        darkItemSelectedBg: p.siderSelectedBg,
        darkItemSelectedColor: p.siderSelectedText,
        itemBorderRadius: 12,
        itemHeight: 44,
        activeBarBorderWidth: 0,
      },
      Card: {
        borderRadiusLG: 16,
        boxShadowTertiary: isDark
          ? '0 0 0 1px rgb(255 255 255 / 0.02)'
          : '0 1px 1px rgb(14 59 46 / 0.04), 0 6px 16px -6px rgb(14 59 46 / 0.1)',
        headerFontSize: 16,
      },
      Table: {
        headerBg: p.bgSubtle,
        headerColor: p.textMuted,
        headerSplitColor: p.borderSoft,
        rowHoverBg: p.primarySurface,
        borderColor: p.borderSoft,
        headerBorderRadius: 12,
        cellPaddingBlock: 12,
      },
      Button: {
        fontWeight: 600,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        primaryColor: p.onPrimary,
        onlyIconSize: 18,
      },
      Statistic: {
        titleFontSize: 14,
        contentFontSize: 28,
      },
      Collapse: {
        headerBg: p.bgContainer,
        contentBg: p.bgContainer,
      },
      Steps: {
        titleLineHeight: 1.4,
      },
      Tag: {
        defaultBg: p.bgSubtle,
        defaultColor: p.text,
        fontSizeSM: 13,
      },
      Segmented: {
        itemSelectedBg: p.primary,
        itemSelectedColor: p.onPrimary,
        trackBg: p.bgSubtle,
      },
      Modal: {
        titleFontSize: 18,
      },
    },
  };
}
