import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import { AppForm, AppFormItem } from './AppForm';
import { AppInput } from './AppInput';

interface Values {
  ticker: string;
}

const meta = {
  title: 'Formulário/AppForm',
  component: AppForm<Values>,
  args: { disabled: false, layout: 'vertical', children: null },
} satisfies Meta<typeof AppForm<Values>>;
export default meta;
type Story = StoryObj<typeof meta>;

const fields = (
  <>
    <AppFormItem
      name="ticker"
      label="Ativo (ticker)"
      rules={[{ required: true, message: 'Informe o ticker, por exemplo PETR4.' }]}
    >
      <AppInput placeholder="PETR4" />
    </AppFormItem>
    <AppButton variant="primary" htmlType="submit">
      Salvar
    </AppButton>
  </>
);

export const Padrao: Story = { render: (args) => <AppForm<Values> {...args}>{fields}</AppForm> };
export const ComErro: Story = {
  render: (args) => (
    <AppForm<Values> {...args}>
      <AppFormItem
        name="ticker"
        label="Ativo (ticker)"
        validateStatus="error"
        help="Informe o ticker, por exemplo PETR4."
      >
        <AppInput />
      </AppFormItem>
    </AppForm>
  ),
};
export const Desabilitado: Story = {
  args: { disabled: true },
  render: (args) => <AppForm<Values> {...args}>{fields}</AppForm>,
};
