import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  /** Valor final (em unidades do `format`, por exemplo centavos). */
  readonly value: number;
  readonly format: (value: number) => string;
  readonly className?: string;
}

const DURATION_SECONDS = 0.8;

/** Contador que sobe até o valor; sem animação quando o usuário prefere menos movimento. */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion() ?? true;
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const controls = animate(0, value, {
      duration: DURATION_SECONDS,
      ease: [0.2, 0, 0, 1],
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return <span className={className}>{format(reduceMotion ? value : shown)}</span>;
}
