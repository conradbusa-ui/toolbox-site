import { useState, useEffect } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Date helpers ──────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function diffDetailed(startDate, endDate) {
  let start = new Date(startDate);
  let end   = new Date(endDate);
  const sign = end >= start ? 1 : -1;
  if (sign === -1) [start, end] = [end, start];

  let years  = end.getFullYear() - start.getFullYear();
  let months = end.getMonth()    - start.getMonth();
  let days   = end.getDate()     - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  const totalDays   = Math.abs(Math.round((end - start) / 86400000));
  const totalWeeks  = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours  = totalDays * 24;

  return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, sign };
}

function fmtDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtShort(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff  = date - start;
  return Math.floor(diff / 86400000);
}

function getWeekNumber(date) {
  const d    = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day  = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getQuarter(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES  = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

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
      borderRadius: 'var(--radius)',
      padding: '14px 18px',
      textAlign: 'center',
      flex: '1 1 120px',
      minWidth: '110px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.6rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1, wordBreak: 'break-word' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Mode 1: Difference between two dates ─────────────────────

function DifferenceMode() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [start, setStart] = useState(fmtInput(addDays(today, -30)));
  const [end,   setEnd]   = useState(fmtInput(today));
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');
  const [toast,  setToast]  = useState('');

  function calculate() {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end   + 'T00:00:00');
    if (isNaN(s) || isNaN(e)) { setError('Enter valid dates.'); setResult(null); return; }
    const diff = diffDetailed(s, e);
    setResult({ diff, start: s, end: e });
    setError('');
  }

  function copy() {
    if (!result) return;
    const { diff } = result;
    const text = [
      `${diff.years} years, ${diff.months} months, ${diff.days} days`,
      `Total days: ${diff.totalDays.toLocaleString()}`,
      `Total weeks: ${diff.totalWeeks.toLocaleString()}`,
      `Total months: ${diff.totalMonths.toLocaleString()}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  // Auto-calculate on mount
  useEffect(() => { calculate(); }, []);

  const QUICK_PAIRS = [
    { label: 'Last 30 days', s: fmtInput(addDays(today, -30)), e: fmtInput(today) },
    { label: 'Last 90 days', s: fmtInput(addDays(today, -90)), e: fmtInput(today) },
    { label: 'Last year',    s: fmtInput(addYears(today, -1)),  e: fmtInput(today) },
    { label: 'This year',    s: fmtInput(new Date(today.getFullYear(), 0, 1)), e: fmtInput(today) },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find the exact duration between any two dates — in years, months, days, weeks, and more.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Start date</label>
          <input type="date" value={start}
            onChange={e => { setStart(e.target.value); setResult(null); setError(''); }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', fontSize: '1.2rem', color: 'var(--text-3)', flexShrink: 0 }}>→</div>
        <div className="form-group">
          <label>End date</label>
          <input type="date" value={end}
            onChange={e => { setEnd(e.target.value); setResult(null); setError(''); }} />
        </div>
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quick ranges</p>
        <div className="tag-row">
          {QUICK_PAIRS.map(q => (
            <button key={q.label} className="tag"
              onClick={() => { setStart(q.s); setEnd(q.e); setResult(null); setError(''); }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setStart(''); setEnd(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          {/* Main result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Duration
            </div>
            <div style={{ fontSize: 'clamp(1.2rem,4vw,2rem)', fontWeight: 700, color: 'var(--accent-hover)', lineHeight: 1.2 }}>
              {result.diff.years > 0 && `${result.diff.years} year${result.diff.years !== 1 ? 's' : ''}, `}
              {result.diff.months > 0 && `${result.diff.months} month${result.diff.months !== 1 ? 's' : ''}, `}
              {result.diff.days} day{result.diff.days !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtShort(result.start)} → {fmtShort(result.end)}
              {result.diff.sign === -1 && ' (end before start)'}
            </div>
          </div>

          {/* All units */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Total days"   value={result.diff.totalDays.toLocaleString()} />
            <StatCard label="Total weeks"  value={result.diff.totalWeeks.toLocaleString()} sub={`${result.diff.totalDays % 7} extra days`} />
            <StatCard label="Total months" value={result.diff.totalMonths.toLocaleString()} />
            <StatCard label="Total hours"  value={result.diff.totalHours.toLocaleString()} />
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Add or subtract from a date ──────────────────────

function AddSubtractMode() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [baseDate, setBaseDate] = useState(fmtInput(today));
  const [operation, setOperation] = useState('add');
  const [years,  setYears]  = useState('');
  const [months, setMonths] = useState('');
  const [weeks,  setWeeks]  = useState('');
  const [days,   setDays]   = useState('');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');
  const [toast,  setToast]  = useState('');

  function calculate() {
    const base = new Date(baseDate + 'T00:00:00');
    if (isNaN(base)) { setError('Enter a valid start date.'); setResult(null); return; }

    const y = parseInt(years)  || 0;
    const mo = parseInt(months) || 0;
    const w = parseInt(weeks)  || 0;
    const d = parseInt(days)   || 0;
    const totalD = w * 7 + d;

    if (y === 0 && mo === 0 && totalD === 0) { setError('Enter at least one value to add or subtract.'); setResult(null); return; }

    const sign = operation === 'add' ? 1 : -1;
    let result = new Date(base);
    result = addYears(result, sign * y);
    result = addMonths(result, sign * mo);
    result = addDays(result, sign * totalD);

    setResult({ result, base, y, mo, w, d: totalD, operation });
    setError('');
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(fmtDate(result.result)).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const QUICK_ADDS = [
    { label: '+7 days',   y:0, mo:0, w:1, d:0, op:'add' },
    { label: '+30 days',  y:0, mo:0, w:0, d:30, op:'add' },
    { label: '+3 months', y:0, mo:3, w:0, d:0, op:'add' },
    { label: '+1 year',   y:1, mo:0, w:0, d:0, op:'add' },
    { label: '−30 days',  y:0, mo:0, w:0, d:30, op:'subtract' },
    { label: '−1 year',   y:1, mo:0, w:0, d:0, op:'subtract' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Add or subtract years, months, weeks, and days from any date to find the resulting date.
      </p>

      <div className="form-group">
        <label>Start date</label>
        <input type="date" value={baseDate}
          onChange={e => { setBaseDate(e.target.value); setResult(null); setError(''); }} />
      </div>

      {/* Add/subtract toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {['add', 'subtract'].map(op => (
          <button key={op} onClick={() => { setOperation(op); setResult(null); }}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${operation === op ? 'var(--accent)' : 'var(--border)'}`,
              background: operation === op ? 'var(--accent-light)' : 'var(--surface2)',
              color: operation === op ? 'var(--accent-hover)' : 'var(--text)',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}>
            {op === 'add' ? '+ Add' : '− Subtract'}
          </button>
        ))}
      </div>

      <div className="form-row">
        {[
          { label: 'Years',  val: years,  set: setYears  },
          { label: 'Months', val: months, set: setMonths },
          { label: 'Weeks',  val: weeks,  set: setWeeks  },
          { label: 'Days',   val: days,   set: setDays   },
        ].map(f => (
          <div key={f.label} className="form-group" style={{ flex: 1, minWidth: '80px' }}>
            <label>{f.label}</label>
            <input type="number" value={f.val} min="0"
              onChange={e => { f.set(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="0" style={{ fontFamily: 'var(--mono)' }} />
          </div>
        ))}
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quick adds</p>
        <div className="tag-row">
          {QUICK_ADDS.map(q => (
            <button key={q.label} className="tag"
              onClick={() => {
                setYears(String(q.y || '')); setMonths(String(q.mo || ''));
                setWeeks(String(q.w || '')); setDays(String(q.d || ''));
                setOperation(q.op); setResult(null); setError('');
              }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setYears(''); setMonths(''); setWeeks(''); setDays(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy date</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Result
            </div>
            <div style={{ fontSize: 'clamp(1.1rem,3.5vw,1.8rem)', fontWeight: 700, color: 'var(--accent-hover)', lineHeight: 1.2 }}>
              {fmtDate(result.result)}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtShort(result.base)} {result.operation === 'add' ? '+' : '−'}{' '}
              {[result.y > 0 && `${result.y}y`, result.mo > 0 && `${result.mo}mo`, result.d > 0 && `${result.d}d`].filter(Boolean).join(', ')}
              {' '}= {fmtShort(result.result)}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 3: Date info ─────────────────────────────────────────

function DateInfoMode() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [date, setDate] = useState(fmtInput(today));
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  function calculate() {
    const d = new Date(date + 'T00:00:00');
    if (isNaN(d)) { setError('Enter a valid date.'); setResult(null); return; }

    const dayOfYear   = getDayOfYear(d);
    const weekNum     = getWeekNumber(d);
    const quarter     = getQuarter(d);
    const leap        = isLeapYear(d.getFullYear());
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const dayOfWeek   = DAYS_OF_WEEK[d.getDay()];
    const isWeekend   = d.getDay() === 0 || d.getDay() === 6;
    const daysLeftInYear = (leap ? 366 : 365) - dayOfYear;
    const daysLeftInMonth = daysInMonth - d.getDate();

    // Days from today
    const diffToday = diffDetailed(today, d);
    const isFuture  = d > today;
    const isPast    = d < today;
    const isToday   = d.getTime() === today.getTime();

    setResult({
      d, dayOfYear, weekNum, quarter, leap, daysInMonth,
      dayOfWeek, isWeekend, daysLeftInYear, daysLeftInMonth,
      diffToday, isFuture, isPast, isToday,
    });
    setError('');
  }

  // Auto-calculate on first render
  useEffect(() => { calculate(); }, []);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Get detailed information about any date — day of the year, week number, quarter, and more.
      </p>

      <div className="form-group" style={{ maxWidth: '250px' }}>
        <label>Date</label>
        <input type="date" value={date}
          onChange={e => { setDate(e.target.value); setResult(null); setError(''); }} />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Get info</button>
        <button className="btn btn-ghost" onClick={() => { setDate(fmtInput(today)); setResult(null); setError(''); }}>Reset to today</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          {/* Banner */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: 'clamp(1rem,3vw,1.5rem)', fontWeight: 700, color: 'var(--accent-hover)' }}>
              {fmtDate(result.d)}
            </div>
            {result.isToday && <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>📍 Today</div>}
            {result.isFuture && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '4px' }}>
                {result.diffToday.totalDays} day{result.diffToday.totalDays !== 1 ? 's' : ''} from today
              </div>
            )}
            {result.isPast && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '4px' }}>
                {result.diffToday.totalDays} day{result.diffToday.totalDays !== 1 ? 's' : ''} ago
              </div>
            )}
          </div>

          <SectionTitle>Date details</SectionTitle>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Day of week"       value={result.dayOfWeek}      sub={result.isWeekend ? 'Weekend' : 'Weekday'} />
            <StatCard label="Day of year"        value={result.dayOfYear}      sub={`${result.daysLeftInYear} days left`} />
            <StatCard label="Week number"        value={`W${result.weekNum}`}  sub="ISO week" />
            <StatCard label="Quarter"            value={`Q${result.quarter}`}  sub={`Q${result.quarter} ${result.d.getFullYear()}`} />
            <StatCard label="Days in month"      value={result.daysInMonth}    sub={`${result.daysLeftInMonth} days left`} />
            <StatCard label="Leap year"          value={result.leap ? 'Yes' : 'No'} sub={`${result.d.getFullYear()}`} color={result.leap ? '#16a34a' : undefined} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Weekday calculator ────────────────────────────────

