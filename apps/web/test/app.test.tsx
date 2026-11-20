import type { Operation } from '@fiscotrack/engine';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { ToastProvider } from '../src/components/Toasts';
import { serializeBackup } from '../src/domain/backup';
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
    seq: 1,
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
    seq: 2,
    date: '2024-01-20',
    ticker: 'PETR4',
    side: 'SELL',
    quantity: 1000,
    unitPriceCents: 2500,
    feesCents: 0,
    category: 'SWING',
  },
];

/** Repositório que falha nas gravações, para testar o aviso de erro. */
function failingWrites(base: OperationsRepository): OperationsRepository {
  const fail = () => Promise.reject(new DOMException('cheio', 'QuotaExceededError'));
  return { ...base, addMany: fail, remove: fail, markPaid: fail };
}

beforeEach(() => {
  // Por padrão, não é a primeira visita (o exemplo não carrega sozinho).
  localStorage.setItem('fiscotrack-visited', '1');
  localStorage.setItem('fiscotrack-last-backup', new Date().toISOString());
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('primeira visita', () => {
  it('carrega o exemplo sozinho e mostra o selo "Dados de exemplo"', async () => {
    localStorage.removeItem('fiscotrack-visited');
    renderApp(createMemoryRepository());
    expect(await screen.findByRole('region', { name: 'Próximo DARF' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Dados de exemplo' })).toBeInTheDocument();
    expect(localStorage.getItem('fiscotrack-visited')).toBe('1');
  });

  it('"Começar com meus dados" remove o exemplo com confirmação e permite desfazer', async () => {
    localStorage.removeItem('fiscotrack-visited');
    const repository = createMemoryRepository();
    renderApp(repository);
    const user = userEvent.setup();
    await screen.findByRole('region', { name: 'Próximo DARF' });
    await user.click(screen.getByRole('button', { name: 'Começar com meus dados' }));
    await user.click(await screen.findByRole('button', { name: 'Remover exemplo' }));
    expect(await screen.findByText('Nenhuma operação ainda')).toBeInTheDocument();
    expect(await repository.list()).toHaveLength(0);
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(async () => expect((await repository.list()).length).toBeGreaterThan(0));
  });

  it('quem já visitou e apagou tudo não recebe o exemplo de novo', async () => {
    renderApp(createMemoryRepository());
    expect(await screen.findByText('Nenhuma operação ainda')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Dados de exemplo' })).toBeNull();
  });
});

describe('estados', () => {
  it('mostra o aviso educacional, o estado vazio e um único h1', async () => {
    renderApp(createMemoryRepository());
    expect(screen.getByRole('complementary', { name: 'Aviso educacional' })).toBeInTheDocument();
    expect(await screen.findByText('Nenhuma operação ainda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carregar exemplo' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
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

  it('"Tentar novamente" recarrega quando o armazenamento volta', async () => {
    let shouldFail = true;
    const base = createMemoryRepository(taxable);
    const flaky: OperationsRepository = {
      ...base,
      list: () => (shouldFail ? Promise.reject(new Error('falhou')) : base.list()),
    };
    renderApp(flaky);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    shouldFail = false;
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'Próximo DARF' })).toBeInTheDocument();
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

  it('marca o DARF como pago guardando o valor e permite desfazer', async () => {
    const repository = createMemoryRepository(taxable);
    renderApp(repository, '/darfs');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Marcar como pago' }));
    expect(await screen.findByRole('button', { name: 'Marcar como pendente' })).toBeInTheDocument();
    expect(await repository.listPaid()).toEqual([{ month: '2024-01', amountCents: 75000 }]);
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(async () => expect(await repository.listPaid()).toEqual([]));
  });

  it('volta a pendente, com aviso, quando o valor apurado mudou desde o pagamento', async () => {
    renderApp(createMemoryRepository(taxable, [{ month: '2024-01', amountCents: 1 }]), '/darfs');
    expect(await screen.findByText(/O valor mudou desde o pagamento/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como pago' })).toBeInTheDocument();
  });

  it('avisa quando a gravação falha, sem fingir que deu certo', async () => {
    renderApp(failingWrites(createMemoryRepository(taxable)), '/darfs');
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar como pago' }));
    expect(await screen.findByText(/Armazenamento cheio/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como pendente' })).toBeNull();
  });
});

describe('carteira', () => {
  it('abre o detalhe do ativo e oferece lançar nova operação', async () => {
    renderApp(createMemoryRepository([taxable[0] as Operation]), '/carteira/PETR4');
    expect(await screen.findByRole('heading', { level: 1, name: 'PETR4' })).toBeInTheDocument();
    expect(screen.getByText('Preço médio')).toBeInTheDocument();
    expect(screen.getByText(/aparece a partir da 2ª operação/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nova operação de PETR4/ })).toBeInTheDocument();
  });
});

describe('operações', () => {
  it('valida com mensagens acionáveis, adiciona, edita e exclui com desfazer', async () => {
    const repository = createMemoryRepository();
    renderApp(repository, '/operacoes');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Nova operação' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova operação' });
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar operação' }));
    expect(await within(dialog).findByText(/Informe a data/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Informe o ticker, por exemplo PETR4/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Data')).toHaveFocus();

    await user.type(within(dialog).getByLabelText('Data'), '2024-03-15');
    await user.type(within(dialog).getByLabelText('Ativo (ticker)'), 'VALE3');
    await user.type(within(dialog).getByLabelText('Quantidade'), '1.000');
    await user.type(within(dialog).getByLabelText('Preço unitário (R$)'), '60,00');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar operação' }));
    expect(await screen.findByRole('cell', { name: 'VALE3' })).toBeInTheDocument();
    const [saved] = await repository.list();
    expect(saved).toMatchObject({ quantity: 1000, ticker: 'VALE3' });
    expect(typeof saved?.seq).toBe('number');

    await user.click(screen.getAllByRole('button', { name: /Excluir operação de VALE3/ })[0]!);
    expect(await repository.list()).toHaveLength(0);
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(async () => expect(await repository.list()).toHaveLength(1));
  });

  it('mostra o erro de gravação dentro do diálogo e mantém o que foi digitado', async () => {
    renderApp(failingWrites(createMemoryRepository()), '/operacoes?nova=1');
    const user = userEvent.setup();
    const dialog = await screen.findByRole('dialog', { name: 'Nova operação' });
    await user.type(within(dialog).getByLabelText('Data'), '2024-03-15');
    await user.type(within(dialog).getByLabelText('Ativo (ticker)'), 'VALE3');
    await user.type(within(dialog).getByLabelText('Quantidade'), '10');
    await user.type(within(dialog).getByLabelText('Preço unitário (R$)'), '60,00');
    await user.click(within(dialog).getByRole('button', { name: 'Adicionar operação' }));
    expect(await within(dialog).findByText(/Não foi possível salvar/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Ativo (ticker)')).toHaveValue('VALE3');
  });

  it('apagar tudo e desfazer não apaga o que foi criado depois', async () => {
    const repository = createMemoryRepository(taxable);
    renderApp(repository, '/operacoes');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Apagar todas' }));
    await user.click(await screen.findByRole('button', { name: 'Apagar tudo' }));
    await waitFor(async () => expect(await repository.list()).toHaveLength(0));
    const later: Operation = { ...taxable[0]!, id: 'depois', ticker: 'VALE3' };
    await repository.addMany([later]);
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(async () => expect(await repository.list()).toHaveLength(3));
  });

  it('filtra por ativo', async () => {
    renderApp(createMemoryRepository(taxable), '/operacoes');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Buscar por ativo'), 'VALE');
    expect(await screen.findByText('Nenhuma operação encontrada')).toBeInTheDocument();
  });

  it('pagina a lista em blocos de 50', async () => {
    const many: Operation[] = Array.from({ length: 120 }, (_, index) => ({
      ...taxable[0]!,
      id: `m-${index}`,
      seq: index,
    }));
    renderApp(createMemoryRepository(many), '/operacoes');
    expect(await screen.findByText(/1–50 de 120 operações/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText(/51–100 de 120 operações/)).toBeInTheDocument();
  });
});

describe('importação', () => {
  const csv = [
    'Data da operação;Ativo;C/V;Qtd;Preço unitário',
    '12/01/2024;itub4;C;1.000;31,40',
    '19/01/2024;ITUB4;X;100;33,10',
  ].join('\n');

  it('mapeia colunas, mostra prévia, deixa corrigir a linha com erro e importa', async () => {
    const repository = createMemoryRepository();
    renderApp(repository, '/importar');
    const user = userEvent.setup();
    await user.upload(
      await screen.findByLabelText('Arquivo CSV'),
      new File([csv], 'corretora.csv', { type: 'text/csv' }),
    );
    expect(await screen.findByText(/Revise a prévia/)).toBeInTheDocument();
    expect(screen.getByText(/1 operação pronta/)).toBeInTheDocument();
    const fix = screen.getByLabelText('Corrigir a linha 3');
    await user.clear(fix);
    await user.type(fix, '19/01/2024;ITUB4;V;100;33,10');
    expect(await screen.findByText(/2 operações prontas/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Importar 2 operações' }));
    expect(await screen.findByText('2 operações importadas')).toBeInTheDocument();
    const saved = await repository.list();
    expect(saved).toHaveLength(2);
    expect(saved.find((operation) => operation.side === 'BUY')).toMatchObject({ quantity: 1000 });
  });

  it('avisa sobre possíveis repetidas e as ignora por padrão', async () => {
    const existing: Operation = {
      ...taxable[0]!,
      id: 'manual-1',
      date: '2024-01-12',
      ticker: 'ITUB4',
      quantity: 1000,
      unitPriceCents: 3140,
    };
    renderApp(createMemoryRepository([existing]), '/importar');
    const user = userEvent.setup();
    await user.upload(
      await screen.findByLabelText('Arquivo CSV'),
      new File([csv], 'corretora.csv', { type: 'text/csv' }),
    );
    expect(await screen.findByText(/1 possível repetida/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('recusa arquivo vazio com instrução', async () => {
    renderApp(createMemoryRepository(), '/importar');
    await userEvent.upload(
      await screen.findByLabelText('Arquivo CSV'),
      new File([''], 'vazio.csv', { type: 'text/csv' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/está vazio/);
  });
});

describe('configurações e backup', () => {
  it('restaura um backup só depois de confirmar, e permite desfazer', async () => {
    const repository = createMemoryRepository(taxable);
    renderApp(repository, '/config');
    const user = userEvent.setup();
    const backup = serializeBackup({ operations: [{ ...taxable[0]!, id: 'novo' }], paidDarfs: [] });
    await user.upload(
      await screen.findByLabelText('Arquivo de backup'),
      new File([backup], 'backup.json', { type: 'application/json' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Restaurar este backup?' });
    expect(dialog).toHaveTextContent('substitui 2 operações');
    expect(dialog).toHaveTextContent('por 1 operação do arquivo');
    expect(await repository.list()).toHaveLength(2);
    await user.click(within(dialog).getByRole('button', { name: 'Substituir dados' }));
    await waitFor(async () => expect((await repository.list()).map((o) => o.id)).toEqual(['novo']));
    await user.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(async () => expect(await repository.list()).toHaveLength(2));
  });

  it('explica por que um arquivo não é um backup válido', async () => {
    renderApp(createMemoryRepository(), '/config');
    await userEvent.upload(
      await screen.findByLabelText('Arquivo de backup'),
      new File(['{"app":"outro"}'], 'x.json', { type: 'application/json' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/não é um backup do FiscoTrack/);
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

  it('abre a paleta com o foco no campo de busca e filtra ao digitar', async () => {
    renderApp(createMemoryRepository());
    const user = userEvent.setup();
    await user.keyboard('{Control>}k{/Control}');
    const palette = await screen.findByRole('dialog', { name: 'Paleta de comandos' });
    const input = within(palette).getByRole('combobox');
    expect(input).toHaveFocus();
    await user.keyboard('regr');
    expect(within(palette).getAllByRole('option')).toHaveLength(1);
  });

  it('mostra as regras com fontes', async () => {
    renderApp(createMemoryRepository(), '/regras');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Regras e premissas' }),
    ).toBeInTheDocument();
  });
});
