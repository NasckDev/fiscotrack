import { NavLink, Route, Routes } from 'react-router';
import { Disclaimer } from './components/Disclaimer';
import { ThemeToggle } from './components/ThemeToggle';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { OperationsPage } from './pages/OperationsPage';
import { RulesPage } from './pages/RulesPage';

const NAV_ITEMS = [
  { to: '/', label: 'Painel' },
  { to: '/operacoes', label: 'Operações' },
  { to: '/importar', label: 'Importar CSV' },
  { to: '/regras', label: 'Regras' },
] as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-4 py-4">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">FiscoTrack</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Resultados de renda variável com regras explicáveis
          </p>
        </div>
        <ThemeToggle />
      </header>
      <nav aria-label="Principal">
        <ul className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end className={navClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Disclaimer />
      <main id="conteudo" tabIndex={-1} className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/operacoes" element={<OperationsPage />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/regras" element={<RulesPage />} />
        </Routes>
      </main>
      <footer className="text-xs text-slate-600 dark:text-slate-400">
        Projeto open source educacional · MIT ·{' '}
        <a href="https://github.com/NasckDev/fiscotrack" className="link">
          Código no GitHub
        </a>
      </footer>
    </div>
  );
}
