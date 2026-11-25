import { calculateReport, type Operation } from '@fiscotrack/engine';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { todayIso, type DarfEntry } from '../domain/darf';
import { NextDarfCard } from './NextDarfCard';
import { ReceiptCard } from './ReceiptCard';

/** Data `dias` a partir de hoje (AAAA-MM-DD), para o selo de prazo ficar estável na story. */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

const pending: DarfEntry = {
  month: '2026-10',
  dueDate: inDays(5),
  amountCents: 62_741,
  paid: false,
  amountChanged: false,
};

const OPERATIONS: readonly Operation[] = [
  {
    id: 'c',
    seq: 1,
    date: '2026-10-02',
    ticker: 'VALE3',
    side: 'BUY',
    quantity: 600,
    unitPriceCents: 5_700,
    feesCents: 590,
    category: 'SWING',
  },
  {
    id: 'v',
    seq: 2,
    date: '2026-10-15',
    ticker: 'VALE3',
    side: 'SELL',
    quantity: 600,
    unitPriceCents: 6_400,
    feesCents: 890,
    category: 'SWING',
  },
];
const MONTH = calculateReport(OPERATIONS).months[0];

const meta = {
  title: 'Identidade/Cartões do início',
  component: NextDarfCard,
  args: { darfs: [pending], onMarkPaid: () => undefined, onExplain: () => undefined },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NextDarfCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProximoDarf: Story = {};
export const DarfVencido: Story = {
  args: { darfs: [{ ...pending, dueDate: inDays(-2) }] },
};
export const NadaAPagar: Story = { args: { darfs: [] } };
export const ValorLongo: Story = {
  args: { darfs: [{ ...pending, amountCents: 1_234_567 }] },
};
export const Recibo: Story = {
  render: () => (MONTH ? <ReceiptCard month={MONTH} /> : <p>Sem mês apurado.</p>),
};
