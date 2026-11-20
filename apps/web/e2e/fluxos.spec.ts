import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  ['início', '#/'],
  ['carteira', '#/carteira'],
  ['detalhe do ativo', '#/carteira/MGLU3'],
  ['operações', '#/operacoes'],
  ['importar', '#/importar'],
  ['apuração', '#/apuracao'],
  ['DARFs', '#/darfs'],
  ['regras', '#/regras'],
  ['configurações', '#/config'],
] as const;

async function loadExample(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Carregar exemplo' }).click();
  await expect(page.getByRole('region', { name: 'Próximo DARF' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar aviso' }).click();
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) => `${violation.id}: ${violation.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

test('primeira visita: exemplo em um clique, DARF pago e dados persistem após recarregar', async ({
  page,
}) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Marcar como pago' }).click();
  await expect(page.getByText(/marcado como pago/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Próximo DARF' })).toBeVisible();
  await page.goto('./#/darfs');
  await expect(page.getByText('Pago').first()).toBeVisible();
});

test('operações: criar, editar, excluir e desfazer', async ({ page }) => {
  await loadExample(page);
  await page.goto('./#/operacoes');
  await page.getByRole('button', { name: 'Nova operação' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nova operação' });
  await dialog.getByLabel('Data').fill('2026-01-12');
  await dialog.getByLabel('Ativo (ticker)').fill('ABEV3');
  await dialog.getByLabel('Quantidade').fill('100');
  await dialog.getByLabel('Preço unitário (R$)').fill('12,40');
  await dialog.getByRole('button', { name: 'Adicionar operação' }).click();
  await expect(page.getByText('Operação adicionada.')).toBeVisible();

  await page.getByLabel('Buscar por ativo').fill('ABEV3');
  await page
    .getByRole('button', { name: /Editar operação de ABEV3/ })
    .first()
    .click();
  const edit = page.getByRole('dialog', { name: 'Editar operação' });
  await edit.getByLabel('Quantidade').fill('150');
  await edit.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Operação atualizada.')).toBeVisible();

  await page
    .getByRole('button', { name: /Excluir operação de ABEV3/ })
    .first()
    .click();
  await expect(page.getByText('Nenhuma operação encontrada')).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(
    page.getByRole('button', { name: /Editar operação de ABEV3/ }).first(),
  ).toBeVisible();
});

test('paleta de comandos e atalhos de teclado', async ({ page, isMobile }) => {
  test.skip(isMobile, 'atalhos de teclado são de desktop');
  await loadExample(page);
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Paleta de comandos' });
  await palette.getByRole('combobox').fill('apura');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/apuracao$/);
  await page.keyboard.press('g');
  await page.keyboard.press('d');
  await expect(page).toHaveURL(/#\/darfs$/);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeHidden();
});

test('rota interna recarrega e o botão voltar funciona', async ({ page }) => {
  await loadExample(page);
  await page.goto('./#/regras');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Regras e premissas' })).toBeVisible();
  await page.goto('./#/config');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Regras e premissas' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`acessibilidade (axe) em todas as telas, tema ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await loadExample(page);
    for (const [, hash] of ROUTES) {
      await page.goto(`./${hash}`);
      await page.waitForTimeout(900);
      await expectNoAxeViolations(page);
    }
  });
}
