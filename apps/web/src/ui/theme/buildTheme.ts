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
      colorPrimaryBgHover: p.primarySurface,
      colorPrimaryText: p.primary,
      colorPrimaryTextHover: p.primaryHover,
      colorSuccess: p.gain,
      colorSuccessBg: p.gainSurface,
      colorSuccessBorder: p.gainSurface,
      colorSuccessText: p.gain,
      colorError: p.loss,
      colorErrorBg: p.lossSurface,
      colorErrorBorder: p.lossSurface,
      colorErrorText: p.loss,
      colorWarning: p.darfBar,
      colorWarningBg: p.darfSurface,
      colorWarningBorder: p.darfSurface,
      colorWarningText: p.darf,
      colorInfo: p.info,
      colorInfoBg: p.infoSurface,
      colorInfoBorder: p.infoSurface,
      colorInfoText: p.info,
      colorLink: isDark ? p.primary : p.text,
      colorLinkHover: isDark ? p.primaryHover : p.primaryHover,
      colorLinkActive: p.primaryActive,
      colorBgLayout: p.bgLayout,
      colorBgContainer: p.bgContainer,
      colorBgElevated: p.bgElevated,
      colorBgSpotlight: p.spotlightBg,
      colorTextLightSolid: p.spotlightText,
      colorFillAlter: p.bgSubtle,
      colorText: p.text,
      colorTextHeading: p.text,
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
      controlOutlineWidth: 2,
      colorBgMask: isDark ? 'rgb(0 0 0 / 0.65)' : 'rgb(15 42 31 / 0.5)',
      fontFamily: FONT_SANS,
      fontFamilyCode: FONT_MONO,
      fontSize: 15,
      fontWeightStrong: 700,
      fontSizeHeading1: 44,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 16,
      lineHeightHeading1: 1.05,
      borderRadius: 14,
      borderRadiusLG: 20,
      borderRadiusSM: 10,
      borderRadiusXS: 6,
      controlHeight,
      controlHeightSM: options.mobile ? 44 : 32,
      controlHeightLG: 48,
      lineHeight: 1.55,
      boxShadowSecondary: isDark
        ? '0 12px 32px rgb(0 0 0 / 0.45)'
        : '0 12px 32px rgb(15 42 31 / 0.14)',
      motion: !options.reducedMotion,
      wireframe: false,
    },
    components: {
      Layout: {
        bodyBg: p.bgLayout,
        headerBg: p.bgLayout,
      },
      Menu: {
        itemBorderRadius: 999,
        itemHeight: 44,
        itemSelectedBg: p.navActiveBg,
        itemSelectedColor: p.navActiveText,
        itemHoverBg: p.primarySurface,
        itemColor: p.text,
        itemBg: 'transparent',
        activeBarBorderWidth: 0,
      },
      Table: {
        headerBg: p.bgContainer,
        headerColor: p.textMuted,
        headerSplitColor: 'transparent',
        rowHoverBg: p.bgSubtle,
        borderColor: p.borderSoft,
        headerBorderRadius: 0,
        cellPaddingBlock: 14,
        cellPaddingInline: 16,
      },
      Button: {
        borderRadius: 999,
        borderRadiusLG: 999,
        borderRadiusSM: 999,
        fontWeight: 700,
        paddingInline: 18,
        paddingInlineLG: 20,
        contentFontSizeLG: 15,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        primaryColor: p.onPrimary,
        defaultBorderColor: p.borderSoft,
        defaultBg: 'transparent',
        defaultColor: p.text,
        defaultHoverBg: p.bgSubtle,
        defaultHoverBorderColor: p.border,
        defaultHoverColor: p.text,
        defaultActiveBg: p.primarySurface,
        defaultActiveBorderColor: p.text,
        defaultActiveColor: p.text,
        textHoverBg: p.bgSubtle,
        onlyIconSize: 18,
      },
      Statistic: {
        titleFontSize: 15,
        contentFontSize: 32,
      },
      Typography: {
        fontWeightStrong: 800,
        titleMarginBottom: 0,
        titleMarginTop: 0,
      },
      Collapse: {
        headerBg: p.bgContainer,
        contentBg: p.bgContainer,
        borderlessContentBg: 'transparent',
      },
      Steps: {
        titleLineHeight: 1.4,
      },
      Tag: {
        defaultBg: p.bgSubtle,
        defaultColor: p.text,
        fontSizeSM: 13,
        borderRadiusSM: 999,
      },
      Segmented: {
        itemSelectedBg: p.navActiveBg,
        itemSelectedColor: p.navActiveText,
        trackBg: p.bgSubtle,
        borderRadius: 999,
        borderRadiusSM: 999,
        borderRadiusLG: 999,
      },
      Alert: {
        borderRadiusLG: 20,
        withDescriptionPadding: '16px 20px',
        defaultPadding: '12px 18px',
      },
      Modal: {
        titleFontSize: 20,
        borderRadiusLG: 28,
      },
      Drawer: {
        borderRadiusLG: 28,
      },
      Progress: {
        defaultColor: p.gainFill,
        remainingColor: p.bgSubtle,
      },
      Tooltip: {
        borderRadius: 10,
      },
    },
  };
}
