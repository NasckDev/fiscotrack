import { Link } from 'react-router';
import { useExampleLoader } from '../state/useExampleLoader';
import { Icon } from './Icon';
import { useToasts } from './Toasts';

function Illustration() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="100" cy="126" rx="78" ry="8" fill="var(--ft-color-accent-surface)" />
      <rect x="22" y="16" width="156" height="104" rx="18" fill="var(--ft-color-accent-surface)" />
      <rect
        x="36"
        y="30"
        width="128"
        height="76"
        rx="12"
        fill="var(--ft-card)"
        stroke="var(--ft-border-soft)"
      />
      <rect x="48" y="42" width="44" height="6" rx="3" fill="var(--ft-color-skeleton)" />
      <rect x="48" y="54" width="28" height="4" rx="2" fill="var(--ft-color-skeleton)" />
      <rect x="52" y="76" width="14" height="20" rx="4" fill="var(--ft-chart-gain)" opacity="0.4" />
      <rect
        x="74"
        y="66"
        width="14"
        height="30"
        rx="4"
        fill="var(--ft-chart-gain)"
        opacity="0.65"
      />
      <rect x="96" y="72" width="14" height="24" rx="4" fill="var(--ft-chart-loss)" opacity="0.7" />
      <rect x="118" y="54" width="14" height="42" rx="4" fill="var(--ft-chart-gain)" />
      <circle cx="148" cy="46" r="8" fill="var(--ft-chart-darf)" />
      <path
        d="M144.5 46l2.4 2.4 4.2-4.6"
        stroke="var(--ft-card)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Primeira visita ou sem dados: o exemplo carrega com um clique. */
export function EmptyState() {
  const { load, isWorking, hasFailed } = useExampleLoader();
  const toasts = useToasts();

  const handleLoad = async () => {
    if (await load()) toasts.show('Exemplo carregado. Todos os dados são fictícios.');
  };

  return (
    <section
      aria-labelledby="vazio-titulo"
      className="card mx-auto flex max-w-xl flex-col items-center px-5 py-10 text-center sm:px-10 sm:py-14"
    >
      <Illustration />
      <h2 id="vazio-titulo" className="mt-6 text-2xl font-extrabold tracking-tight">
        Nenhuma operação ainda
      </h2>
      <p className="mt-2 max-w-md text-muted">
        Veja o FiscoTrack funcionando com operações de exemplo (dados fictícios) ou traga as suas:
        importe um CSV ou lance uma operação. Tudo fica só neste navegador.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isWorking}
          onClick={() => void handleLoad()}
        >
          <Icon name="sparkles" size={16} />
          {isWorking ? 'Carregando…' : 'Carregar exemplo'}
        </button>
        <Link to="/importar" className="btn btn-secondary">
          <Icon name="upload" size={16} />
          Importar CSV
        </Link>
        <Link to="/operacoes?nova=1" className="btn btn-ghost">
          Lançar operação
        </Link>
      </div>
      {hasFailed && (
        <p role="alert" className="mt-4 text-sm text-danger">
          Não foi possível carregar o exemplo. Tente de novo.
        </p>
      )}
    </section>
  );
}
