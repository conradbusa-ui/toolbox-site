import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Grade scale ───────────────────────────────────────────────

const GRADE_SCALE = [
  { letter: 'A+', min: 97, color: '#7c3aed' },
  { letter: 'A',  min: 93, color: '#0d9488' },
  { letter: 'A-', min: 90, color: '#0d9488' },
  { letter: 'B+', min: 87, color: '#0891b2' },
  { letter: 'B',  min: 83, color: '#0891b2' },
  { letter: 'B-', min: 80, color: '#0891b2' },
  { letter: 'C+', min: 77, color: '#16a34a' },
  { letter: 'C',  min: 73, color: '#16a34a' },
  { letter: 'C-', min: 70, color: '#16a34a' },
  { letter: 'D+', min: 67, color: '#f59e0b' },
  { letter: 'D',  min: 63, color: '#f59e0b' },
  { letter: 'D-', min: 60, color: '#f97316' },
  { letter: 'F',  min: 0,  color: '#dc2626' },
];

function pctToLetter(pct) {
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

function letterColor(pct) {
  return pctToLetter(pct).color;
}

function fmt(n, dp = 2) {
  return isFinite(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
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
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Grade progress bar ────────────────────────────────────────

function GradeBar({ pct }) {
  const grade = pctToLetter(pct);
  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ position: 'relative', height: '12px', borderRadius: '99px', background: 'var(--surface2)', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${Math.min(pct, 100)}%`,
          background: `linear-gradient(to right, #dc2626, #f59e0b, #16a34a, #0891b2, #0d9488, #7c3aed)`,
          borderRadius: '99px',
          transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: '10px' }}>
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', borderRadius: 'var(--radius-sm)',
        background: `${grade.color}18`, border: `1px solid ${grade.color}`,
        fontSize: '0.88rem', fontWeight: 700, color: grade.color,
      }}>
        {grade.letter} &nbsp;·&nbsp; {fmt(pct, 1)}%
      </div>
    </div>
  );
}

// ── Mode 1: Weighted grade calculator ────────────────────────

const EMPTY_ASSIGNMENT = { name: '', score: '', maxScore: '100', weight: '' };

