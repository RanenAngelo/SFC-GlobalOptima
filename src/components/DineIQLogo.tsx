import { useId, type CSSProperties } from 'react';

interface DineIQLogoProps {
  mode?: 'full' | 'icon';
  size?: number;
  background?: 'light' | 'dark' | 'auto';
  className?: string;
}

/** Responsive, vector DineIQ identity with a restrained liquid-glass finish. */
export function DineIQLogo({ mode = 'full', size = 36, background = 'auto', className }: DineIQLogoProps) {
  const gradientId = useId().replace(/:/g, '');
  const icon = (
    <svg className="dineiq-logo__icon" width={size} height={size} viewBox="0 0 48 48" role={mode === 'icon' ? 'img' : undefined} aria-label={mode === 'icon' ? 'DineIQ' : undefined} aria-hidden={mode === 'full'}>
      <defs>
        <linearGradient id={`${gradientId}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" stopOpacity=".72" />
          <stop offset=".52" stopColor="#dcecff" stopOpacity=".18" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id={`${gradientId}-mark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" />
          <stop offset=".7" stopColor="#eaf3ff" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <linearGradient id={`${gradientId}-sheen`} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="white" stopOpacity=".72" />
          <stop offset=".48" stopColor="white" stopOpacity=".08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill={`url(#${gradientId}-glass)`} />
      <rect x="3" y="3" width="42" height="42" rx="12.5" fill="none" stroke="white" strokeOpacity=".48" />
      <path d="M15 13.5h8.5c7.1 0 11.5 4.5 11.5 11s-4.4 11-11.5 11H15v-22zm5.5 5v12h3c3.8 0 5.9-2.1 5.9-6s-2.1-6-5.9-6h-3z" fill={`url(#${gradientId}-mark)`} />
      <path d="M15 13.5h8.5c7.1 0 11.5 4.5 11.5 11s-4.4 11-11.5 11H15v-22z" fill={`url(#${gradientId}-sheen)`} opacity=".34" />
      <path d="M31.6 14.8a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z" fill="var(--accent)" stroke="rgba(255,255,255,.65)" strokeWidth=".8" />
    </svg>
  );

  const style = { '--logo-size': `${size}px` } as CSSProperties;
  return mode === 'icon' ? <span className={`dineiq-logo dineiq-logo--icon dineiq-logo--${background}${className ? ` ${className}` : ''}`} style={style}>{icon}</span> : (
    <span className={`dineiq-logo dineiq-logo--full dineiq-logo--${background}${className ? ` ${className}` : ''}`} style={style} role="img" aria-label="DineIQ Restaurant Intelligence">
      {icon}
      <span className="dineiq-logo__copy">
        <span className="dineiq-logo__name">Dine<span>IQ</span></span>
        <span className="dineiq-logo__tagline">RESTAURANT INTELLIGENCE</span>
      </span>
    </span>
  );
}
