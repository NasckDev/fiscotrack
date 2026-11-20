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

/** Barra de navegação inferior do celular: alvos de 44 px ou mais e área segura do aparelho. */
export function AppTabBar({ items, ...props }: AppTabBarProps) {
  const { token } = theme.useToken();
  const colors = useAppColors();
  return (
    <nav
      {...props}
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        background: colors.bgContainer,
        borderTop: `1px solid ${colors.borderSoft}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            minHeight: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 600,
            textDecoration: 'none',
            color: isActive ? colors.primary : colors.textMuted,
            borderTop: `3px solid ${isActive ? colors.primary : 'transparent'}`,
            transition: `color ${token.motionDurationFast}`,
          })}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>
            <AppIcon name={item.icon} />
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
