// O Ant Design usa o id fixo "test-id" quando NODE_ENV=test, o que quebra o nome acessível dos diálogos.
process.env.NODE_ENV = 'development';

import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom não implementa rolagem; o AppShell rola ao topo quando a rota muda.
window.scrollTo = () => undefined;

// As telas são carregadas sob demanda (lazy); em máquinas lentas o primeiro import demora.
configure({ asyncUtilTimeout: 45_000 });

// jsdom não implementa <dialog> modal: simula showModal/close pelo atributo open.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

// jsdom não tem matchMedia. Simula "reduzir movimento" (sem animações de entrada, que deixariam
// elementos com opacidade 0 durante o teste) e um viewport largo (tabelas em vez de cards).
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: query.includes('prefers-reduced-motion') || query.includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

// jsdom não tem ResizeObserver (o Ant Design usa em tabelas, menus e seletores).
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
window.ResizeObserver = ResizeObserverStub;
