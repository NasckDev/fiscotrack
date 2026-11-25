import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

const BROKER_CSV = [
  'Data da operação;Ativo;C/V;Qtd;Preço unitário',
  '12/01/2026;ABEV3;C;1.000;31,40',
  '19/01/2026;ABEV3;X;100;33,10',
].join('\n');

/** Primeira visita: o exemplo carrega sozinho. */
async function openWithExample(page: Page) {
  await page.goto('./');
  await expect(page.getByRole('region', { name: 'Próximo DARF' })).toBeVisible();
  await page
    .getByRole('complementary', { name: 'Aviso educacional' })
    .getByRole('button', { name: 'Dispensar aviso' })
    .click();
}

async function gotoRoute(page: Page, hash: string) {
  await page.goto(`./${hash}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Espera as animações de entrada terminarem: o axe mede contraste com opacidade parcial. */
async function settle(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.effect?.getTiming().iterations === Infinity ||
          animation.playState !== 'running',
      ),
  );
  // Os gráficos (ECharts) animam por requestAnimationFrame, fora da API de animações do navegador.
  await page.waitForTimeout(1200);
}

async function expectNoAxeViolations(page: Page) {
  await settle(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) => `${violation.id}: ${violation.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

test('primeira visita: exemplo automático com selo, DARF pago e dados persistem ao recarregar', async ({
  page,
}) => {
  await openWithExample(page);
  await expect(page.getByRole('region', { name: 'Dados de exemplo' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como pago' }).click();
  await expect(page.getByText(/marcado como pago/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Próximo DARF' })).toBeVisible();
  await gotoRoute(page, '#/darfs');
  await expect(page.getByText('Pago').first()).toBeVisible();
});

test('"Começar com meus dados" remove o exemplo e ele não volta ao recarregar', async ({
  page,
}) => {
  await openWithExample(page);
  await page.getByRole('button', { name: 'Começar com meus dados' }).click();
  await page.getByRole('button', { name: 'Remover exemplo' }).click();
  await expect(page.getByText('Nenhuma operação ainda')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Nenhuma operação ainda')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dados de exemplo' })).toBeHidden();
});

test('operações: criar, editar, excluir e desfazer', async ({ page }) => {
  await openWithExample(page);
  await gotoRoute(page, '#/operacoes');
  await page.getByRole('button', { name: 'Nova operação' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nova operação' });
  await expect(dialog.getByLabel('Ativo (ticker)')).toBeFocused();
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

test('importação: mapeia colunas, corrige a linha com erro e importa', async ({ page }) => {
  await openWithExample(page);
  await gotoRoute(page, '#/importar');
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'corretora.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(BROKER_CSV),
    });
  await expect(page.getByText(/Revise a prévia/)).toBeVisible();
  await page.getByLabel('Corrigir a linha 3').fill('19/01/2026;ABEV3;V;100;33,10');
  await expect(page.getByText(/2 operações prontas/)).toBeVisible();
  await page.getByRole('button', { name: 'Importar 2 operações' }).click();
  await expect(page.getByText('2 operações importadas')).toBeVisible();
  await gotoRoute(page, '#/operacoes');
  await page.getByLabel('Buscar por ativo').fill('ABEV3');
  await expect(page.getByText(/de 2 operações/)).toBeVisible();
});

test('backup: exporta, apaga tudo com confirmação e restaura com confirmação', async ({
  page,
}, testInfo) => {
  await openWithExample(page);
  await gotoRoute(page, '#/config');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const file = testInfo.outputPath('backup.json');
  await (await download).saveAs(file);

  await page.getByRole('button', { name: 'Apagar todos os dados' }).click();
  await page.getByRole('button', { name: 'Apagar tudo' }).click();
  await expect(page.getByText('Dados apagados deste navegador.')).toBeVisible();

  await page.getByLabel('Arquivo de backup').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: readFileSync(file),
  });
  const dialog = page.getByRole('dialog', { name: 'Restaurar este backup?' });
  await expect(dialog).toContainText('substitui 0 operações');
  await dialog.getByRole('button', { name: 'Substituir dados' }).click();
  await expect(page.getByText(/Backup restaurado: 14 operações/)).toBeVisible();
});

test('paleta de comandos e atalhos de teclado', async ({ page, isMobile }) => {
  test.skip(isMobile, 'atalhos de teclado são de desktop');
  await openWithExample(page);
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Paleta de comandos' });
  await expect(palette.getByRole('combobox')).toBeFocused();
  await page.keyboard.type('apura');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/apuracao$/);
  await expect(palette).toBeHidden();
  await page.keyboard.press('g');
  await page.keyboard.press('d');
  await expect(page).toHaveURL(/#\/darfs$/);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeHidden();
});

test('celular: DARFs na barra inferior e menu do header com Configurações', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'só no celular');
  await openWithExample(page);
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'DARFs' })
    .click();
  await expect(page).toHaveURL(/#\/darfs$/);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page
    .getByRole('dialog', { name: 'Menu' })
    .getByRole('menuitem', { name: /Configurações/ })
    .click();
  await expect(page).toHaveURL(/#\/config$/);
});

test('rota interna recarrega e o botão voltar funciona', async ({ page }) => {
  await openWithExample(page);
  await gotoRoute(page, '#/regras');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Regras e premissas' })).toBeVisible();
  await gotoRoute(page, '#/config');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Regras e premissas' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`acessibilidade (axe) em todas as telas, tema ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openWithExample(page);
    for (const [, hash] of ROUTES) {
      await gotoRoute(page, hash);
      await expectNoAxeViolations(page);
    }
  });

  test(`acessibilidade (axe) com diálogo aberto e estado vazio, tema ${theme}`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openWithExample(page);
    await gotoRoute(page, '#/operacoes');
    await page.getByRole('button', { name: 'Nova operação' }).click();
    await expect(page.getByRole('dialog', { name: 'Nova operação' })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.keyboard.press('Escape');
    if (!isMobile) {
      await page.keyboard.press('Control+k');
      await expect(page.getByRole('dialog', { name: 'Paleta de comandos' })).toBeVisible();
      await expectNoAxeViolations(page);
      await page.keyboard.press('Escape');
    }
    await gotoRoute(page, '#/config');
    await page.getByRole('button', { name: 'Apagar todos os dados' }).click();
    await page.getByRole('button', { name: 'Apagar tudo' }).click();
    await gotoRoute(page, '#/');
    await expect(page.getByText('Nenhuma operação ainda')).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

/** Geometria dos diálogos: o painel e o botão de salvar cabem na tela, sem cortes. */
async function expectInsideViewport(page: Page, locator: ReturnType<Page['locator']>) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();
  expect(box, 'elemento visível').not.toBeNull();
  if (box === null || viewport === null) return;
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.y).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
}

test('geometria: diálogos cabem na tela e o foco volta para quem abriu', async ({ page }) => {
  await openWithExample(page);
  await gotoRoute(page, '#/operacoes');
  const opener = page.getByRole('button', { name: 'Nova operação' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Nova operação' });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(500);
  await expectInsideViewport(page, dialog);
  await expectInsideViewport(page, dialog.getByRole('button', { name: 'Adicionar operação' }));
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await page.getByRole('button', { name: 'Apagar todas' }).click();
  const confirm = page.getByRole('dialog', { name: 'Apagar todas as operações?' });
  await expect(confirm).toBeVisible();
  await page.waitForTimeout(500);
  await expectInsideViewport(page, confirm);
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
});

/** Larguras exigidas: nada pode rolar na horizontal (tabelas largas rolam dentro da própria caixa). */
const WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440, 1920] as const;

for (const theme of ['light', 'dark'] as const) {
  test(`layout: sem rolagem horizontal em 320 a 1920 px em todas as telas, tema ${theme}`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openWithExample(page);
    const overflow: string[] = [];
    for (const [name, hash] of ROUTES) {
      await gotoRoute(page, hash);
      // No projeto do celular (toque, alvos de 44 px) só as larguras de celular.
      for (const width of isMobile ? WIDTHS.filter((value) => value <= 390) : WIDTHS) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.waitForTimeout(150);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        if (scrollWidth > clientWidth)
          overflow.push(`${name} em ${width} px: ${scrollWidth} > ${clientWidth}`);
      }
    }
    expect(overflow).toEqual([]);
  });
}
