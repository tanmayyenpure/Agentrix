import { ReactNode } from 'react';

export function Card({ children, className = '', style, onClick }: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      style={{ background: 'var(--forge-surface)', border: '1px solid var(--forge-border)', ...style }}
      className={`rounded-xl ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
