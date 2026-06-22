import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, Settings } from 'lucide-react';
import type { NodeType } from '../../types';
import { NODE_META } from '../../utils';

const NODE_ICON: Record<NodeType, React.ReactNode> = {
  TRIGGER_MANUAL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 3l14 9-14 9V3z"/></svg>,
  TRIGGER_WEBHOOK: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  TRIGGER_SCHEDULE: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  HTTP_REQUEST: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  LOG: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  DELAY: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CONDITION: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41"/></svg>,
  TRANSFORM: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg>,
};

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  config?: string;
  onDelete?: (id: string) => void;
  onConfigure?: (id: string) => void;
}

interface FlowNodeProps {
  id: string;
  data: FlowNodeData;
  selected?: boolean;
}

export const FlowNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const meta = NODE_META[data.type];
  const [hovered, setHovered] = useState(false);
  const isTrigger = data.type.startsWith('TRIGGER_');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--forge-surface-2)',
        border: `1.5px solid ${selected ? meta.color : hovered ? `${meta.color}80` : 'var(--forge-border)'}`,
        borderRadius: '12px',
        minWidth: '180px',
        boxShadow: selected ? `0 0 0 3px ${meta.color}25, 0 4px 20px rgba(0,0,0,0.3)` : '0 2px 12px rgba(0,0,0,0.2)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Top}
          style={{ top: -6, background: 'var(--forge-bg)', border: `2px solid ${meta.color}`, width: 10, height: 10 }} />
      )}

      <div style={{ background: `${meta.color}18`, borderBottom: '1px solid var(--forge-border)', borderRadius: '10px 10px 0 0', padding: '8px 12px' }}
        className="flex items-center gap-2">
        <div style={{ color: meta.color }}>{NODE_ICON[data.type]}</div>
        <span style={{ fontSize: '10px', color: meta.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {meta.category}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          {data.onConfigure && (
            <button onClick={() => (data.onConfigure as (id: string) => void)(id)}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'var(--forge-muted)', padding: '2px 4px', borderRadius: '4px' }}>
              <Settings size={10} />
            </button>
          )}
          {data.onDelete && (
            <button onClick={() => (data.onDelete as (id: string) => void)(id)}
              style={{ background: 'rgba(239,68,68,0.15)', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', borderRadius: '4px' }}>
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 12px' }}>
        <p style={{ color: 'var(--forge-text)', fontSize: '13px', fontWeight: 500, margin: 0 }}>{data.label}</p>
        <p style={{ color: 'var(--forge-muted)', fontSize: '11px', margin: '2px 0 0' }}>{meta.label}</p>
        {data.config && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '4px 6px', marginTop: '6px', fontSize: '10px', color: 'var(--forge-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '156px' }}>
            {data.config}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ bottom: -6, background: 'var(--forge-bg)', border: `2px solid ${meta.color}`, width: 10, height: 10 }} />
    </div>
  );
});
FlowNode.displayName = 'FlowNode';
