import { useEffect, useState } from 'react';
import { useReducedMotion } from './theme/AppThemeProvider';

const DURATION_MS = 800;

/** Contador que sobe até o valor; sem animação quando o usuário prefere menos movimento. */
export function useCountUp(target: number, enabled: boolean): number {
  const reduced = useReducedMotion();
  const skip = reduced || !enabled;
  const [shown, setShown] = useState(skip ? target : 0);

  useEffect(() => {
    if (skip) return undefined;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, skip]);

  return skip ? target : shown;
}
