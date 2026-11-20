import type { Report } from '@fiscotrack/engine';
import { plural } from '../domain/format';
import { AppAlert, AppLink } from '../ui';

/** Aviso de resultado parcial: lista as operações que o motor não conseguiu apurar. */
export function PartialNotice({ report }: { readonly report: Report }) {
  const count = report.issues.length;
  if (count === 0) return null;
  return (
    <AppAlert
      tone="warning"
      role="alert"
      title={`Resultado parcial: ${plural(count, 'operação ignorada', 'operações ignoradas')}`}
    >
      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
        {report.issues.map((issue) => (
          <li key={issue.operationId}>{issue.message}</li>
        ))}
      </ul>
      <span>
        Corrija ou lance a operação que falta em <AppLink to="/operacoes">Operações</AppLink> para
        completar o cálculo.
      </span>
    </AppAlert>
  );
}
