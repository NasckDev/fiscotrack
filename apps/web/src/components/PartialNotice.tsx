import type { Report } from '@fiscotrack/engine';
import { Link } from 'react-router';
import { plural } from '../domain/format';
import { Notice } from './ui';

/** Aviso de resultado parcial: lista as operações que o motor não conseguiu apurar. */
export function PartialNotice({ report }: { readonly report: Report }) {
  const count = report.issues.length;
  if (count === 0) return null;
  return (
    <Notice
      tone="warning"
      role="alert"
      title={`Resultado parcial: ${plural(count, 'operação ignorada', 'operações ignoradas')}`}
    >
      <ul className="list-disc pl-5">
        {report.issues.map((issue) => (
          <li key={issue.operationId}>{issue.message}</li>
        ))}
      </ul>
      <p className="mt-1.5">
        Corrija ou lance a operação que falta em{' '}
        <Link to="/operacoes" className="link">
          Operações
        </Link>{' '}
        para completar o cálculo.
      </p>
    </Notice>
  );
}
