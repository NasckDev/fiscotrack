import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { RouteErrorBoundary } from './components/ErrorBoundary';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const PortfolioPage = lazy(() =>
  import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })),
);
const AssetPage = lazy(() => import('./pages/AssetPage').then((m) => ({ default: m.AssetPage })));
const OperationsPage = lazy(() =>
  import('./pages/OperationsPage').then((m) => ({ default: m.OperationsPage })),
);
const ImportPage = lazy(() =>
  import('./pages/ImportPage').then((m) => ({ default: m.ImportPage })),
);
const TaxPage = lazy(() => import('./pages/TaxPage').then((m) => ({ default: m.TaxPage })));
const DarfsPage = lazy(() => import('./pages/DarfsPage').then((m) => ({ default: m.DarfsPage })));
const RulesPage = lazy(() => import('./pages/RulesPage').then((m) => ({ default: m.RulesPage })));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function RouteFallback() {
  return (
    <div role="status" aria-live="polite" style={{ padding: 24 }}>
      Carregando…
    </div>
  );
}

export function App() {
  return (
    <AppShell>
      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carteira" element={<PortfolioPage />} />
            <Route path="/carteira/:ticker" element={<AssetPage />} />
            <Route path="/operacoes" element={<OperationsPage />} />
            <Route path="/importar" element={<ImportPage />} />
            <Route path="/apuracao" element={<TaxPage />} />
            <Route path="/darfs" element={<DarfsPage />} />
            <Route path="/regras" element={<RulesPage />} />
            <Route path="/config" element={<SettingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AppShell>
  );
}
