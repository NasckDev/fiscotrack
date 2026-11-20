import { Col, Divider, Flex, Grid, Layout, Row, theme } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

type Gap = 'small' | 'middle' | 'large';

interface AppFlexProps {
  readonly children?: ReactNode;
  readonly vertical?: boolean;
  readonly wrap?: boolean;
  readonly gap?: Gap;
  readonly align?: CSSProperties['alignItems'];
  readonly justify?: CSSProperties['justifyContent'];
  /** Ocupa toda a largura disponível. */
  readonly fullWidth?: boolean;
  readonly component?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer' | 'article';
  readonly 'aria-label'?: string;
  readonly role?: string;
}

/** Linha ou coluna flexível com espaçamento da escala do tema. */
export function AppFlex({ fullWidth = false, ...props }: AppFlexProps) {
  return <Flex {...props} style={fullWidth ? { width: '100%' } : undefined} />;
}

/** Pilha vertical com espaçamento padrão entre blocos. */
export function AppStack({
  gap = 'middle',
  ...props
}: Omit<AppFlexProps, 'vertical' | 'fullWidth'>) {
  return <Flex vertical gap={gap} style={{ width: '100%' }} {...props} />;
}

type Span =
  | number
  | {
      readonly xs?: number;
      readonly sm?: number;
      readonly md?: number;
      readonly lg?: number;
      readonly xl?: number;
    };

interface AppRowProps {
  readonly children: ReactNode;
  readonly gutter?: Gap;
  readonly align?: 'top' | 'middle' | 'bottom' | 'stretch';
}

const GUTTERS: Record<Gap, number> = { small: 8, middle: 16, large: 24 };

/** Linha da grade de 24 colunas. */
export function AppRow({ children, gutter = 'middle', align = 'stretch' }: AppRowProps) {
  const size = GUTTERS[gutter];
  return (
    <Row gutter={[size, size]} align={align}>
      {children}
    </Row>
  );
}

interface AppColProps {
  readonly children: ReactNode;
  readonly span?: Span;
  readonly xs?: number;
  readonly sm?: number;
  readonly md?: number;
  readonly lg?: number;
  readonly xl?: number;
}

/** Coluna da grade; `xs`, `sm`, `md`, `lg` e `xl` definem quantas das 24 colunas ocupa. */
export function AppCol({ children, span, ...breakpoints }: AppColProps) {
  const base = typeof span === 'number' ? span : undefined;
  const responsive = typeof span === 'object' ? span : {};
  // Cada coluna é um flex para os cartões filhos poderem ocupar a altura da linha.
  return (
    <Col
      span={base}
      {...responsive}
      {...breakpoints}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </Col>
  );
}

export function AppDivider({ vertical = false }: { readonly vertical?: boolean }) {
  return <Divider orientation={vertical ? 'vertical' : 'horizontal'} />;
}

/** Conteúdo centralizado com largura máxima e margens que crescem com a tela. */
export function AppContainer({ children }: { readonly children: ReactNode }) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const padding = screens.lg ? token.paddingXL : screens.sm ? token.paddingLG : token.padding;
  return <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding }}>{children}</div>;
}

export const AppLayout = Layout;
export const AppLayoutHeader = Layout.Header;
export const AppLayoutContent = Layout.Content;
export const AppLayoutSider = Layout.Sider;

/** Breakpoints atuais do Ant Design (xs, sm, md, lg, xl, xxl). */
export function useBreakpoints() {
  return Grid.useBreakpoint();
}
