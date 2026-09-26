import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { KpiDelta } from '../../api/types';
import { useSettings } from '../../hooks/useSettings';

export function useCountUp(target: number, durationMs = 900): number {
  const { animationLevel, reduceMotion } = useSettings();
  const [value, setValue] = useState(animationLevel === 0 || reduceMotion ? target : 0);
  const ref = useRef(value);
  ref.current = value;

  useEffect(() => {
    if (animationLevel === 0 || reduceMotion) { setValue(target); return; }
    let raf = 0;
    const from = ref.current === target ? 0 : ref.current;
    const start = performance.now();
    const dur = animationLevel === 1 ? durationMs : durationMs * 1.4;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, animationLevel, reduceMotion]);

  return value;
}

interface KpiTileProps {
  label: string;
  value: number | string;
  format?: (v: number) => string | number;
  delta?: KpiDelta;
  foot?: ReactNode;
  accent?: boolean;
  icon?: ReactNode;
}

export function KpiTile({ label, value, format, delta, foot, accent, icon }: KpiTileProps) {
  const numeric = typeof value === 'number';
  const animated = useCountUp(numeric ? (value as number) : 0);
  const display = numeric ? (format ? format(animated) : Math.round(animated).toLocaleString()) : value;

  const dir = delta?.direction ?? (delta?.deltaPct === undefined ? undefined : delta.deltaPct >= 0 ? 'up' : 'down');
  const good = delta ? (delta.invertGood ? dir === 'down' : dir === 'up') : true;

  return (
    <div className="panel" style={{ position: 'relative', overflow: 'hidden', padding: '15px 16px 14px' }}>
      {accent && (
        <div aria-hidden style={{
          position: 'absolute', inset: 'auto -25% -55% auto', width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)', pointerEvents: 'none',
        }} />
      )}
      {accent && (
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--accent), transparent)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>{label}</span>
        {icon && <span style={{ color: 'var(--text-3)' }}>{icon}</span>}
      </div>
      <div className="tabular" style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.2rem, 0.9rem + 0.85vw, 1.75rem)',
        fontWeight: 700,
        marginTop: 9,
        letterSpacing: '-0.035em',
        position: 'relative',
        whiteSpace: 'nowrap',
        lineHeight: 1.1,
        color: accent ? 'var(--accent)' : 'var(--text-1)',
      }}>
        {display}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, position: 'relative', minHeight: 20 }}>
        {delta?.deltaPct !== undefined && (
          <span className={`chip ${good ? 'success' : 'danger'}`} style={{ padding: '2px 7px', fontSize: 11 }}>
            {dir === 'up' ? <ArrowUpRight size={11} /> : dir === 'down' ? <ArrowDownRight size={11} /> : <Minus size={11} />}
            {Math.abs(delta.deltaPct).toFixed(1)}%
          </span>
        )}
        {foot && <span className="faint" style={{ fontSize: 11 }}>{foot}</span>}
      </div>
    </div>
  );
}

export function Reveal({ children, delay = 0, y = 16, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const { animationLevel, reduceMotion } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px 200px 0px' });

  if (animationLevel === 0 || reduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.42, delay: Math.min(delay, 0.12), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
