import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from './App';
import './index.css';
import { OperationsProvider } from './state/OperationsContext';
import { createIndexedDbRepository, createMemoryRepository } from './storage/operationsRepository';
import { AppThemeProvider, ToastProvider } from './ui';

const repository =
  typeof indexedDB === 'undefined' ? createMemoryRepository() : createIndexedDbRepository();

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root não encontrado.');

createRoot(container).render(
  <StrictMode>
    <AppThemeProvider>
      <HashRouter>
        <OperationsProvider repository={repository}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </OperationsProvider>
      </HashRouter>
    </AppThemeProvider>
  </StrictMode>,
);