function WeekdayMode() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [date, setDate] = useState(fmtInput(today));
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  function calculate() {
    const d = new Date(date + 'T00:00:00');
    if (isNaN(d)) { setError('Enter a valid date.'); setResult(null); return; }

    const dow = d.getDay(); // 0=Sun
    // Find previous/next occurrences of each weekday
    const weekdays = DAYS_OF_WEEK.map((name, i) => {
      let diff = i - dow;
      if (diff < 0) diff += 7;
      if (diff === 0) diff = 7; // next occurrence (not today)
      const next = addDays(d, diff);
      const prev = addDays(d, diff - 7);
      return { name, next, prev, isToday: diff === 7 && i === dow };
    });

    // Next business day
    let nextBiz = addDays(d, 1);
    while (nextBiz.getDay() === 0 || nextBiz.getDay() === 6) nextBiz = addDays(nextBiz, 1);

    // Previous business day
    let prevBiz = addDays(d, -1);
    while (prevBiz.getDay() === 0 || prevBiz.getDay() === 6) prevBiz = addDays(prevBiz, -1);

    setResult({ d, dow, weekdays, nextBiz, prevBiz });
    setError('');
  }

  useEffect(() => { calculate(); }, []);

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find the next and previous occurrence of each weekday from any date, plus business day navigation.
      </p>

      <div className="form-group" style={{ maxWidth: '250px' }}>
        <label>Date</label>
        <input type="date" value={date}
          onChange={e => { setDate(e.target.value); setResult(null); setError(''); }} />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setDate(fmtInput(today)); setResult(null); setError(''); }}>Reset to today</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: '14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Selected date</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmtDate(result.d)}</div>
          </div>

          <SectionTitle>Business days</SectionTitle>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Next business day" value={fmtShort(result.nextBiz)} sub={DAYS_OF_WEEK[result.nextBiz.getDay()]} />
            <StatCard label="Prev business day" value={fmtShort(result.prevBiz)} sub={DAYS_OF_WEEK[result.prevBiz.getDay()]} />
          </div>

          <SectionTitle>Next &amp; previous weekday occurrences</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Weekday', 'Previous', 'Next'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.weekdays.map((w, i) => {
                  const isSelected = w.name === DAYS_OF_WEEK[result.dow];
                  return (
                    <tr key={w.name} style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {w.name} {isSelected && '(selected)'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-2)' }}>{fmtShort(w.prev)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--accent-hover)', fontWeight: 600 }}>{fmtShort(w.next)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Date Difference', desc: 'between two dates'     },
  { label: 'Add / Subtract',  desc: 'to / from a date'      },
  { label: 'Date Info',       desc: 'week, quarter, DOY...' },
  { label: 'Weekday Finder',  desc: 'next/prev weekdays'    },
];

