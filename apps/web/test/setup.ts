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
