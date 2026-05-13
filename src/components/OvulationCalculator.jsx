import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculations ─────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function fmtDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMed(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Ovulation = LMP + (cycle length - 14)
function getOvulationDate(lmpDate, cycleLength) {
  return addDays(lmpDate, cycleLength - 14);
}

// Fertile window: 5 days before + day of ovulation (peak is ovulation - 1)
function getFertileWindow(ovulationDate) {
  return {
    start:   addDays(ovulationDate, -5),
    end:     ovulationDate,
    peak1:   addDays(ovulationDate, -1),
    peak2:   ovulationDate,
  };
}

// Next period = LMP + cycle length
function getNextPeriod(lmpDate, cycleLength) {
  return addDays(lmpDate, cycleLength);
}

// Generate multiple cycles ahead
function generateCycles(lmpDate, cycleLength, lutealPhase, count = 6) {
  const cycles = [];
  for (let i = 0; i < count; i++) {
    const cycleLmp  = addDays(lmpDate, i * cycleLength);
    const ovulation = addDays(cycleLmp, cycleLength - lutealPhase);
    const fertile   = getFertileWindow(ovulation);
    const nextPeriod = addDays(cycleLmp, cycleLength);
    cycles.push({ index: i + 1, lmp: cycleLmp, ovulation, fertile, nextPeriod });
  }
  return cycles;
}

// Day type classification for a given date
function getDayType(date, cycles) {
  const t = date.getTime();
  for (const c of cycles) {
    if (diffDays(c.lmp, date) >= 0 && diffDays(c.lmp, date) < 5) return 'period';
    if (t === c.ovulation.getTime()) return 'ovulation';
    if (t === c.fertile.peak1.getTime()) return 'peak';
    if (t >= c.fertile.start.getTime() && t <= c.fertile.end.getTime()) return 'fertile';
  }
  return 'normal';
}

// Fertility score for a given day relative to ovulation (0-5 scale)
function fertilityScore(dayOffset) {
  // Relative to ovulation day (0)
  const scores = { '-5': 1, '-4': 1, '-3': 2, '-2': 3, '-1': 5, '0': 4 };
  return scores[String(dayOffset)] ?? 0;
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

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

function StatCard({ label, value, sub, accent, color, bg }) {
  return (
    <div style={{
      background: bg || (accent ? 'var(--accent-light)' : 'var(--surface2)'),
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
      <div style={{ fontSize: 'clamp(0.95rem,2.5vw,1.4rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.2, wordBreak: 'break-word' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

// ── Fertility score bar ───────────────────────────────────────

function FertilityScoreBar({ score }) {
  const max = 5;
  const blocks = Array.from({ length: max }, (_, i) => i < score);
  const colors = ['#fcd34d', '#f59e0b', '#f97316', '#ef4444', '#dc2626'];
  const color = score > 0 ? colors[Math.min(score - 1, colors.length - 1)] : '#e2e8f0';
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {blocks.map((filled, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: 2,
          background: filled ? color : 'var(--border)',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  );
}

// ── Calendar grid ─────────────────────────────────────────────

function CalendarMonth({ year, month, cycles, today }) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }

  function getStyle(date) {
    if (!date) return {};
    const isToday = date.getTime() === today.getTime();
    const type    = getDayType(date, cycles);
    const styles = {
      period:     { background: '#fde8e8', color: '#b91c1c', fontWeight: 700, border: '1px solid #fca5a5' },
      ovulation:  { background: '#ef4444', color: 'white',   fontWeight: 800 },
      peak:       { background: '#f97316', color: 'white',   fontWeight: 700 },
      fertile:    { background: '#fef9c3', color: '#92400e', fontWeight: 600, border: '1px solid #fcd34d' },
      normal:     { background: 'transparent', color: 'var(--text)' },
    };
    const base = styles[type] || styles.normal;
    return {
      ...base,
      outline: isToday ? '2px solid var(--accent)' : 'none',
      outlineOffset: isToday ? '1px' : 0,
    };
  }

  function getDot(date) {
    if (!date) return null;
    const type = getDayType(date, cycles);
    const dots = { ovulation: '★', peak: '♥', fertile: '·', period: '~' };
    return dots[type] || null;
  }

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', flex: '1 1 280px', minWidth: '260px' }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'center', marginBottom: '10px', color: 'var(--text)' }}>
        {monthName}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', padding: '3px 0' }}>
            {d}
          </div>
        ))}
        {cells.map((date, i) => (
          <div key={i} style={{
            aspectRatio: '1',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: '6px', fontSize: '0.75rem',
            cursor: date ? 'default' : 'default',
            ...getStyle(date),
          }}>
            {date && <span>{date.getDate()}</span>}
            {date && <span style={{ fontSize: '0.55rem', lineHeight: 1 }}>{getDot(date)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cycle detail card ─────────────────────────────────────────

function CycleCard({ cycle, today, isFirst }) {
  const todayTime = today.getTime();
  const daysToOv  = diffDays(today, cycle.ovulation);
  const inFertile = todayTime >= cycle.fertile.start.getTime() && todayTime <= cycle.fertile.end.getTime();
  const isOvDay   = cycle.ovulation.getTime() === todayTime;

  return (
    <div style={{
      background: isFirst ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${isFirst ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      flex: '1 1 280px',
      minWidth: '260px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isFirst ? 'var(--accent-hover)' : 'var(--text)' }}>
          Cycle {cycle.index}
        </span>
        {isFirst && (inFertile || isOvDay) && (
          <span style={{ background: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}>
            🔴 Fertile now
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.82rem' }}>
        {[
          { dot: '🔵', label: 'Period starts',   val: fmtMed(cycle.lmp) },
          {
            dot: '🟡', label: 'Fertile window',
            val: `${fmtShort(cycle.fertile.start)} – ${fmtShort(cycle.fertile.end)}`,
            sub: '5-day window',
          },
          {
            dot: '❤️', label: 'Peak fertility',
            val: `${fmtMed(cycle.fertile.peak1)}`,
            sub: '1 day before ovulation',
          },
          {
            dot: '⭐', label: 'Ovulation',
            val: fmtMed(cycle.ovulation),
            sub: isFirst && daysToOv > 0 ? `in ${daysToOv} day${daysToOv !== 1 ? 's' : ''}` :
                 isFirst && daysToOv === 0 ? 'today!' :
                 isFirst ? `${Math.abs(daysToOv)} days ago` : '',
          },
          { dot: '🔵', label: 'Next period',     val: fmtMed(cycle.nextPeriod) },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ flexShrink: 0, fontSize: '0.8rem', marginTop: '1px' }}>{row.dot}</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{row.label}: </span>
              <span style={{ fontFamily: 'var(--mono)', color: isFirst ? 'var(--accent-hover)' : 'var(--text)', fontWeight: 600 }}>{row.val}</span>
              {row.sub && <span style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginLeft: '4px' }}>({row.sub})</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fertility timeline ────────────────────────────────────────

function FertilityTimeline({ cycle }) {
  const { ovulation } = cycle;
  const days = [-5, -4, -3, -2, -1, 0];
  const labels = {
    '-5': 'Low',
    '-4': 'Low',
    '-3': 'Medium',
    '-2': 'High',
    '-1': 'Peak ❤️',
    '0':  'Ovulation ⭐',
  };

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', marginTop: '10px', paddingBottom: '4px' }}>
      {days.map(offset => {
        const date  = addDays(ovulation, offset);
        const score = fertilityScore(offset);
        const isOv  = offset === 0;
        const isPeak = offset === -1;
        return (
          <div key={offset} style={{
            flex: '0 0 80px', textAlign: 'center',
            background: isOv ? '#ef4444' : isPeak ? '#f97316' : score >= 3 ? '#fef9c3' : 'var(--surface2)',
            border: `1px solid ${isOv ? '#dc2626' : isPeak ? '#ea580c' : score >= 3 ? '#fcd34d' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '10px 8px',
          }}>
            <div style={{ fontSize: '0.68rem', color: isOv || isPeak ? 'rgba(255,255,255,0.8)' : 'var(--text-3)', fontWeight: 700, marginBottom: '4px' }}>
              {fmtShort(date)}
            </div>
            <FertilityScoreBar score={score} />
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isOv || isPeak ? 'white' : 'var(--text)', marginTop: '4px' }}>
              {labels[String(offset)]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function OvulationCalculator() {
  const [lmp, setLmp]             = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [lutealPhase, setLutealPhase] = useState('14');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');
  const [showAll, setShowAll]     = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = fmtInputDate(today);
  const minDate = fmtInputDate(addDays(today, -90));

  function calculate() {
    if (!lmp) { setError('Enter the first day of your last period.'); setResult(null); return; }
    const lmpDate = new Date(lmp + 'T00:00:00');
    if (isNaN(lmpDate)) { setError('Enter a valid date.'); setResult(null); return; }
    if (lmpDate > today) { setError('Last period date cannot be in the future.'); setResult(null); return; }

    const cl = parseInt(cycleLength);
    const lp = parseInt(lutealPhase);

    if (isNaN(cl) || cl < 20 || cl > 45) { setError('Cycle length must be 20–45 days.'); setResult(null); return; }
    if (isNaN(lp) || lp < 10 || lp > 16) { setError('Luteal phase must be 10–16 days.'); setResult(null); return; }
    if (lp >= cl) { setError('Luteal phase must be shorter than cycle length.'); setResult(null); return; }

    const cycles = generateCycles(lmpDate, cl, lp, 6);
    const currentCycle = cycles[0];

    setResult({ cycles, currentCycle, lmpDate, cycleLength: cl, lutealPhase: lp });
    setError('');
  }

  function copy() {
    if (!result) return;
    const c = result.currentCycle;
    const lines = [
      `Ovulation date: ${fmtDate(c.ovulation)}`,
      `Fertile window: ${fmtShort(c.fertile.start)} – ${fmtShort(c.fertile.end)}`,
      `Peak fertility: ${fmtMed(c.fertile.peak1)}`,
      `Next period: ${fmtMed(c.nextPeriod)}`,
      `Cycle length: ${result.cycleLength} days`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  // Which cycles are shown
  const visibleCycles = result
    ? (showAll ? result.cycles : result.cycles.slice(0, 3))
    : [];

  // Calendar months to show (current + next 2)
  const calMonths = result
    ? [
        { y: today.getFullYear(), m: today.getMonth() },
        { y: today.getFullYear() + (today.getMonth() >= 11 ? 1 : 0), m: (today.getMonth() + 1) % 12 },
        { y: today.getFullYear() + (today.getMonth() >= 10 ? 1 : 0), m: (today.getMonth() + 2) % 12 },
      ]
    : [];

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Ovulation Calculator</span>
          </div>
          <h1>Ovulation Calculator</h1>
          <p className="subtitle">
            Find your most fertile days, ovulation date, and fertile window for the next 6 cycles — with a colour-coded calendar and daily fertility ratings.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>First day of last period</label>
              <input
                type="date"
                value={lmp}
                onChange={e => { setLmp(e.target.value); setResult(null); setError(''); }}
                max={maxDate}
                min={minDate}
              />
            </div>
            <div className="form-group">
              <label>Cycle length (days)</label>
              <input
                type="number"
                value={cycleLength}
                min="20" max="45"
                onChange={e => { setCycleLength(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="28"
              />
            </div>
            <div className="form-group">
              <label>Luteal phase (days)
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}> — usually 14</span>
              </label>
              <input
                type="number"
                value={lutealPhase}
                min="10" max="16"
                onChange={e => { setLutealPhase(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="14"
              />
            </div>
          </div>

          {/* Quick cycle presets */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Common cycle lengths
            </p>
            <div className="tag-row">
              {['24', '26', '28', '30', '32', '35'].map(cl => (
                <button
                  key={cl}
                  className={`tag${cycleLength === cl ? ' active' : ''}`}
                  onClick={() => { setCycleLength(cl); setResult(null); }}
                >
                  {cl} days
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => { setLmp(''); setCycleLength('28'); setLutealPhase('14'); setResult(null); setError(''); }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Primary result banner */}
              <div style={{
                background: 'var(--accent-light)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Next ovulation
                </div>
                <div style={{ fontSize: 'clamp(1.2rem,4vw,2rem)', fontWeight: 700, color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {fmtDate(result.currentCycle.ovulation)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '6px' }}>
                  Fertile window: <strong>{fmtShort(result.currentCycle.fertile.start)}</strong> – <strong>{fmtShort(result.currentCycle.fertile.end)}</strong>
                  &nbsp;·&nbsp;Peak: <strong>{fmtMed(result.currentCycle.fertile.peak1)}</strong>
                </div>
              </div>

              {/* Key stats */}
              <SectionTitle>This cycle at a glance</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="Ovulation date" value={fmtShort(result.currentCycle.ovulation)} sub={`day ${result.cycleLength - result.lutealPhase} of cycle`} />
                <StatCard label="Fertile window" value={`${fmtShort(result.currentCycle.fertile.start)} – ${fmtShort(result.currentCycle.fertile.end)}`} sub="6-day fertile window" />
                <StatCard label="Peak fertility" value={fmtMed(result.currentCycle.fertile.peak1)} sub="highest chance" color="#f97316" />
                <StatCard label="Next period" value={fmtShort(result.currentCycle.nextPeriod)} sub={`in ${Math.max(0, diffDays(today, result.currentCycle.nextPeriod))} days`} />
              </div>

              {/* Fertility timeline */}
              <SectionTitle>Daily fertility rating</SectionTitle>
              <FertilityTimeline cycle={result.currentCycle} />
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4 }} />Ovulation</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f97316', borderRadius: 2, marginRight: 4 }} />Peak fertility</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fef9c3', borderRadius: 2, marginRight: 4 }} />Fertile</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--surface2)', borderRadius: 2, marginRight: 4, border: '1px solid var(--border)' }} />Low fertility</span>
              </div>

              {/* Calendar */}
              <SectionTitle>Calendar view</SectionTitle>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {calMonths.map(({ y, m }) => (
                  <CalendarMonth key={`${y}-${m}`} year={y} month={m} cycles={result.cycles} today={today} />
                ))}
              </div>

              {/* Cycle cards */}
              <SectionTitle>Next {visibleCycles.length} cycles</SectionTitle>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {visibleCycles.map(c => (
                  <CycleCard key={c.index} cycle={c} today={today} isFirst={c.index === 1} />
                ))}
              </div>

              {result.cycles.length > 3 && (
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: '12px' }}
                  onClick={() => setShowAll(v => !v)}
                >
                  {showAll ? 'Show fewer cycles' : 'Show all 6 cycles'}
                </button>
              )}

              {/* Cycle summary */}
              <SectionTitle>Cycle summary</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Cycle length" value={`${result.cycleLength} days`} sub="follicular + luteal" />
                <StatCard label="Luteal phase" value={`${result.lutealPhase} days`} sub="post-ovulation" />
                <StatCard label="Follicular phase" value={`${result.cycleLength - result.lutealPhase} days`} sub="pre-ovulation" />
              </div>

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ These are estimates based on your reported cycle length. Actual ovulation can vary due to stress, illness, and hormonal changes. For family planning or fertility treatment, consult a healthcare provider or use ovulation predictor kits (OPKs) for confirmation.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Ovulation Calculator</h2>
          <p>
            Enter the first day of your last menstrual period (LMP), your typical cycle length, and your luteal phase length (usually 14 days), then press Calculate. You'll instantly see your ovulation date, fertile window, peak fertility days, and a 6-cycle forecast — all shown on a colour-coded calendar.
          </p>
          <p>
            <strong>How ovulation is estimated:</strong> Ovulation typically occurs 14 days before the next period (the luteal phase). For a standard 28-day cycle, this means ovulation on day 14. For a 30-day cycle, it shifts to day 16. For a 26-day cycle, it's day 12. The formula is: <em>cycle length − luteal phase = ovulation day</em>. If you're unsure of your luteal phase, the default of 14 days is appropriate for most people.
          </p>
          <p>
            <strong>The fertile window</strong> spans the 5 days before ovulation plus ovulation day itself — 6 days total. This is because sperm can survive inside the reproductive tract for up to 5 days. The highest probability of conception occurs the day before ovulation (peak fertility) and on ovulation day itself. The daily fertility timeline shows each day's relative conception probability on a 5-point scale.
          </p>
          <p>
            The <strong>colour-coded calendar</strong> marks period days in red, fertile days in yellow, peak fertility in orange, and ovulation in bright red — making it easy to see your window at a glance across the current and next two months. Up to 6 future cycles are shown in the cycle cards, each with exact dates for all key events.
          </p>
          <p>
            Cycle length can vary month to month, so this calculator gives estimates based on your average. For more precision, track your basal body temperature (BBT), cervical mucus changes, or use LH surge tests alongside this calculator.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Ovulation Date Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'LMP Jan 1, 28-day cycle',  ov: 'Jan 15',  fertile: 'Jan 10 – Jan 15' },
              { label: 'LMP Jan 1, 30-day cycle',  ov: 'Jan 17',  fertile: 'Jan 12 – Jan 17' },
              { label: 'LMP Jan 1, 32-day cycle',  ov: 'Jan 19',  fertile: 'Jan 14 – Jan 19' },
              { label: 'LMP Jan 1, 26-day cycle',  ov: 'Jan 13',  fertile: 'Jan 8 – Jan 13'  },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.ov}</div>
                <div className="stat-label">{ex.fertile}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="ovulation-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
