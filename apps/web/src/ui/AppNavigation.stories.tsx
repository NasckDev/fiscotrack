import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppBreadcrumb, AppDropdown, AppMenu, AppTabs, type AppMenuItem } from './AppMisc';

const items: readonly AppMenuItem[] = [
  { key: 'home', label: 'Início', icon: 'home' },
  { key: 'wallet', label: 'Carteira', icon: 'wallet' },
  { key: 'ops', label: 'Operações', icon: 'operations' },
  { key: 'danger', label: 'Apagar dados', icon: 'trash', danger: true, dividerBefore: true },
];

const meta = {
  title: 'Navegação/AppMenu, AppDropdown, AppBreadcrumb e AppTabs',
  component: AppMenu,
  args: { items, selectedKey: 'wallet', theme: 'light', collapsed: false },
  argTypes: { theme: { control: 'inline-radio', options: ['light', 'dark'] } },
} satisfies Meta<typeof AppMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Menu: Story = {};
export const MenuRecolhido: Story = { args: { collapsed: true } };
export const MenuSuspenso: Story = {
  render: () => (
    <AppDropdown items={items}>
      <AppButton icon="more">Mais ações</AppButton>
    </AppDropdown>
  ),
};
export const Trilha: Story = {
  render: () => (
    <AppBreadcrumb
      items={[
        { label: 'Início', to: '/' },
        { label: 'Carteira', to: '/carteira' },
        { label: 'PETR4' },
      ]}
    />
  ),
};
export const Abas: Story = {
  render: () => (
    <AppTabs
      items={[
        { key: 'a', label: 'Comum', children: 'Operações comuns' },
        { key: 'b', label: 'Day trade', children: 'Operações de day trade' },
      ]}
    />
  ),
};