function WeightedMode() {
  const [assignments, setAssignments] = useState([
    { name: 'Homework',   score: '', maxScore: '100', weight: '20' },
    { name: 'Midterm',    score: '', maxScore: '100', weight: '30' },
    { name: 'Final Exam', score: '', maxScore: '100', weight: '50' },
  ]);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  function update(i, field, val) {
    setAssignments(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
    setResult(null); setError('');
  }

  function addRow() {
    setAssignments(prev => [...prev, { ...EMPTY_ASSIGNMENT, name: `Item ${prev.length + 1}` }]);
  }

  function removeRow(i) {
    if (assignments.length <= 1) return;
    setAssignments(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  }

  function calculate() {
    const rows = assignments.map(a => ({
      ...a,
      score:    parseFloat(a.score),
      maxScore: parseFloat(a.maxScore) || 100,
      weight:   parseFloat(a.weight) || 0,
    }));

    const valid = rows.filter(r => !isNaN(r.score) && r.weight > 0);
    if (valid.length === 0) { setError('Enter scores and weights for at least one item.'); setResult(null); return; }

    const negScore = valid.find(r => r.score < 0 || r.maxScore <= 0);
    if (negScore) { setError('Scores must be positive and max score must be greater than 0.'); setResult(null); return; }

    const totalWeight = valid.reduce((s, r) => s + r.weight, 0);
    const weightedSum = valid.reduce((s, r) => s + (r.score / r.maxScore) * 100 * r.weight, 0);
    const finalPct    = weightedSum / totalWeight;

    const breakdown = valid.map(r => ({
      ...r,
      pct:         (r.score / r.maxScore) * 100,
      contribution: (r.score / r.maxScore) * 100 * (r.weight / totalWeight),
    }));

    setResult({ finalPct, totalWeight, breakdown });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Final grade: ${fmt(result.finalPct, 1)}% (${pctToLetter(result.finalPct).letter})`,
      '',
      ...result.breakdown.map(r => `${r.name}: ${fmt(r.pct, 1)}% (weight ${r.weight}%)`),
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const totalWeight = assignments.reduce((s, a) => s + (parseFloat(a.weight) || 0), 0);
  const weightWarning = Math.abs(totalWeight - 100) > 0.5 && totalWeight > 0;

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate your overall grade when each assignment or category has a different weight. Weights don't need to sum to 100% — they're normalised automatically.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '480px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Assignment / Category', 'Score', 'Out of', 'Weight (%)', '%', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, i) => {
              const pct = parseFloat(a.score) >= 0 && parseFloat(a.maxScore) > 0
                ? (parseFloat(a.score) / parseFloat(a.maxScore)) * 100
                : null;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="text" value={a.name}
                      onChange={e => update(i, 'name', e.target.value)}
                      placeholder={`Item ${i + 1}`}
                      style={{ fontSize: '0.85rem', width: '140px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.score} min="0"
                      onChange={e => update(i, 'score', e.target.value)}
                      placeholder="85" style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', width: '70px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.maxScore} min="1"
                      onChange={e => update(i, 'maxScore', e.target.value)}
                      style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '85px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={a.weight} min="0" max="100"
                      onChange={e => update(i, 'weight', e.target.value)}
                      placeholder="25" style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '65px' }} />
                  </td>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.85rem', color: pct !== null ? letterColor(pct) : 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {pct !== null ? `${fmt(pct, 1)}%` : '—'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <button onClick={() => removeRow(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '4px 6px', borderRadius: '4px' }}
                      onMouseEnter={e => e.target.style.color = '#dc2626'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Weight total indicator */}
      <div style={{ marginTop: '8px', fontSize: '0.78rem', color: weightWarning ? '#f59e0b' : '#16a34a', fontWeight: 600 }}>
        {weightWarning ? `⚠ Weights sum to ${fmt(totalWeight, 1)}% (will be normalised to 100%)` : totalWeight > 0 ? `✓ Weights sum to ${fmt(totalWeight, 1)}%` : ''}
      </div>

      <div className="btn-group" style={{ marginTop: '10px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate grade</button>
        <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add item</button>
        <button className="btn btn-ghost" onClick={() => { setAssignments([
          { name: 'Homework', score: '', maxScore: '100', weight: '20' },
          { name: 'Midterm',  score: '', maxScore: '100', weight: '30' },
          { name: 'Final Exam', score: '', maxScore: '100', weight: '50' },
        ]); setResult(null); setError(''); }}>Reset</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <SectionTitle>Overall grade</SectionTitle>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Final grade" value={`${fmt(result.finalPct, 1)}%`}
              sub={pctToLetter(result.finalPct).letter} />
            <StatCard label="Letter grade" value={pctToLetter(result.finalPct).letter}
              color={pctToLetter(result.finalPct).color} />
            <StatCard label="Total weight" value={`${fmt(result.totalWeight)}%`} sub="counted" />
          </div>
          <GradeBar pct={result.finalPct} />

          <SectionTitle>Contribution breakdown</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.breakdown.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px',
              }}>
                <div style={{ flex: '0 0 160px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name || `Item ${i + 1}`}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.82rem', color: letterColor(r.pct), flex: '0 0 55px' }}>
                  {fmt(r.pct, 1)}%
                </div>
                <div style={{ flex: 1, height: '7px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(r.pct, 100)}%`, height: '100%', background: letterColor(r.pct), borderRadius: '99px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-3)', flex: '0 0 55px', textAlign: 'right' }}>
                  w: {r.weight}%
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--accent-hover)', fontWeight: 700, flex: '0 0 50px', textAlign: 'right' }}>
                  +{fmt(r.contribution, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Simple average ────────────────────────────────────

function SimpleAverageMode() {
  const [scores, setScores]     = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  function calculate() {
    const tokens = scores.split(/[\s,;|\t\n]+/).map(t => t.trim()).filter(Boolean);
    if (tokens.length === 0) { setError('Enter at least one score.'); setResult(null); return; }

    const nums = tokens.map(t => parseFloat(t));
    const badIdx = nums.findIndex(n => isNaN(n) || n < 0);
    if (badIdx !== -1) { setError(`"${tokens[badIdx]}" is not a valid score.`); setResult(null); return; }

    const max   = parseFloat(maxScore) || 100;
    const avg   = nums.reduce((s, n) => s + n, 0) / nums.length;
    const pct   = (avg / max) * 100;
    const high  = Math.max(...nums);
    const low   = Math.min(...nums);
    const range = high - low;

    setResult({ avg, pct, high, low, range, count: nums.length, max, nums });
    setError('');
  }

  const SAMPLE_SETS = [
    { label: 'Quiz scores',   data: '85, 90, 78, 92, 88' },
    { label: 'Test scores',   data: '72, 68, 85, 91, 76' },
    { label: 'All perfect',   data: '100, 100, 100' },
    { label: 'Mixed /50',     data: '42, 38, 46, 35, 44', max: '50' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter a list of scores to find the average. Separate with commas, spaces, or new lines.
      </p>

      <div className="form-group">
        <label>Scores</label>
        <textarea
          rows={3}
          value={scores}
          onChange={e => { setScores(e.target.value); setResult(null); setError(''); }}
          placeholder="e.g.  85, 90, 78, 92, 88"
          style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', resize: 'vertical' }}
        />
      </div>

      <div className="form-group" style={{ maxWidth: '180px' }}>
        <label>Max score per item</label>
        <input type="number" value={maxScore} min="1"
          onChange={e => { setMaxScore(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
          placeholder="100" />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Try a sample</p>
        <div className="tag-row">
          {SAMPLE_SETS.map(s => (
            <button key={s.label} className="tag"
              onClick={() => { setScores(s.data); if (s.max) setMaxScore(s.max); setResult(null); setError(''); }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate average</button>
        <button className="btn btn-ghost" onClick={() => { setScores(''); setMaxScore('100'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Average score" value={`${fmt(result.avg, 1)} / ${result.max}`}
              sub={`${fmt(result.pct, 1)}%`} />
            <StatCard accent label="Letter grade" value={pctToLetter(result.pct).letter}
              color={pctToLetter(result.pct).color} />
            <StatCard label="High" value={`${result.high}`} sub="best score" />
            <StatCard label="Low"  value={`${result.low}`}  sub="lowest score" />
            <StatCard label="Range" value={`${fmt(result.range, 1)}`} sub="high − low" />
            <StatCard label="Count" value={result.count} sub="scores entered" />
          </div>
          <GradeBar pct={result.pct} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Final exam grade needed ──────────────────────────

function FinalNeededMode() {
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentWeight, setCurrentWeight] = useState('60');
  const [finalWeight, setFinalWeight]   = useState('40');
  const [targetGrade, setTargetGrade]   = useState('');
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  function calculate() {
    const cg = parseFloat(currentGrade);
    const cw = parseFloat(currentWeight);
    const fw = parseFloat(finalWeight);
    const tg = parseFloat(targetGrade);

    if (isNaN(cg) || cg < 0 || cg > 100) { setError('Enter your current grade (0–100%).'); setResult(null); return; }
    if (isNaN(cw) || cw <= 0)             { setError('Enter a valid current grade weight.'); setResult(null); return; }
    if (isNaN(fw) || fw <= 0)             { setError('Enter a valid final exam weight.'); setResult(null); return; }
    if (isNaN(tg) || tg < 0 || tg > 100) { setError('Enter a target grade (0–100%).'); setResult(null); return; }

    // target = (cg * cw + final * fw) / (cw + fw)
    // final = (target * (cw + fw) - cg * cw) / fw
    const totalWeight = cw + fw;
    const needed = (tg * totalWeight - cg * cw) / fw;
    const feasible = needed >= 0 && needed <= 100;

    // What final grade gives various overall outcomes
    const scenarios = [60, 70, 80, 90, 100].map(finalScore => {
      const overall = (cg * cw + finalScore * fw) / totalWeight;
      return { finalScore, overall };
    });

    setResult({ needed, feasible, cg, cw, fw, tg, totalWeight, scenarios });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find the minimum score you need on your final exam to achieve your desired overall grade.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Current grade (%)</label>
          <input type="number" value={currentGrade} min="0" max="100"
            onChange={e => { setCurrentGrade(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 82" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Current weight (%)</label>
          <input type="number" value={currentWeight} min="1" max="99"
            onChange={e => { setCurrentWeight(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 60" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Final exam weight (%)</label>
          <input type="number" value={finalWeight} min="1" max="99"
            onChange={e => { setFinalWeight(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 40" />
        </div>
        <div className="form-group">
          <label>Target overall grade (%)</label>
          <input type="number" value={targetGrade} min="0" max="100"
            onChange={e => { setTargetGrade(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 90" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setCurrentGrade(''); setCurrentWeight('60'); setFinalWeight('40'); setTargetGrade(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard
              accent
              label="Score needed on final"
              value={result.feasible ? `${fmt(result.needed, 1)}%` : 'Not possible'}
              sub={result.feasible
                ? `to reach ${fmt(result.tg, 0)}% overall (${pctToLetter(result.tg).letter})`
                : result.needed > 100
                  ? 'Need >100% — mathematically impossible'
                  : 'Already exceeds target with 0% on final'}
              color={!result.feasible ? '#dc2626' : undefined}
            />
            {result.feasible && (
              <StatCard label="Letter needed" value={pctToLetter(result.needed).letter}
                color={pctToLetter(result.needed).color}
                sub={`on final exam`} />
            )}
          </div>

          {!result.feasible && result.needed < 0 && (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>
              🎉 Great news — you've already achieved your target! Even a 0% on the final won't drop you below {fmt(result.tg, 0)}%.
            </div>
          )}

          <SectionTitle>What-if scenarios</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Final exam score', 'Overall grade', 'Letter grade'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s, i) => {
                  const isTarget = s.finalScore === Math.round(result.needed);
                  return (
                    <tr key={s.finalScore} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.finalScore}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: letterColor(s.overall) }}>{fmt(s.overall, 1)}%</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: letterColor(s.overall) }}>{pctToLetter(s.overall).letter}</td>
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

// ── Mode 4: Grade scale reference ────────────────────────────

function GradeScaleMode() {
  const [custom, setCustom]   = useState(false);
  const [inputPct, setInputPct] = useState('');
  const [result, setResult]   = useState(null);

  function lookup() {
    const p = parseFloat(inputPct);
    if (isNaN(p) || p < 0) return;
    setResult(pctToLetter(p));
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Look up the letter grade for any percentage using the standard US grading scale.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '0 0 180px', margin: 0 }}>
          <label>Enter a percentage</label>
          <input type="number" value={inputPct} min="0" max="100"
            onChange={e => { setInputPct(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="e.g. 87.5" style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }} />
        </div>
        <button className="btn btn-primary" onClick={lookup} style={{ marginBottom: '0' }}>Look up</button>
      </div>

      {result && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          background: `${result.color}18`, border: `1px solid ${result.color}`,
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--mono)', color: result.color }}>{result.letter}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{inputPct}% = {result.letter} ({result.min}%+ threshold)</span>
        </div>
      )}

      <SectionTitle>Standard US grading scale</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '6px' }}>
        {GRADE_SCALE.map((g, i) => {
          const next = GRADE_SCALE[i - 1];
          const maxStr = next ? `${next.min - 0.99}%` : '100%';
          const rangeStr = g.min === 0 ? `0–${GRADE_SCALE[i-1]?.min - 0.01 || 59.99}%` : `${g.min}–${maxStr}`;
          return (
            <div key={g.letter} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1rem', color: g.color, flex: '0 0 30px' }}>{g.letter}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{g.min}%+</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Weighted Grades',  desc: 'different weights per item' },
  { label: 'Simple Average',   desc: 'average of equal scores'    },
  { label: 'Final Exam Needed', desc: 'what score do I need?'     },
  { label: 'Grade Scale',      desc: '% to letter reference'      },
];

export default function GradeCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Grade Calculator</span>
          </div>
          <h1>Grade Calculator</h1>
          <p className="subtitle">
            Calculate weighted course grades, average scores, the minimum final exam score you need, and look up letter grades — all in one place.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {mode === 0 && <WeightedMode />}
          {mode === 1 && <SimpleAverageMode />}
          {mode === 2 && <FinalNeededMode />}
          {mode === 3 && <GradeScaleMode />}
        </div>

        {/* SEO */}
        <div className="seo-content">
          <h2>How to Use the Grade Calculator</h2>
          <p>
            This free grade calculator covers every common grading scenario in one tool — running entirely in your browser with no sign-up required. Switch between four modes using the tabs above.
          </p>
          <p>
            <strong>Weighted Grades</strong> calculates your overall course grade when each assignment category has a different weight. Enter your homework average, midterm score, and final exam score alongside their respective weights (e.g. 20%, 30%, 50%) and get an instant weighted average. Weights don't need to sum to 100% — they're normalised automatically, so you can also use raw point values. A per-item breakdown shows how much each component contributes to your final grade.
          </p>
          <p>
            <strong>Simple Average</strong> finds the mean of any set of scores. Paste in a list separated by commas, spaces, or new lines and set the maximum score per item. You'll see the average, percentage, letter grade, highest score, lowest score, and range at a glance.
          </p>
          <p>
            <strong>Final Exam Needed</strong> solves the most stressful question before exam week — what score do I need on the final to get the grade I want? Enter your current grade, the weight of work done so far, the weight of the final exam, and your target overall grade. The calculator shows the exact score needed and a what-if table showing your overall grade for final scores from 60% to 100%.
          </p>
          <p>
            <strong>Grade Scale</strong> is a quick reference for the standard US letter grade scale with percentage ranges, plus an instant lookup for any percentage.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Grade Calculation Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'HW 85% (20%) + Midterm 78% (30%) + Final 91% (50%)', value: '85.9%', sub: 'B weighted grade' },
              { label: 'Scores: 85, 90, 78, 92, 88',  value: '86.6%',  sub: 'simple average' },
              { label: 'Current 82%, need B+ (87%) — final is 40%', value: '94.5%', sub: 'needed on final' },
              { label: '93% = A, 87% = B+, 73% = C', value: 'Scale', sub: 'US standard' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="grade-calculator" />
      </div>
    </div>
  );
}
