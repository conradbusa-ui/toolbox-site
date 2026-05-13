import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Date helpers ──────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function fmtDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtDateShort(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Naegele's rule: LMP + 280 days (40 weeks)
function dueFromLMP(lmpDate) {
  return addDays(lmpDate, 280);
}

// From conception: conception + 266 days (38 weeks)
function dueFromConception(conceptionDate) {
  return addDays(conceptionDate, 266);
}

// From IVF transfer: 5-day blastocyst = transfer + 261 days
function dueFromIVF(transferDate, embryoAge = 5) {
  return addDays(transferDate, 266 - embryoAge);
}

// Trimester info
function getTrimester(weeksPregnant) {
  if (weeksPregnant < 1)  return null;
  if (weeksPregnant <= 13) return { num: 1, label: 'First trimester',  weeks: '1–13',  color: '#7c3aed' };
  if (weeksPregnant <= 26) return { num: 2, label: 'Second trimester', weeks: '14–26', color: '#0891b2' };
  if (weeksPregnant <= 40) return { num: 3, label: 'Third trimester',  weeks: '27–40', color: '#0d9488' };
  return                             { num: 3, label: 'Overdue',         weeks: '40+',   color: '#dc2626' };
}

function getWeeksPregnant(lmpDate, today = new Date()) {
  const days = diffDays(lmpDate, today);
  return Math.max(0, Math.floor(days / 7));
}

function getDaysRemainingInWeek(lmpDate, today = new Date()) {
  const days = diffDays(lmpDate, today);
  return days % 7;
}

// Key milestones from LMP
function getMilestones(lmpDate) {
  return [
    { week: 6,  label: 'Heartbeat detectable',         date: addDays(lmpDate, 6 * 7) },
    { week: 8,  label: 'First prenatal visit (typical)',date: addDays(lmpDate, 8 * 7) },
    { week: 10, label: 'NIPT / genetic screening',     date: addDays(lmpDate, 10 * 7) },
    { week: 12, label: 'End of first trimester',       date: addDays(lmpDate, 12 * 7) },
    { week: 13, label: 'Nuchal translucency scan',     date: addDays(lmpDate, 13 * 7) },
    { week: 16, label: 'Anatomy visible',              date: addDays(lmpDate, 16 * 7) },
    { week: 18, label: 'Anatomy scan (18–20w)',        date: addDays(lmpDate, 18 * 7) },
    { week: 20, label: 'Halfway point',                date: addDays(lmpDate, 20 * 7) },
    { week: 24, label: 'Viability milestone',          date: addDays(lmpDate, 24 * 7) },
    { week: 28, label: 'Third trimester begins',       date: addDays(lmpDate, 28 * 7) },
    { week: 32, label: 'Growth scan (typical)',        date: addDays(lmpDate, 32 * 7) },
    { week: 36, label: 'Baby considered early term',   date: addDays(lmpDate, 36 * 7) },
    { week: 37, label: 'Full term begins',             date: addDays(lmpDate, 37 * 7) },
    { week: 39, label: 'Full term (optimal)',          date: addDays(lmpDate, 39 * 7) },
    { week: 40, label: 'Due date (EDD)',               date: addDays(lmpDate, 40 * 7), highlight: true },
    { week: 42, label: 'Post-term threshold',          date: addDays(lmpDate, 42 * 7) },
  ];
}

// ── Shared UI ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '26px', marginBottom: '10px',
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
      flex: '1 1 130px',
      minWidth: '115px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.2, wordBreak: 'break-word' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Progress bar ──────────────────────────────────────────────

function PregnancyProgress({ weeksPregnant, daysExtra }) {
  const totalWeeks = 40;
  const pct = Math.min((weeksPregnant / totalWeeks) * 100, 100);
  const tri = getTrimester(weeksPregnant);

  const zones = [
    { label: 'T1', pct: (13 / 40) * 100, color: '#7c3aed' },
    { label: 'T2', pct: (26 / 40) * 100, color: '#0891b2' },
    { label: 'T3', pct: 100,             color: '#0d9488' },
  ];

  if (weeksPregnant <= 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ position: 'relative', height: '14px', borderRadius: '99px', overflow: 'hidden', background: 'var(--surface2)', marginBottom: '8px' }}>
        {/* Zone stripes */}
        {zones.map((z, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: i === 0 ? 0 : `${zones[i-1].pct}%`,
            width: `${z.pct - (i > 0 ? zones[i-1].pct : 0)}%`,
            background: z.color, opacity: 0.18,
          }} />
        ))}
        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: `linear-gradient(to right, #7c3aed, #0891b2, #0d9488)`,
          borderRadius: '99px',
          transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-3)' }}>
        <span style={{ color: '#7c3aed', fontWeight: 700 }}>Week 1</span>
        <span style={{ color: '#0891b2', fontWeight: 700 }}>Week 14</span>
        <span style={{ color: '#0d9488', fontWeight: 700 }}>Week 27</span>
        <span style={{ color: '#0d9488', fontWeight: 700 }}>Week 40</span>
      </div>
      {tri && (
        <div style={{
          marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '7px 14px', borderRadius: 'var(--radius-sm)',
          background: `${tri.color}18`, border: `1px solid ${tri.color}`,
          fontSize: '0.82rem', fontWeight: 700, color: tri.color,
        }}>
          {tri.label} (weeks {tri.weeks}) — week {weeksPregnant}
          {daysExtra > 0 && ` + ${daysExtra} day${daysExtra !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}

// ── Milestones timeline ───────────────────────────────────────

function MilestonesTable({ milestones, today, lmpDate }) {
  const todayTime = today.getTime();

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Week', 'Milestone', 'Date', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {milestones.map((m, i) => {
            const isPast   = m.date.getTime() < todayTime;
            const isToday  = diffDays(m.date, today) === 0;
            const isFuture = m.date.getTime() > todayTime;
            const daysAway = diffDays(today, m.date);
            const bg = m.highlight ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent';
            const statusColor = isPast ? '#94a3b8' : m.highlight ? 'var(--accent-hover)' : '#16a34a';

            return (
              <tr key={m.week} style={{ borderBottom: '1px solid var(--border)', background: bg, opacity: isPast ? 0.7 : 1 }}>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: m.highlight ? 'var(--accent-hover)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  W{m.week}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: m.highlight ? 700 : 500, color: m.highlight ? 'var(--accent-hover)' : 'var(--text)' }}>
                  {m.label} {m.highlight && '⭐'}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {fmtDateShort(m.date)}
                </td>
                <td style={{ padding: '8px 12px', fontSize: '0.78rem', fontWeight: 600, color: statusColor, whiteSpace: 'nowrap' }}>
                  {isPast  ? '✓ Passed' :
                   isToday ? '📍 Today!' :
                   daysAway <= 7 ? `In ${daysAway} day${daysAway !== 1 ? 's' : ''}` :
                   `In ${Math.ceil(daysAway / 7)}w`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const METHODS = [
  { id: 'lmp',        label: 'Last Period (LMP)',   desc: 'most common method' },
  { id: 'conception', label: 'Conception date',     desc: 'known date of conception' },
  { id: 'ivf',        label: 'IVF transfer',        desc: 'embryo transfer date' },
  { id: 'ultrasound', label: 'Ultrasound date',     desc: 'gestational age known' },
];

// ── Main component ────────────────────────────────────────────

export default function PregnancyDueDateCalculator() {
  const [method, setMethod]     = useState('lmp');
  const [lmp, setLmp]           = useState('');
  const [conceptionDate, setConceptionDate] = useState('');
  const [ivfDate, setIvfDate]   = useState('');
  const [embryoAge, setEmbryoAge] = useState('5');
  const [usDate, setUsDate]     = useState('');
  const [usWeeks, setUsWeeks]   = useState('');
  const [usDays, setUsDays]     = useState('0');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function calculate() {
    let dueDate, lmpDate;

    try {
      if (method === 'lmp') {
        if (!lmp) { setError('Enter your last menstrual period (LMP) date.'); setResult(null); return; }
        lmpDate = new Date(lmp + 'T00:00:00');
        if (isNaN(lmpDate)) { setError('Enter a valid date.'); setResult(null); return; }
        if (lmpDate > today) { setError('LMP date cannot be in the future.'); setResult(null); return; }
        const daysAgo = diffDays(lmpDate, today);
        if (daysAgo > 400) { setError('LMP date seems too far in the past (more than ~13 months ago).'); setResult(null); return; }
        dueDate = dueFromLMP(lmpDate);

      } else if (method === 'conception') {
        if (!conceptionDate) { setError('Enter your conception date.'); setResult(null); return; }
        const cd = new Date(conceptionDate + 'T00:00:00');
        if (isNaN(cd)) { setError('Enter a valid date.'); setResult(null); return; }
        if (cd > today) { setError('Conception date cannot be in the future.'); setResult(null); return; }
        dueDate = dueFromConception(cd);
        lmpDate = addDays(cd, -14); // estimate LMP as 14 days before conception

      } else if (method === 'ivf') {
        if (!ivfDate) { setError('Enter your embryo transfer date.'); setResult(null); return; }
        const td = new Date(ivfDate + 'T00:00:00');
        if (isNaN(td)) { setError('Enter a valid date.'); setResult(null); return; }
        if (td > today) { setError('Transfer date cannot be in the future.'); setResult(null); return; }
        const ea = parseInt(embryoAge) || 5;
        dueDate = dueFromIVF(td, ea);
        lmpDate = addDays(td, -(14 + ea)); // estimate LMP

      } else if (method === 'ultrasound') {
        if (!usDate) { setError('Enter the ultrasound scan date.'); setResult(null); return; }
        const weeks = parseInt(usWeeks);
        const days  = parseInt(usDays) || 0;
        if (isNaN(weeks) || weeks < 4 || weeks > 40) { setError('Enter a valid gestational age in weeks (4–40).'); setResult(null); return; }
        const sd = new Date(usDate + 'T00:00:00');
        if (isNaN(sd)) { setError('Enter a valid scan date.'); setResult(null); return; }
        // Work backwards to find LMP
        const totalDaysGestation = weeks * 7 + days;
        lmpDate = addDays(sd, -totalDaysGestation);
        dueDate = addDays(lmpDate, 280);
      }

      const daysUntilDue = diffDays(today, dueDate);
      const weeksPregnant = getWeeksPregnant(lmpDate, today);
      const daysExtra     = getDaysRemainingInWeek(lmpDate, today);
      const tri = getTrimester(weeksPregnant);
      const milestones = getMilestones(lmpDate);
      const conceptionEst = addDays(lmpDate, 14);

      setResult({
        dueDate, lmpDate, daysUntilDue, weeksPregnant, daysExtra,
        tri, milestones, conceptionEst,
      });
      setError('');
    } catch (e) {
      setError('Something went wrong. Please check your dates.');
      setResult(null);
    }
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Due date (EDD): ${fmtDate(result.dueDate)}`,
      `Currently: ${result.weeksPregnant} weeks${result.daysExtra ? ` and ${result.daysExtra} days` : ''} pregnant`,
      `Days until due date: ${result.daysUntilDue}`,
      `LMP (estimated): ${fmtDateShort(result.lmpDate)}`,
      `Trimester: ${result.tri?.label || 'N/A'}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  // Max LMP date = today, min = ~14 months ago
  const maxDate = fmtDateInput(today);
  const minDate = fmtDateInput(addDays(today, -420));

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Pregnancy Due Date Calculator</span>
          </div>
          <h1>Pregnancy Due Date Calculator</h1>
          <p className="subtitle">
            Calculate your estimated due date (EDD), current gestational age, and key pregnancy milestones — using last period, conception date, IVF transfer, or ultrasound date.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Method selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '22px' }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => { setMethod(m.id); setResult(null); setError(''); }}
                style={{
                  background: method === m.id ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${method === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: method === m.id ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* ── LMP inputs ── */}
          {method === 'lmp' && (
            <div className="form-group">
              <label>First day of your last menstrual period</label>
              <input type="date" value={lmp}
                onChange={e => { setLmp(e.target.value); setResult(null); setError(''); }}
                max={maxDate} min={minDate} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '5px' }}>
                Uses Naegele's rule: LMP + 280 days (40 weeks).
              </p>
            </div>
          )}

          {/* ── Conception inputs ── */}
          {method === 'conception' && (
            <div className="form-group">
              <label>Date of conception</label>
              <input type="date" value={conceptionDate}
                onChange={e => { setConceptionDate(e.target.value); setResult(null); setError(''); }}
                max={maxDate} min={minDate} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '5px' }}>
                Due date = conception date + 266 days (38 weeks).
              </p>
            </div>
          )}

          {/* ── IVF inputs ── */}
          {method === 'ivf' && (
            <>
              <div className="form-group">
                <label>Embryo transfer date</label>
                <input type="date" value={ivfDate}
                  onChange={e => { setIvfDate(e.target.value); setResult(null); setError(''); }}
                  max={maxDate} min={minDate} />
              </div>
              <div className="form-group">
                <label>Embryo age at transfer (days)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['3', '5', '6'].map(d => (
                    <button key={d}
                      className={`tag${embryoAge === d ? ' active' : ''}`}
                      onClick={() => { setEmbryoAge(d); setResult(null); }}>
                      Day {d} {d === '5' ? '(blastocyst)' : d === '3' ? '(cleavage)' : '(expanded)'}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '-8px', marginBottom: '14px' }}>
                Due date = transfer date + (266 − embryo age) days.
              </p>
            </>
          )}

          {/* ── Ultrasound inputs ── */}
          {method === 'ultrasound' && (
            <>
              <div className="form-group">
                <label>Ultrasound scan date</label>
                <input type="date" value={usDate}
                  onChange={e => { setUsDate(e.target.value); setResult(null); setError(''); }}
                  max={maxDate} min={minDate} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gestational age (weeks)</label>
                  <input type="number" value={usWeeks} min="4" max="40"
                    onChange={e => { setUsWeeks(e.target.value); setResult(null); setError(''); }}
                    placeholder="e.g. 12" />
                </div>
                <div className="form-group">
                  <label>Additional days (0–6)</label>
                  <input type="number" value={usDays} min="0" max="6"
                    onChange={e => { setUsDays(e.target.value); setResult(null); setError(''); }}
                    placeholder="0" />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '-8px', marginBottom: '14px' }}>
                Enter the gestational age shown on your ultrasound report.
              </p>
            </>
          )}

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate}>Calculate due date</button>
            <button className="btn btn-ghost" onClick={() => {
              setLmp(''); setConceptionDate(''); setIvfDate(''); setUsDate(''); setUsWeeks(''); setUsDays('0');
              setResult(null); setError('');
            }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Due date banner */}
              <div style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                textAlign: 'center',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Estimated Due Date (EDD)
                </div>
                <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {fmtDate(result.dueDate)}
                </div>
                {result.daysUntilDue > 0 && (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '8px' }}>
                    {result.daysUntilDue} days to go · approx. {Math.floor(result.daysUntilDue / 7)} weeks away
                  </div>
                )}
                {result.daysUntilDue <= 0 && (
                  <div style={{ fontSize: '0.88rem', color: '#dc2626', marginTop: '8px', fontWeight: 600 }}>
                    {result.daysUntilDue === 0 ? '🎉 Today is your due date!' : `${Math.abs(result.daysUntilDue)} days past due date`}
                  </div>
                )}
              </div>

              {/* Key stats */}
              <SectionTitle>Gestational age today</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="Weeks pregnant"
                  value={`${result.weeksPregnant}w ${result.daysExtra}d`}
                  sub={`${result.weeksPregnant * 7 + result.daysExtra} days total`}
                />
                <StatCard accent label="Days until due"
                  value={result.daysUntilDue > 0 ? result.daysUntilDue : result.daysUntilDue === 0 ? 'Today!' : `+${Math.abs(result.daysUntilDue)}`}
                  sub={result.daysUntilDue > 0 ? `≈ ${Math.floor(result.daysUntilDue / 7)} weeks remaining` : 'past due date'}
                  color={result.daysUntilDue <= 0 ? '#dc2626' : undefined}
                />
                {result.tri && (
                  <StatCard label="Trimester"
                    value={`${result.tri.num}${['st','nd','rd'][result.tri.num-1]}`}
                    sub={result.tri.label}
                    color={result.tri.color}
                  />
                )}
                <StatCard label="Completion"
                  value={`${Math.min(Math.round(((result.weeksPregnant * 7 + result.daysExtra) / 280) * 100), 100)}%`}
                  sub="of 40 weeks"
                />
              </div>

              {/* Progress bar */}
              <PregnancyProgress weeksPregnant={result.weeksPregnant} daysExtra={result.daysExtra} />

              {/* Key dates */}
              <SectionTitle>Key dates</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="LMP date"
                  value={fmtDateShort(result.lmpDate)}
                  sub={method === 'lmp' ? 'as entered' : 'estimated'} />
                <StatCard label="Est. conception"
                  value={fmtDateShort(result.conceptionEst)}
                  sub="LMP + 14 days" />
                <StatCard label="End of T1"
                  value={fmtDateShort(addDays(result.lmpDate, 13 * 7))}
                  sub="week 13" />
                <StatCard label="End of T2"
                  value={fmtDateShort(addDays(result.lmpDate, 26 * 7))}
                  sub="week 26" />
              </div>

              {/* Milestones */}
              <SectionTitle>Pregnancy milestones</SectionTitle>
              <MilestonesTable milestones={result.milestones} today={today} lmpDate={result.lmpDate} />

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ The estimated due date (EDD) is an approximation. Only about 5% of babies are born on their due date. Your healthcare provider may adjust your EDD based on ultrasound measurements. This tool is not a substitute for professional medical advice.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How Is a Due Date Calculated?</h2>
          <p>
            An estimated due date (EDD) is typically calculated using <strong>Naegele's rule</strong> — one of the oldest and most widely used methods in obstetrics. The rule adds 280 days (40 weeks) to the first day of your last menstrual period (LMP). This assumes a standard 28-day cycle with ovulation on day 14, which gives a 38-week period from conception to birth.
          </p>
          <p>
            This calculator supports four calculation methods. The <strong>LMP method</strong> is the most common and is used by most healthcare providers when no other data is available. The <strong>conception date method</strong> is useful when you know the date of ovulation or intercourse and adds 266 days (38 weeks). The <strong>IVF transfer method</strong> calculates from the embryo transfer date, adjusting for whether a day-3, day-5, or day-6 blastocyst was transferred. The <strong>ultrasound method</strong> works backwards from the gestational age measured at a scan to find the equivalent LMP, then applies the standard 280-day formula.
          </p>
          <p>
            Gestational age is measured in <strong>weeks and days from LMP</strong>, not from conception — so "4 weeks pregnant" actually means 4 weeks since your last period, with the embryo being about 2 weeks old. This can be confusing but is the universal clinical standard. The calculator shows your current gestational age in weeks and days, your trimester, percentage of pregnancy completed, and all key milestone dates.
          </p>
          <p>
            The <strong>milestones table</strong> shows important events such as the first heartbeat (week 6), the end of the first trimester (week 12–13), the anatomy scan window (weeks 18–20), the viability milestone (week 24), and when the baby is considered full term (week 37–39). Each milestone shows the estimated date and how many weeks or days away it is.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Due Date Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'LMP: Jan 1, 2025',     due: 'Oct 8, 2025',   note: 'Naegele\'s rule' },
              { label: 'LMP: Mar 15, 2025',    due: 'Dec 20, 2025',  note: 'Naegele\'s rule' },
              { label: 'Conception: Feb 14',   due: 'Nov 7, 2025',   note: '+266 days' },
              { label: 'IVF day-5: Apr 1',     due: 'Dec 15, 2025',  note: '+261 days' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1rem' }}>{ex.due}</div>
                <div className="stat-label">{ex.note}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="pregnancy-due-date-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
