import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Time helpers ──────────────────────────────────────────────

// Parse "HH:MM" or "H:MM AM/PM" → total minutes from midnight
function parseTime(str) {
  if (!str) return null;
  str = str.trim().toUpperCase();

  // 12-hour format: "9:00 AM", "5:30 PM"
  const h12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (h12) {
    let h = parseInt(h12[1]);
    const m = parseInt(h12[2]);
    const ampm = h12[3];
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  // 24-hour format: "09:00", "17:30"
  const h24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = parseInt(h24[1]);
    const m = parseInt(h24[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  return null;
}

// Format minutes → "H hrs M mins" or "H:MM"
function fmtDuration(totalMins, style = 'long') {
  const negative = totalMins < 0;
  const abs = Math.abs(totalMins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = negative ? '-' : '';
  if (style === 'short') return `${sign}${h}:${String(m).padStart(2,'0')}`;
  if (m === 0) return `${sign}${h} hr${h !== 1 ? 's' : ''}`;
  if (h === 0) return `${sign}${m} min${m !== 1 ? 's' : ''}`;
  return `${sign}${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
}

// Format minutes → decimal hours
function fmtDecimal(totalMins, dp = 2) {
  const negative = totalMins < 0;
  const abs = Math.abs(totalMins);
  return `${negative ? '-' : ''}${(abs / 60).toFixed(dp)}`;
}

// Format minutes → pay
function calcPay(totalMins, rate) {
  return (totalMins / 60) * rate;
}

// Day names
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Determine if a day is a weekend
function isWeekend(dayName) {
  return dayName === 'Saturday' || dayName === 'Sunday';
}

// ── Shared UI ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '24px', marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px',
      textAlign: 'center', flex: '1 1 120px', minWidth: '110px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.6rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Mode 1: Weekly timesheet ──────────────────────────────────

const DEFAULT_ROWS = DAY_NAMES.map(day => ({
  day,
  start: isWeekend(day) ? '' : '09:00',
  end:   isWeekend(day) ? '' : '17:00',
  break: isWeekend(day) ? '' : '30',
  active: !isWeekend(day),
}));

function TimesheetMode() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [rate, setRate] = useState('');
  const [overtime, setOvertime] = useState('40');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [toast, setToast]   = useState('');

  function updateRow(i, field, val) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
    setResult(null);
    setError('');
  }

  function calculate() {
    const dayResults = [];
    let totalErrors = [];

    for (const row of rows) {
      if (!row.active || (!row.start && !row.end)) {
        dayResults.push({ day: row.day, mins: 0, active: false });
        continue;
      }

      const startMins = parseTime(row.start);
      const endMins   = parseTime(row.end);
      const breakMins = parseInt(row.break) || 0;

      if (startMins === null) { totalErrors.push(`${row.day}: invalid start time`); continue; }
      if (endMins === null)   { totalErrors.push(`${row.day}: invalid end time`); continue; }

      let workMins = endMins - startMins - breakMins;
      // Handle overnight (e.g. shift ends next day)
      if (workMins < 0) workMins += 24 * 60;

      dayResults.push({ day: row.day, mins: workMins, breakMins, startMins, endMins, active: true });
    }

    if (totalErrors.length > 0) {
      setError(totalErrors.join(' · '));
      setResult(null);
      return;
    }

    const totalMins    = dayResults.reduce((s, r) => s + r.mins, 0);
    const otThreshold  = (parseFloat(overtime) || 40) * 60;
    const regularMins  = Math.min(totalMins, otThreshold);
    const overtimeMins = Math.max(0, totalMins - otThreshold);
    const rateVal      = parseFloat(rate) || 0;
    const regularPay   = rateVal > 0 ? calcPay(regularMins, rateVal) : null;
    const overtimePay  = rateVal > 0 ? calcPay(overtimeMins, rateVal * 1.5) : null;
    const totalPay     = regularPay !== null ? regularPay + (overtimePay || 0) : null;

    setResult({ dayResults, totalMins, regularMins, overtimeMins, rateVal, regularPay, overtimePay, totalPay, otThreshold });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Total hours: ${fmtDuration(result.totalMins)}  (${fmtDecimal(result.totalMins)}h)`,
      result.overtimeMins > 0 ? `Regular: ${fmtDuration(result.regularMins)} · Overtime: ${fmtDuration(result.overtimeMins)}` : '',
      result.totalPay !== null ? `Estimated pay: $${result.totalPay.toFixed(2)}` : '',
      '',
      ...result.dayResults.filter(r => r.active).map(r =>
        `${r.day}: ${fmtDuration(r.mins)} (${fmtDecimal(r.mins)}h)`
      ),
    ].filter(l => l !== undefined).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your start time, end time, and break for each day. Times can be in 24-hour (09:00) or 12-hour (9:00 AM) format.
      </p>

      {/* Timesheet table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '520px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['', 'Day', 'Start', 'End', 'Break (min)', 'Hours'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const dayResult = result?.dayResults?.[i];
              const weekend   = isWeekend(row.day);
              return (
                <tr key={row.day} style={{ borderBottom: '1px solid var(--border)', background: weekend ? 'var(--surface2)' : 'transparent', opacity: row.active ? 1 : 0.5 }}>
                  {/* Toggle checkbox */}
                  <td style={{ padding: '6px 10px' }}>
                    <input type="checkbox" checked={row.active}
                      onChange={e => updateRow(i, 'active', e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </td>
                  {/* Day */}
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: weekend ? 'var(--text-3)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                    {row.day}
                  </td>
                  {/* Start */}
                  <td style={{ padding: '6px 8px' }}>
                    <input type="time" value={row.start}
                      disabled={!row.active}
                      onChange={e => updateRow(i, 'start', e.target.value)}
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '110px' }} />
                  </td>
                  {/* End */}
                  <td style={{ padding: '6px 8px' }}>
                    <input type="time" value={row.end}
                      disabled={!row.active}
                      onChange={e => updateRow(i, 'end', e.target.value)}
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '110px' }} />
                  </td>
                  {/* Break */}
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={row.break} min="0" max="480"
                      disabled={!row.active}
                      onChange={e => updateRow(i, 'break', e.target.value)}
                      placeholder="0"
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '72px' }} />
                  </td>
                  {/* Hours result */}
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', whiteSpace: 'nowrap' }}>
                    {dayResult?.active ? fmtDuration(dayResult.mins) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
        <div className="form-group" style={{ flex: '1 1 160px' }}>
          <label>Hourly rate ($) <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional</span></label>
          <input type="number" value={rate} min="0" step="0.01"
            onChange={e => { setRate(e.target.value); setResult(null); }}
            placeholder="e.g. 25.00" />
        </div>
        <div className="form-group" style={{ flex: '1 1 160px' }}>
          <label>Overtime threshold (hrs/wk)</label>
          <input type="number" value={overtime} min="1" max="80"
            onChange={e => { setOvertime(e.target.value); setResult(null); }}
            placeholder="40" />
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: '4px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setRows(DEFAULT_ROWS); setResult(null); setError(''); }}>Reset</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          <SectionTitle>Weekly summary</SectionTitle>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Total hours" value={fmtDuration(result.totalMins)} sub={`${fmtDecimal(result.totalMins)}h decimal`} />
            {result.overtimeMins > 0 ? (
              <>
                <StatCard label="Regular"   value={fmtDuration(result.regularMins)}  sub={`≤ ${overtime}h threshold`} />
                <StatCard label="Overtime"  value={fmtDuration(result.overtimeMins)} sub="× 1.5 rate" color="#f97316" />
              </>
            ) : (
              <StatCard label="Status" value="No overtime" sub={`under ${overtime}h threshold`} color="#16a34a" />
            )}
            {result.totalPay !== null && (
              <StatCard accent label="Est. weekly pay" value={`$${result.totalPay.toFixed(2)}`}
                sub={result.overtimePay > 0 ? `incl. $${result.overtimePay.toFixed(2)} OT` : `@ $${result.rateVal}/hr`} />
            )}
          </div>

          {/* Day-by-day breakdown */}
          <SectionTitle>Daily breakdown</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.dayResults.filter(r => r.active).map(r => {
              const pct = result.totalMins > 0 ? (r.mins / result.totalMins) * 100 : 0;
              return (
                <div key={r.day} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                }}>
                  <div style={{ flex: '0 0 90px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{r.day}</div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '99px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', fontSize: '0.88rem' }}>
                    {fmtDuration(r.mins)}
                  </div>
                  <div style={{ flex: '0 0 50px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    {fmtDecimal(r.mins)}h
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pay breakdown if rate set */}
          {result.totalPay !== null && (
            <>
              <SectionTitle>Pay breakdown</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: `Regular hours (${fmtDuration(result.regularMins)})`, amount: result.regularPay, rate: result.rateVal },
                  ...(result.overtimeMins > 0 ? [{ label: `Overtime (${fmtDuration(result.overtimeMins)} × 1.5)`, amount: result.overtimePay, rate: result.rateVal * 1.5 }] : []),
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{row.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>@ ${row.rate.toFixed(2)}/hr</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', fontSize: '0.95rem' }}>
                      ${row.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--accent-light)', border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-hover)' }}>Total estimated pay</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--accent-hover)', fontSize: '1.1rem' }}>
                    ${result.totalPay.toFixed(2)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Quick single-day calculator ───────────────────────

function SingleDayMode() {
  const [start, setStart]   = useState('09:00');
  const [end, setEnd]       = useState('17:00');
  const [breakMin, setBreakMin] = useState('30');
  const [rate, setRate]     = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    const s = parseTime(start);
    const e = parseTime(end);
    const b = parseInt(breakMin) || 0;

    if (s === null) { setError('Enter a valid start time (e.g. 09:00 or 9:00 AM).'); setResult(null); return; }
    if (e === null) { setError('Enter a valid end time.'); setResult(null); return; }

    let work = e - s - b;
    if (work < 0) work += 24 * 60; // overnight

    const rateVal = parseFloat(rate) || 0;
    const pay     = rateVal > 0 ? calcPay(work, rateVal) : null;

    setResult({ work, breakMin: b, s, e, rateVal, pay });
    setError('');
  }

  const QUICK = [
    { label: '9–5',     s: '09:00', e: '17:00', b: '0'  },
    { label: '9–5 +30',  s: '09:00', e: '17:00', b: '30' },
    { label: '8–4',     s: '08:00', e: '16:00', b: '30' },
    { label: '7–3',     s: '07:00', e: '15:00', b: '30' },
    { label: 'Night shift', s: '22:00', e: '06:00', b: '30' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate hours worked for a single shift. Handles overnight shifts automatically.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Start time</label>
          <input type="time" value={start}
            onChange={e => { setStart(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem' }} />
        </div>
        <div className="form-group">
          <label>End time</label>
          <input type="time" value={end}
            onChange={e => { setEnd(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem' }} />
        </div>
        <div className="form-group">
          <label>Break (minutes)</label>
          <input type="number" value={breakMin} min="0" max="480"
            onChange={e => { setBreakMin(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="0" />
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: '200px' }}>
        <label>Hourly rate ($) <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional</span></label>
        <input type="number" value={rate} min="0" step="0.01"
          onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
          placeholder="e.g. 25.00" />
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Quick shifts
        </p>
        <div className="tag-row">
          {QUICK.map(q => (
            <button key={q.label} className="tag"
              onClick={() => { setStart(q.s); setEnd(q.e); setBreakMin(q.b); setResult(null); setError(''); }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setStart('09:00'); setEnd('17:00'); setBreakMin('30'); setRate(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Hours worked"  value={fmtDuration(result.work)} sub={`${fmtDecimal(result.work)}h decimal`} />
            <StatCard label="Decimal hours"  value={`${fmtDecimal(result.work)}h`} sub="for payroll" />
            <StatCard label="Break deducted" value={`${result.breakMin} min`}    sub={`${(result.breakMin/60).toFixed(2)}h`} />
            {result.pay !== null && (
              <StatCard accent label="Estimated pay" value={`$${result.pay.toFixed(2)}`} sub={`@ $${result.rateVal}/hr`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Hours converter ───────────────────────────────────

function ConverterMode() {
  const [inputVal, setInputVal] = useState('');
  const [inputType, setInputType] = useState('decimal'); // decimal | hhmm | mins
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  function calculate() {
    const v = inputVal.trim();
    if (!v) { setError('Enter a value to convert.'); setResult(null); return; }

    let totalMins;

    if (inputType === 'decimal') {
      const dec = parseFloat(v);
      if (isNaN(dec) || dec < 0) { setError('Enter a valid decimal hours value (e.g. 7.5).'); setResult(null); return; }
      totalMins = Math.round(dec * 60);
    } else if (inputType === 'hhmm') {
      const parsed = parseTime(v);
      if (parsed === null) { setError('Enter a valid HH:MM value (e.g. 7:30).'); setResult(null); return; }
      totalMins = parsed;
    } else {
      const mins = parseInt(v);
      if (isNaN(mins) || mins < 0) { setError('Enter a valid number of minutes.'); setResult(null); return; }
      totalMins = mins;
    }

    const h     = Math.floor(totalMins / 60);
    const m     = totalMins % 60;
    const dec   = (totalMins / 60).toFixed(4);
    const hhmm  = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    setResult({ totalMins, h, m, dec, hhmm });
    setError('');
  }

  const INPUT_TYPES = [
    { id: 'decimal', label: 'Decimal hours', placeholder: 'e.g. 7.5' },
    { id: 'hhmm',    label: 'HH:MM format',  placeholder: 'e.g. 7:30' },
    { id: 'mins',    label: 'Minutes',        placeholder: 'e.g. 450' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Convert between decimal hours (7.5), HH:MM format (7:30), and total minutes (450).
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {INPUT_TYPES.map(t => (
          <button key={t.id} onClick={() => { setInputType(t.id); setResult(null); setError(''); }}
            style={{
              flex: 1, minWidth: '120px', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${inputType === t.id ? 'var(--accent)' : 'var(--border)'}`,
              background: inputType === t.id ? 'var(--accent-light)' : 'var(--surface2)',
              color: inputType === t.id ? 'var(--accent-hover)' : 'var(--text)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ maxWidth: '250px' }}>
        <label>Enter value</label>
        <input type="text" value={inputVal}
          onChange={e => { setInputVal(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
          placeholder={INPUT_TYPES.find(t => t.id === inputType)?.placeholder}
          style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }} />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Convert</button>
        <button className="btn btn-ghost" onClick={() => { setInputVal(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="HH:MM"         value={result.hhmm}              sub="hours and minutes" />
            <StatCard accent label="Decimal hours"  value={`${result.dec}h`}         sub="for payroll" />
            <StatCard label="Total minutes"  value={result.totalMins.toLocaleString()} sub="minutes total" />
            <StatCard label="Breakdown"      value={`${result.h}h ${result.m}m`}    sub="hours + minutes" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Weekly Timesheet', desc: '7-day schedule'     },
  { label: 'Single Shift',     desc: 'one day / shift'    },
  { label: 'Hours Converter',  desc: 'decimal ↔ HH:MM'   },
];

export default function WorkHoursCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Work Hours Calculator</span>
          </div>
          <h1>Work Hours Calculator</h1>
          <p className="subtitle">
            Calculate total hours worked from a weekly timesheet or single shift, compute pay with overtime, and convert between decimal hours and HH:MM format.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          {mode === 0 && <TimesheetMode />}
          {mode === 1 && <SingleDayMode />}
          {mode === 2 && <ConverterMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Work Hours Calculator</h2>
          <p>
            This free work hours calculator handles every common timesheet task in one place — running entirely in your browser with no account required. Switch between three modes to match your task.
          </p>
          <p>
            <strong>Weekly Timesheet</strong> is a full Monday-to-Sunday schedule. Enable or disable each day with a checkbox, enter your start and end times (in either 24-hour or 12-hour format), and add your break duration in minutes. The calculator shows total hours for each day as a bar chart and totals them up for the week. Enter an optional hourly rate and it calculates your estimated pay — automatically splitting regular and overtime hours at a configurable threshold (default 40 hours) and applying a 1.5× rate for overtime.
          </p>
          <p>
            <strong>Single Shift</strong> calculates hours worked for one day or shift. It handles overnight shifts automatically — if your end time is earlier than your start time, it assumes the shift crossed midnight. Quick-shift presets let you load common schedules (9–5, 8–4, night shift) with one click.
          </p>
          <p>
            <strong>Hours Converter</strong> converts between the three formats used in payroll and time tracking: <em>decimal hours</em> (7.5), <em>HH:MM</em> (7:30), and <em>total minutes</em> (450). This is useful when your timekeeping software uses a different format to your payroll system.
          </p>
          <p>
            All calculations happen in your browser — no data is sent anywhere. Results can be copied to the clipboard for pasting into spreadsheets or payroll software.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Work Hour Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))' }}>
            {[
              { label: '9:00–17:00, 30 min break', value: '7h 30m',   sub: '7.5 decimal hours' },
              { label: '8:00–18:00, no break',      value: '10h',      sub: '10.0 decimal hours' },
              { label: '22:00–06:00, 30 min break', value: '7h 30m',   sub: 'overnight shift' },
              { label: '40h week @ $25/hr',          value: '$1,000',   sub: 'no overtime' },
              { label: '45h week @ $20/hr (OT)',     value: '$950',     sub: '40 regular + 5 OT' },
              { label: '7.75 decimal hours',         value: '7:45',     sub: 'HH:MM equivalent' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="work-hours-calculator" />
      </div>
    </div>
  );
}
