import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function pad(n) {
  return String(n).padStart(2, '0');
}

function totalMinutes(h, m) {
  return parseInt(h || 0) * 60 + parseInt(m || 0);
}

function formatDuration(totalMins) {
  const sign = totalMins < 0 ? '-' : '';
  const abs = Math.abs(totalMins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hr${h !== 1 ? 's' : ''}`);
  parts.push(`${m} min${m !== 1 ? 's' : ''}`);
  return sign + parts.join(' ');
}

function TimeInput({ label, hours, mins, onHours, onMins }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={hours}
            onChange={e => onHours(e.target.value)}
            style={{ paddingRight: '36px' }}
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', pointerEvents: 'none' }}>hr</span>
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="number"
            min="0"
            max="59"
            placeholder="0"
            value={mins}
            onChange={e => onMins(e.target.value)}
            style={{ paddingRight: '40px' }}
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', pointerEvents: 'none' }}>min</span>
        </div>
      </div>
    </div>
  );
}

// ── Section 1: Add / Subtract durations ──────────────────────
function AddSubtract() {
  const [rows, setRows] = useState([
    { id: 1, h: '', m: '', op: '+' },
    { id: 2, h: '', m: '', op: '+' },
  ]);
  const [result, setResult] = useState(null);

  const addRow = () => setRows(r => [...r, { id: Date.now(), h: '', m: '', op: '+' }]);
  const removeRow = (id) => setRows(r => r.filter(x => x.id !== id));
  const update = (id, field, val) => setRows(r => r.map(x => x.id === id ? { ...x, [field]: val } : x));

  const calculate = () => {
    let total = 0;
    rows.forEach((row, i) => {
      const mins = totalMinutes(row.h, row.m);
      total += i === 0 ? mins : row.op === '+' ? mins : -mins;
    });
    setResult(total);
  };

  const reset = () => {
    setRows([{ id: 1, h: '', m: '', op: '+' }, { id: 2, h: '', m: '', op: '+' }]);
    setResult(null);
  };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Add / Subtract Durations</h2>

      {rows.map((row, i) => (
        <div key={row.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
          {i === 0 ? (
            <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, color: 'var(--text-3)', fontSize: '1.1rem' }}>+</span>
          ) : (
            <select
              value={row.op}
              onChange={e => update(row.id, 'op', e.target.value)}
              style={{ width: '60px', flex: 'none', textAlign: 'center' }}
            >
              <option value="+">+</option>
              <option value="−">−</option>
            </select>
          )}
          <div style={{ position: 'relative', flex: 1, minWidth: '90px' }}>
            <input type="number" min="0" placeholder="0" value={row.h}
              onChange={e => update(row.id, 'h', e.target.value)}
              style={{ paddingRight: '36px' }} />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', pointerEvents: 'none' }}>hr</span>
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '90px' }}>
            <input type="number" min="0" max="59" placeholder="0" value={row.m}
              onChange={e => update(row.id, 'm', e.target.value)}
              style={{ paddingRight: '40px' }} />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', pointerEvents: 'none' }}>min</span>
          </div>
          {rows.length > 2 && (
            <button onClick={() => removeRow(row.id)} className="btn btn-ghost btn-sm" style={{ padding: '7px 10px', color: '#ef4444' }}>✕</button>
          )}
        </div>
      ))}

      <div className="btn-group" style={{ marginBottom: result !== null ? '16px' : 0 }}>
        <button className="btn btn-primary btn-sm" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Row</button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
      </div>

      {result !== null && (
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{formatDuration(result)}</div>
            <div className="stat-label">Total Duration</div>
          </div>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{pad(Math.floor(Math.abs(result) / 60))}:{pad(Math.abs(result) % 60)}</div>
            <div className="stat-label">HH:MM</div>
          </div>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{Math.abs(result)}</div>
            <div className="stat-label">Total Minutes</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 2: Time between two times ────────────────────────
function TimeBetween() {
  const [start, setStart] = useState('');
  const [end, setEnd]     = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!start || !end) return;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // crosses midnight
    setResult(diff);
  };

  const reset = () => { setStart(''); setEnd(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Time Between Two Times</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tb-start">Start Time</label>
          <input id="tb-start" type="time" value={start} onChange={e => { setStart(e.target.value); setResult(null); }} />
        </div>
        <div className="form-group">
          <label htmlFor="tb-end">End Time</label>
          <input id="tb-end" type="time" value={end} onChange={e => { setEnd(e.target.value); setResult(null); }} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result !== null ? '16px' : 0 }}>
        <button className="btn btn-primary btn-sm" onClick={calculate} disabled={!start || !end}>Calculate</button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
      </div>

      {result !== null && (
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{formatDuration(result)}</div>
            <div className="stat-label">Duration</div>
          </div>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{pad(Math.floor(result / 60))}:{pad(result % 60)}</div>
            <div className="stat-label">HH:MM</div>
          </div>
          <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
            <div className="stat-value">{result}</div>
            <div className="stat-label">Total Minutes</div>
          </div>
          {result > 0 && (
            <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
              <div className="stat-value">{(result / 60).toFixed(2)}</div>
              <div className="stat-label">Decimal Hours</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section 3: Convert duration units ────────────────────────
function ConvertDuration() {
  const [value, setValue] = useState('');
  const [from, setFrom]   = useState('hours');
  const [result, setResult] = useState(null);

  const units = ['minutes', 'hours', 'days', 'weeks'];

  const toMinutes = (val, unit) => {
    const v = parseFloat(val);
    if (unit === 'minutes') return v;
    if (unit === 'hours')   return v * 60;
    if (unit === 'days')    return v * 60 * 24;
    if (unit === 'weeks')   return v * 60 * 24 * 7;
  };

  const calculate = () => {
    if (!value || isNaN(parseFloat(value))) return;
    const mins = toMinutes(value, from);
    setResult({
      minutes: +mins.toFixed(4),
      hours:   +(mins / 60).toFixed(4),
      days:    +(mins / 60 / 24).toFixed(4),
      weeks:   +(mins / 60 / 24 / 7).toFixed(6),
    });
  };

  const reset = () => { setValue(''); setResult(null); };

  return (
    <div className="tool-box">
      <h2 className="tool-box-title">Convert Duration Units</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cv-val">Value</label>
          <input id="cv-val" type="number" min="0" placeholder="e.g. 90" value={value}
            onChange={e => { setValue(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group">
          <label htmlFor="cv-from">Unit</label>
          <select id="cv-from" value={from} onChange={e => { setFrom(e.target.value); setResult(null); }}>
            {units.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '16px' : 0 }}>
        <button className="btn btn-primary btn-sm" onClick={calculate} disabled={!value}>Convert</button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div className="result-grid">
          {Object.entries(result).map(([unit, val]) => (
            <div className="result-stat" key={unit}>
              <div className="stat-value" style={{ fontSize: val > 9999 ? '1rem' : undefined }}>{val.toLocaleString()}</div>
              <div className="stat-label">{unit.charAt(0).toUpperCase() + unit.slice(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function TimeDurationCalculator() {
  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Time Duration Calculator</span>
          </div>
          <h1>Time Duration Calculator</h1>
          <p className="subtitle">Add and subtract durations, find time between two times, and convert time units.</p>
        </div>

        <AddSubtract />
        <TimeBetween />
        <ConvertDuration />

        <div className="seo-content" style={{ marginTop: '32px' }}>
          <h2>How to Use the Time Duration Calculator</h2>
          <p>
            This calculator has three tools in one. The first lets you add or subtract any number of time
            durations — useful for totalling up work hours, calculating how long a series of tasks will take,
            or finding a net duration from mixed additions and subtractions. Click "Add Row" to include as
            many durations as you need.
          </p>
          <p>
            The second tool finds the exact duration between a start time and end time on a 24-hour clock.
            It handles overnight spans correctly — if your end time is earlier than your start time, it
            assumes the period crosses midnight. Results are shown as hours and minutes, HH:MM format, total
            minutes, and decimal hours (useful for timesheets).
          </p>
          <p>
            The converter lets you translate any duration between minutes, hours, days, and weeks instantly.
            All three tools run entirely in your browser — nothing is sent to any server.
          </p>
        </div>

        <RelatedTools currentId="time-duration-calculator" />
      </div>
    </div>
  );
}
