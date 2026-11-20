import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { SkeletonBlock } from './components/ui';

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
const MorePage = lazy(() => import('./pages/MorePage').then((m) => ({ default: m.MorePage })));

function RouteFallback() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-4" aria-hidden="true">
        <SkeletonBlock className="h-10 w-56" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppShell>
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
          <Route path="/mais" element={<MorePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
