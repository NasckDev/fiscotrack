import { theme } from 'antd';
import { NavLink } from 'react-router';
import { AppIcon, type AppIconName } from './AppIcon';
import { useAppColors } from './theme/AppThemeProvider';

export interface AppTabBarItem {
  readonly to: string;
  readonly label: string;
  readonly icon: AppIconName;
}

interface AppTabBarProps {
  readonly items: readonly AppTabBarItem[];
  readonly 'aria-label': string;
}

/**
 * Barra de navegação inferior do celular, flutuante e arredondada como a barra superior: alvos de
 * 56 px, aba ativa com a pílula em tinta e área segura do aparelho respeitada.
 */
export function AppTabBar({ items, ...props }: AppTabBarProps) {
  const { token } = theme.useToken();
  const colors = useAppColors();
  return (
    <nav
      {...props}
      className="ft-tabbar"
      style={{
        position: 'fixed',
        insetInline: 10,
        bottom: 'calc(10px + env(safe-area-inset-bottom))',
        zIndex: 100,
        display: 'flex',
        padding: 4,
        borderRadius: 28,
        background: colors.bgContainer,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: token.boxShadowSecondary,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: isActive ? 800 : 600,
            textDecoration: 'none',
            borderRadius: 22,
            color: isActive ? colors.text : colors.textMuted,
            transition: `color ${token.motionDurationFast}`,
          })}
        >
          {({ isActive }) => (
            <>
              <span
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? colors.navActiveBg : 'transparent',
                  color: isActive ? colors.navActiveText : 'inherit',
                }}
              >
                <AppIcon name={item.icon} />
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
