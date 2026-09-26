import { CSSProperties, ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  pad?: boolean;
  glass?: boolean;
  id?: string;
}

export function Panel({ title, subtitle, actions, children, className = '', style, pad = true, glass, id }: PanelProps) {
  const hasHeader = !!(title || actions);
  return (
    <section
      id={id}
      className={`panel ${glass ? 'panel-glass' : ''} ${className}`}
      style={style}
    >
      {hasHeader && (
        <header className="panel-header" style={{ padding: pad ? '14px 18px 12px' : '12px 16px 10px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && (
              <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 680, letterSpacing: '-0.02em', marginBottom: subtitle ? 3 : 0 }}>{title}</h3>
            )}
            {subtitle && <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
        </header>
      )}
      {pad ? (
        <div style={{ padding: hasHeader ? '16px 18px 18px' : '18px' }}>
          {children}
        </div>
      ) : children}
    </section>
  );
}
