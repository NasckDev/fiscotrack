import { Link } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/ui';

const ITEMS: readonly { to: string; label: string; hint: string; icon: IconName }[] = [
  { to: '/darfs', label: 'DARFs', hint: 'Vencimentos e status de pagamento', icon: 'receipt' },
  { to: '/importar', label: 'Importar CSV', hint: 'Traga operações da corretora', icon: 'upload' },
  { to: '/regras', label: 'Regras', hint: 'Premissas e fontes legais', icon: 'rules' },
  { to: '/config', label: 'Configurações', hint: 'Tema, backup e privacidade', icon: 'settings' },
];

/** Menu "Mais" do celular: o que não cabe na barra inferior. */
export function MorePage() {
  return (
    <div>
      <PageHeader title="Mais" />
      <ul className="card divide-y divide-line-soft overflow-hidden">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex min-h-16 items-center gap-3 px-4 py-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-accent-surface text-accent">
                <Icon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{item.label}</span>
                <span className="block text-sm text-muted">{item.hint}</span>
              </span>
              <Icon name="chevron-right" size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
