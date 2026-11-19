import type { Operation } from '@fiscotrack/engine';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { OperationsProvider } from '../src/state/OperationsContext';
import {
  createMemoryRepository,
  type OperationsRepository,
} from '../src/storage/operationsRepository';

function renderApp(repository: OperationsRepository, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OperationsProvider repository={repository}>
        <App />
      </OperationsProvider>
    </MemoryRouter>,
  );
}

const taxable: readonly Operation[] = [
  {
    id: 'a',
    date: '2024-01-10',
    ticker: 'PETR4',
    side: 'BUY',
    quantity: 1000,
    unitPriceCents: 2000,
    feesCents: 0,
    category: 'SWING',
  },
  {
    id: 'b',
    date: '2024-01-20',
    ticker: 'PETR4',
    side: 'SELL',
    quantity: 1000,
    unitPriceCents: 2500,
    feesCents: 0,
    category: 'SWING',
  },
];

describe('App', () => {
  it('mostra o aviso educacional e o estado vazio', async () => {
    renderApp(createMemoryRepository());
    expect(screen.getByRole('complementary', { name: 'Aviso educacional' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma operação ainda')).toBeInTheDocument();
  });

  it('mostra erro com opção de tentar novamente quando o armazenamento falha', async () => {
    const failing: OperationsRepository = {
      ...createMemoryRepository(),
      list: () => Promise.reject(new Error('IndexedDB bloqueado')),
    };
    renderApp(failing);
    expect(await screen.findByRole('alert')).toHaveTextContent('IndexedDB bloqueado');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('calcula o mês e explica o DARF', async () => {
    renderApp(createMemoryRepository(taxable));
    const month = await screen.findByRole('article', { name: /janeiro de 2024/i });
    expect(within(month).getAllByText(/R\$\s750,00/).length).toBeGreaterThan(0);
    await userEvent.click(within(month).getByText('Por que deu esse valor?'));
    expect(within(month).getByText('Imposto (15%)')).toBeVisible();
  });

  it('oferece a tabela como alternativa ao gráfico', async () => {
    renderApp(createMemoryRepository(taxable));
    await userEvent.click(await screen.findByRole('button', { name: 'Ver como tabela' }));
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: /janeiro de 2024/i })).toBeInTheDocument();
  });

  it('sinaliza resultado parcial quando há operações inválidas', async () => {
    renderApp(createMemoryRepository([{ ...taxable[1], id: 'sem-posicao' } as Operation]));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Resultado parcial/);
  });

  it('valida o formulário manual e adiciona a operação', async () => {
    const repository = createMemoryRepository();
    renderApp(repository, '/operacoes');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Adicionar operação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Data inválida/);

    await user.type(screen.getByLabelText('Data'), '2024-03-15');
    await user.type(screen.getByLabelText('Ticker'), 'VALE3');
    await user.type(screen.getByLabelText('Quantidade'), '10');
    await user.type(screen.getByLabelText('Preço unitário (R$)'), '60,00');
    await user.click(screen.getByRole('button', { name: 'Adicionar operação' }));
    expect(await screen.findByRole('cell', { name: 'VALE3' })).toBeInTheDocument();
    expect(await repository.list()).toHaveLength(1);
  });
});
