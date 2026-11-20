import type { Operation } from '@fiscotrack/engine';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { ToastProvider } from '../src/components/Toasts';
import { OperationsProvider } from '../src/state/OperationsContext';
import {
  createMemoryRepository,
  type OperationsRepository,
} from '../src/storage/operationsRepository';

function renderApp(repository: OperationsRepository, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OperationsProvider repository={repository}>
        <ToastProvider>
          <App />
        </ToastProvider>
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

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('estados', () => {
  it('mostra o aviso educacional e o estado vazio com exemplo em um clique', async () => {
    renderApp(createMemoryRepository());
    expect(screen.getByRole('complementary', { name: 'Aviso educacional' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma operação ainda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carregar exemplo' })).toBeInTheDocument();
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

  it('carrega o exemplo e mostra o início com o próximo DARF', async () => {
    renderApp(createMemoryRepository());
    await userEvent.click(await screen.findByRole('button', { name: 'Carregar exemplo' }));
    expect(await screen.findByRole('region', { name: 'Próximo DARF' })).toBeInTheDocument();
    expect(screen.getByText('Patrimônio investido')).toBeInTheDocument();
  });

  it('sinaliza resultado parcial com plural correto', async () => {
    renderApp(createMemoryRepository([{ ...taxable[1], id: 'sem-posicao' } as Operation]));
    expect(await screen.findByRole('alert')).toHaveTextContent(/1 operação ignorada/);
  });
});

describe('apuração e DARFs', () => {
  it('calcula o mês e explica o DARF', async () => {
    renderApp(createMemoryRepository(taxable), '/apuracao');
    const month = await screen.findByRole('article', { name: /janeiro de 2024/i });
    expect(within(month).getAllByText(/R\$\s750,00/).length).toBeGreaterThan(0);
    expect(within(month).getByRole('progressbar')).toBeInTheDocument();
    await userEvent.click(within(month).getByText('Por que deu esse valor?'));
    expect(within(month).getByText('Imposto (15%)')).toBeVisible();
  });

  it('marca o DARF como pago e permite voltar atrás', async () => {
    const repository = createMemoryRepository(taxable);
    renderApp(repository, '/darfs');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Marcar como pago' }));
    expect(await screen.findByRole('button', { name: 'Marcar como pendente' })).toBeInTheDocument();
    expect(await repository.listPaid()).toEqual(['2024-01']);
  });
});

describe('carteira', () => {
  it('lista a posição e abre o detalhe do ativo', async () => {
    const buyOnly = [taxable[0] as Operation];
    renderApp(createMemoryRepository(buyOnly), '/carteira/PETR4');
    expect(await screen.findByRole('heading', { name: 'PETR4' })).toBeInTheDocument();
    expect(screen.getByText('Preço médio')).toBeInTheDocument();
  });
});

describe('operações', () => {
  it('valida o formulário, adiciona, edita e exclui com desfazer', async () => {
    const repository = createMemoryRepository();
    renderApp(repository, '/operacoes');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Nova operação' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova operação' });
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar operação' }));
    expect(await within(dialog).findByText(/Data inválida/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Data'), '2024-03-15');
    await user.type(within(dialog).getByLabelText('Ativo (ticker)'), 'VALE3');
    await user.type(within(dialog).getByLabelText('Quantidade'), '10');
    await user.type(within(dialog).getByLabelText('Preço unitário (R$)'), '60,00');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar operação' }));
    expect(await screen.findByRole('cell', { name: 'VALE3' })).toBeInTheDocument();
    expect(await repository.list()).toHaveLength(1);

    await user.click(screen.getAllByRole('button', { name: /Excluir operação de VALE3/ })[0]!);
    expect(await repository.list()).toHaveLength(0);
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    expect(await repository.list()).toHaveLength(1);
  });

  it('filtra por ativo', async () => {
    renderApp(createMemoryRepository(taxable), '/operacoes');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Buscar por ativo'), 'VALE');
    expect(await screen.findByText('Nenhuma operação encontrada')).toBeInTheDocument();
  });
});

describe('shell', () => {
  it('dispensa o aviso educacional e lembra a escolha', async () => {
    const user = userEvent.setup();
    const first = renderApp(createMemoryRepository());
    await user.click(screen.getByRole('button', { name: 'Dispensar aviso educacional' }));
    expect(screen.queryByRole('complementary', { name: 'Aviso educacional' })).toBeNull();
    first.unmount();
    renderApp(createMemoryRepository());
    expect(screen.queryByRole('complementary', { name: 'Aviso educacional' })).toBeNull();
  });

  it('alterna o tema e persiste a escolha', async () => {
    renderApp(createMemoryRepository());
    const [toggle] = screen.getAllByRole('button', { name: 'Mudar para tema escuro' });
    await userEvent.click(toggle as HTMLElement);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('fiscotrack-theme')).toBe('dark');
  });

  it('mostra as regras com fontes', async () => {
    renderApp(createMemoryRepository(), '/regras');
    expect(await screen.findByRole('heading', { name: 'Regras e premissas' })).toBeInTheDocument();
  });

  it('exporta e restaura backup pela tela de configurações', async () => {
    renderApp(createMemoryRepository(taxable), '/config');
    expect(await screen.findByRole('button', { name: 'Exportar backup' })).toBeInTheDocument();
    expect(screen.getByLabelText('Arquivo de backup')).toBeInTheDocument();
  });
});
