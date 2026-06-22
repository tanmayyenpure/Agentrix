import type { NodeType, ExecutionStatus } from '../types';

export const NODE_META: Record<NodeType, { label: string; color: string; category: string }> = {
  TRIGGER_MANUAL: { label: 'Manual Trigger', color: '#7c3aed', category: 'Trigger' },
  TRIGGER_WEBHOOK: { label: 'Webhook Trigger', color: '#7c3aed', category: 'Trigger' },
  TRIGGER_SCHEDULE: { label: 'Schedule Trigger', color: '#7c3aed', category: 'Trigger' },
  HTTP_REQUEST: { label: 'HTTP Request', color: '#0ea5e9', category: 'Action' },
  LOG: { label: 'Log', color: '#0ea5e9', category: 'Action' },
  DELAY: { label: 'Delay', color: '#f59e0b', category: 'Control' },
  CONDITION: { label: 'Condition', color: '#f59e0b', category: 'Control' },
  TRANSFORM: { label: 'Transform', color: '#10b981', category: 'Data' },
};

export const STATUS_COLOR: Record<ExecutionStatus, string> = {
  PENDING: '#64748b',
  RUNNING: '#3b82f6',
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
  CANCELLED: '#f59e0b',
};

export const STATUS_BG: Record<ExecutionStatus, string> = {
  PENDING: 'rgba(100,116,139,0.15)',
  RUNNING: 'rgba(59,130,246,0.15)',
  SUCCESS: 'rgba(16,185,129,0.15)',
  FAILED: 'rgba(239,68,68,0.15)',
  CANCELLED: 'rgba(245,158,11,0.15)',
};

export function formatDuration(ms?: number) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function tryParseJson(str?: string) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function cronDescription(expr: string) {
  const [minute, hour, day, month, weekday] = expr.trim().split(/\s+/);
  if (!minute || !hour || !day || !month || !weekday) return 'Enter a five-part cron expression';
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  if (day === '*' && month === '*' && weekday === '*') return `Every day at ${time}`;
  if (day === '*' && month === '*' && weekday !== '*') return `Every week on day ${weekday} at ${time}`;
  if (day !== '*' && month === '*' && weekday === '*') return `Every month on day ${day} at ${time}`;
  return `At ${time} when day=${day}, month=${month}, weekday=${weekday}`;
}

export function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'due now';
  if (diff < 3600000) return `${Math.ceil(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.ceil(diff / 3600000)}h`;
  return `${Math.ceil(diff / 86400000)}d`;
}
