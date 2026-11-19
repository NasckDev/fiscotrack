import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from './App';
import './index.css';
import { OperationsProvider } from './state/OperationsContext';
import {
  createIndexedDbRepository,
  createMemoryRepository,
} from './storage/operationsRepository';

const repository =
  typeof indexedDB === 'undefined' ? createMemoryRepository() : createIndexedDbRepository();

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root não encontrado.');

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <OperationsProvider repository={repository}>
        <App />
      </OperationsProvider>
    </HashRouter>
  </StrictMode>,
);