export default function DateCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Date Calculator</span>
          </div>
          <h1>Date Calculator</h1>
          <p className="subtitle">
            Calculate the difference between dates, add or subtract time, explore date details, and find weekday occurrences — all in one tool.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <DifferenceMode />}
          {mode === 1 && <AddSubtractMode />}
          {mode === 2 && <DateInfoMode />}
          {mode === 3 && <WeekdayMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Date Calculator</h2>
          <p>
            This free date calculator handles every common date calculation in one place — running instantly in your browser with no sign-up required. Switch between four modes to handle different tasks.
          </p>
          <p>
            <strong>Date Difference</strong> calculates the exact duration between any two dates. Results are shown in years/months/days, total days, total weeks, total months, and total hours — useful for calculating ages, project durations, contract lengths, and time since or until any event. Quick-range presets let you instantly check the last 30 days, 90 days, last year, or year to date.
          </p>
          <p>
            <strong>Add / Subtract</strong> lets you add or subtract any combination of years, months, weeks, and days to or from a starting date. This is useful for finding deadlines, expiry dates, payment due dates, and scheduling. Quick-add buttons cover the most common offsets (7 days, 30 days, 3 months, 1 year).
          </p>
          <p>
            <strong>Date Info</strong> gives you a full breakdown of any date — the day of the week, ISO week number, day of the year (out of 365 or 366), calendar quarter (Q1–Q4), number of days in the month, days remaining in the year, and whether it falls in a leap year. It also shows how many days ago or in the future the date is relative to today.
          </p>
          <p>
            <strong>Weekday Finder</strong> shows the next and previous occurrence of every day of the week from any reference date, plus the next and previous business days — handy for scheduling meetings, calculating notice periods, and planning around weekends.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Date Calculations</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))' }}>
            {[
              { label: 'Jan 1 → Dec 31',        value: '364 days',   sub: 'days in a non-leap year' },
              { label: 'Jan 1 + 100 days',       value: 'Apr 11',     sub: 'add days to a date'      },
              { label: 'Today − 1 year',         value: 'Last year',  sub: 'subtract time from date' },
              { label: 'Mar 15 day of year',     value: 'Day 74',     sub: '291 days remaining'      },
              { label: 'Q3 dates',               value: 'Jul–Sep',    sub: 'calendar quarter'        },
              { label: 'Next Monday from Fri',   value: '+3 days',    sub: 'weekday navigation'      },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="date-calculator" />
      </div>
    </div>
  );
}
