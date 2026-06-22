import { cronDescription } from '../../utils';

const minutes = ['0', '15', '30', '45'];
const hours = Array.from({ length: 24 }, (_, i) => String(i));
const days = ['*', ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
const months = ['*', ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
const weekdays = ['*', '0', '1', '2', '3', '4', '5', '6'];

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg px-3 py-2.5 text-sm outline-none normal-case tracking-normal"
        style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)', color: 'var(--forge-text)' }}
      >
        {options.map((option) => <option key={option} value={option}>{option === '*' ? 'Any' : option}</option>)}
      </select>
    </label>
  );
}

export function CronBuilder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parts = value.trim().split(/\s+/);
  const [minute = '0', hour = '9', day = '*', month = '*', weekday = '*'] = parts.length === 5 ? parts : ['0', '9', '*', '*', '*'];

  function update(index: number, next: string) {
    const updated = [minute, hour, day, month, weekday];
    updated[index] = next;
    onChange(updated.join(' '));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        <Select label="Minute" value={minute} onChange={(next) => update(0, next)} options={minutes} />
        <Select label="Hour" value={hour} onChange={(next) => update(1, next)} options={hours} />
        <Select label="Day" value={day} onChange={(next) => update(2, next)} options={days} />
        <Select label="Month" value={month} onChange={(next) => update(3, next)} options={months} />
        <Select label="Weekday" value={weekday} onChange={(next) => update(4, next)} options={weekdays} />
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.2)' }}>
        {cronDescription(value)}
      </div>
    </div>
  );
}
