import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppFlex } from './AppLayout';
import { AppIcon, APP_ICON_NAMES, type AppIconName } from './AppIcon';
import { AppText } from './AppTypography';

const meta = {
  title: 'Base/AppIcon',
  component: AppIcon,
  args: { name: 'wallet', size: 20 },
  argTypes: { name: { control: 'select', options: APP_ICON_NAMES } },
} satisfies Meta<typeof AppIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Todos: Story = {
  render: (args) => (
    <AppFlex wrap gap="large">
      {APP_ICON_NAMES.map((name: AppIconName) => (
        <AppFlex key={name} vertical align="center" gap="small">
          <AppIcon {...args} name={name} />
          <AppText type="secondary">{name}</AppText>
        </AppFlex>
      ))}
    </AppFlex>
  ),
};
