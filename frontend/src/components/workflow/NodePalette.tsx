import type { NodeType } from '../../types';
import { NODE_META } from '../../utils';

const GROUPS: { category: string; types: NodeType[] }[] = [
  { category: 'Trigger', types: ['TRIGGER_MANUAL', 'TRIGGER_WEBHOOK', 'TRIGGER_SCHEDULE'] },
  { category: 'Action', types: ['HTTP_REQUEST', 'LOG'] },
  { category: 'Control', types: ['DELAY', 'CONDITION'] },
  { category: 'Data', types: ['TRANSFORM'] },
];

const ICONS: Record<NodeType, React.ReactNode> = {
  TRIGGER_MANUAL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M5 3l14 9-14 9V3z"/></svg>,
  TRIGGER_WEBHOOK: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  TRIGGER_SCHEDULE: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  HTTP_REQUEST: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  LOG: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>,
  DELAY: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CONDITION: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41"/></svg>,
  TRANSFORM: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg>,
};

interface Props { onAdd: (type: NodeType) => void; }

export function NodePalette({ onAdd }: Props) {
  return (
    <div style={{ width: '200px', minWidth: '200px', background: 'var(--forge-surface)', borderLeft: '1px solid var(--forge-border)', overflowY: 'auto' }}>
      <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--forge-border)' }}>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-xs font-semibold text-white">Node Library</p>
        <p className="text-xs text-slate-600 mt-0.5">Click to add</p>
      </div>
      {GROUPS.map(({ category, types }) => (
        <div key={category} className="px-3 py-3">
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forge-muted)', marginBottom: '6px' }}>{category}</p>
          <div className="flex flex-col gap-1">
            {types.map((type) => {
              const meta = NODE_META[type];
              return (
                <button key={type} onClick={() => onAdd(type)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: 'transparent', border: `1px solid transparent`, cursor: 'pointer', color: 'var(--forge-text)', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${meta.color}15`; el.style.borderColor = `${meta.color}40`; el.style.color = meta.color; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent'; el.style.color = 'var(--forge-text)'; }}>
                  <span style={{ color: meta.color }}>{ICONS[type]}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
