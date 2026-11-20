import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

const STEP_SECONDS = 0.06;

interface RevealProps {
  /** Posição na sequência; define o atraso da entrada escalonada. */
  readonly index?: number;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Entrada com fade + leve subida; desligada com prefers-reduced-motion. */
export function Reveal({ index = 0, className, children }: RevealProps) {
  const reduceMotion = useReducedMotion() ?? false;
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index, 10) * STEP_SECONDS,
        ease: [0.2, 0, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
