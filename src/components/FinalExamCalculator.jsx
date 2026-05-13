import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core formula ──────────────────────────────────────────────
// Overall = (currentGrade × currentWeight + finalScore × finalWeight) / totalWeight
// → finalNeeded = (target × totalWeight − currentGrade × currentWeight) / finalWeight

function calcFinalNeeded(currentGrade, currentWeight, finalWeight, target) {
  const total = currentWeight + finalWeight;
  return (target * total - currentGrade * currentWeight) / finalWeight;
}

function calcOverall(currentGrade, currentWeight, finalScore, finalWeight) {
  return (currentGrade * currentWeight + finalScore * finalWeight) / (currentWeight + finalWeight);
}

// Grade scale
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

function toLetterGrade(pct) {
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

function fmt(n, dp = 1) {
  return isFinite(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

// ── Shared UI ─────────────────────────────────────────────────

function ErrBox({ msg }) {
  return (
    <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>
  );
}

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

// ── Result banner ─────────────────────────────────────────────

function ResultBanner({ needed, target, feasible, alreadyAchieved }) {
  if (alreadyAchieved) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1px solid #86efac',
        borderRadius: 'var(--radius)', padding: '18px 22px',
        textAlign: 'center', marginTop: '20px',
      }}>
        <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🎉</div>
        <div style={{ fontSize: 'clamp(1.1rem,3.5vw,1.6rem)', fontWeight: 700, color: '#15803d' }}>
          You've already achieved your target!
        </div>
        <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '6px' }}>
          Even a 0% on the final won't drop you below {fmt(target, 0)}%. No minimum score required.
        </div>
      </div>
    );
  }

  if (!feasible) {
    return (
      <div style={{
        background: '#fef2f2', border: '1px solid #fca5a5',
        borderRadius: 'var(--radius)', padding: '18px 22px',
        textAlign: 'center', marginTop: '20px',
      }}>
        <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>⚠️</div>
        <div style={{ fontSize: 'clamp(1.1rem,3.5vw,1.6rem)', fontWeight: 700, color: '#dc2626' }}>
          Target not achievable
        </div>
        <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '6px' }}>
          Reaching {fmt(target, 0)}% overall would require {fmt(needed, 1)}% on the final — mathematically impossible.
        </div>
      </div>
    );
  }

  const grade = toLetterGrade(needed);
  const urgency = needed >= 90 ? 'high' : needed >= 70 ? 'medium' : 'low';
  const urgencyColors = { high: '#dc2626', medium: '#f59e0b', low: '#16a34a' };

  return (
    <div style={{
      background: 'var(--accent-light)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)', padding: '20px 26px',
      textAlign: 'center', marginTop: '20px',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
        You need at least
      </div>
      <div style={{ fontSize: 'clamp(2.2rem,8vw,3.8rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: urgencyColors[urgency], lineHeight: 1, letterSpacing: '-0.02em' }}>
        {fmt(needed, 1)}%
      </div>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          background: `${grade.color}18`, border: `1px solid ${grade.color}`,
          borderRadius: '99px', padding: '4px 14px',
          fontSize: '0.88rem', fontWeight: 700, color: grade.color,
        }}>
          {grade.letter} on the final
        </div>
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '99px', padding: '4px 14px',
          fontSize: '0.88rem', color: 'var(--text-2)',
        }}>
          to reach {fmt(target, 0)}% overall
        </div>
      </div>
    </div>
  );
}

// ── What-if table ─────────────────────────────────────────────

function WhatIfTable({ currentGrade, currentWeight, finalWeight, neededScore }) {
  const scores = [50, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Final exam score', 'Overall grade', 'Letter grade', ''].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 12px',
                fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scores.map((score, i) => {
            const overall = calcOverall(currentGrade, currentWeight, score, finalWeight);
            const grade   = toLetterGrade(overall);
            const isNeeded = neededScore !== null && score >= Math.ceil(neededScore) && score < Math.ceil(neededScore) + 10;
            return (
              <tr key={score} style={{
                borderBottom: '1px solid var(--border)',
                background: isNeeded ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent',
              }}>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  {score}%
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: grade.color }}>
                  {fmt(overall)}%
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    background: `${grade.color}18`, border: `1px solid ${grade.color}`,
                    borderRadius: '99px', padding: '2px 10px',
                    fontSize: '0.78rem', fontWeight: 700, color: grade.color,
                  }}>
                    {grade.letter}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontSize: '0.72rem', color: 'var(--accent-hover)', fontWeight: 600 }}>
                  {isNeeded ? '← minimum' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────

function GradeBar({ pct, label }) {
  const grade = toLetterGrade(Math.max(0, Math.min(100, pct)));
  const capped = Math.min(Math.max(pct, 0), 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: grade.color }}>{fmt(pct)}% · {grade.letter}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          width: `${capped}%`, height: '100%',
          background: grade.color,
          borderRadius: '99px', transition: 'width 0.4s',
        }} />
      </div>
    </div>
  );
}

// ── Quick target buttons ──────────────────────────────────────

const QUICK_TARGETS = [
  { label: 'A  (93%)',  value: 93 },
  { label: 'A- (90%)', value: 90 },
  { label: 'B+ (87%)', value: 87 },
  { label: 'B  (83%)', value: 83 },
  { label: 'B- (80%)', value: 80 },
  { label: 'C  (73%)', value: 73 },
];

// ── Main component ────────────────────────────────────────────

export default function FinalExamCalculator() {
  const [currentGrade, setCurrentGrade]     = useState('');
  const [currentWeight, setCurrentWeight]   = useState('60');
  const [finalWeight, setFinalWeight]       = useState('40');
  const [targetGrade, setTargetGrade]       = useState('');
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState('');
  const [toast, setToast]                   = useState('');

  function calculate() {
    const cg = parseFloat(currentGrade);
    const cw = parseFloat(currentWeight);
    const fw = parseFloat(finalWeight);
    const tg = parseFloat(targetGrade);

    if (isNaN(cg) || cg < 0 || cg > 100)  { setError('Current grade must be 0–100.'); setResult(null); return; }
    if (isNaN(cw) || cw <= 0 || cw >= 100) { setError('Current weight must be between 1–99%.'); setResult(null); return; }
    if (isNaN(fw) || fw <= 0 || fw >= 100) { setError('Final exam weight must be between 1–99%.'); setResult(null); return; }
    if (isNaN(tg) || tg < 0 || tg > 100)  { setError('Target grade must be 0–100.'); setResult(null); return; }

    const needed          = calcFinalNeeded(cg, cw, fw, tg);
    const alreadyAchieved = needed <= 0;
    const feasible        = needed >= 0 && needed <= 100;
    const maxPossible     = calcOverall(cg, cw, 100, fw);
    const minPossible     = calcOverall(cg, cw, 0,   fw);

    setResult({ needed, feasible, alreadyAchieved, cg, cw, fw, tg, maxPossible, minPossible });
    setError('');
  }

  function setTarget(val) {
    setTargetGrade(String(val));
    setResult(null);
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Current grade: ${fmt(result.cg)}% (weight: ${result.cw}%)`,
      `Final exam weight: ${result.fw}%`,
      `Target overall grade: ${fmt(result.tg)}% (${toLetterGrade(result.tg).letter})`,
      result.alreadyAchieved ? 'Status: Already achieved!' :
        result.feasible ? `Score needed on final: ${fmt(result.needed)}% (${toLetterGrade(result.needed).letter})` :
        `Status: Target not achievable (would need ${fmt(result.needed)}%)`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  // Weights sum indicator
  const cwVal = parseFloat(currentWeight) || 0;
  const fwVal = parseFloat(finalWeight) || 0;
  const weightSum = cwVal + fwVal;
  const weightOk  = Math.abs(weightSum - 100) < 0.1;

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Final Exam Calculator</span>
          </div>
          <h1>Final Exam Calculator</h1>
          <p className="subtitle">
            Find out exactly what score you need on your final exam to achieve your target course grade — with a complete what-if table for every possible final score.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>Current grade (%)</label>
              <input
                type="number" value={currentGrade} min="0" max="100" step="0.1"
                onChange={e => { setCurrentGrade(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 82"
                style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }}
                autoFocus
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
                Your grade on all work done so far.
              </p>
            </div>
            <div className="form-group">
              <label>Current work weight (%)</label>
              <input
                type="number" value={currentWeight} min="1" max="99"
                onChange={e => { setCurrentWeight(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 60"
              />
            </div>
            <div className="form-group">
              <label>Final exam weight (%)</label>
              <input
                type="number" value={finalWeight} min="1" max="99"
                onChange={e => { setFinalWeight(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 40"
              />
            </div>
          </div>

          {/* Weight sum indicator */}
          {cwVal > 0 && fwVal > 0 && (
            <div style={{
              fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px',
              color: weightOk ? '#16a34a' : '#f59e0b',
            }}>
              {weightOk
                ? `✓ Weights sum to 100%`
                : `⚠ Weights sum to ${fmt(weightSum, 0)}% — they should add up to 100%`}
            </div>
          )}

          {/* Target grade */}
          <div className="form-group">
            <label>Target overall grade (%)</label>
            <input
              type="number" value={targetGrade} min="0" max="100" step="0.1"
              onChange={e => { setTargetGrade(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 90"
              style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem', maxWidth: '200px' }}
            />
          </div>

          {/* Quick target buttons */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Quick targets
            </p>
            <div className="tag-row">
              {QUICK_TARGETS.map(qt => (
                <button
                  key={qt.value}
                  className={`tag${String(targetGrade) === String(qt.value) ? ' active' : ''}`}
                  onClick={() => setTarget(qt.value)}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => {
              setCurrentGrade(''); setCurrentWeight('60'); setFinalWeight('40');
              setTargetGrade(''); setResult(null); setError('');
            }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div>
              {/* Big result banner */}
              <ResultBanner
                needed={result.needed}
                target={result.tg}
                feasible={result.feasible}
                alreadyAchieved={result.alreadyAchieved}
              />

              {/* Grade range */}
              {!result.alreadyAchieved && (
                <>
                  <SectionTitle>Your possible grade range</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <GradeBar pct={result.maxPossible} label="Best case (100% on final)" />
                    <GradeBar pct={result.minPossible} label="Worst case (0% on final)" />
                  </div>
                </>
              )}

              {/* What-if table */}
              <SectionTitle>What-if — overall grade for every final score</SectionTitle>
              <WhatIfTable
                currentGrade={result.cg}
                currentWeight={result.cw}
                finalWeight={result.fw}
                neededScore={result.feasible && !result.alreadyAchieved ? result.needed : null}
              />

              {/* Summary cards */}
              <SectionTitle>Summary</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{
                  flex: '1 1 130px', minWidth: '120px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>Current grade</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: toLetterGrade(result.cg).color }}>{fmt(result.cg)}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>{toLetterGrade(result.cg).letter} · {result.cw}% of course</div>
                </div>
                <div style={{
                  flex: '1 1 130px', minWidth: '120px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>Target grade</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: toLetterGrade(result.tg).color }}>{fmt(result.tg)}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>{toLetterGrade(result.tg).letter} overall</div>
                </div>
                <div style={{
                  flex: '1 1 130px', minWidth: '120px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>Max possible</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: toLetterGrade(result.maxPossible).color }}>{fmt(result.maxPossible)}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>with 100% on final</div>
                </div>
                <div style={{
                  flex: '1 1 130px', minWidth: '120px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>Final weight</div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>{result.fw}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>of total grade</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How the Final Exam Calculator Works</h2>
          <p>
            Enter your current grade, the weight of the work you've done so far, the weight of the final exam, and the overall grade you're aiming for — then press Calculate. The tool instantly tells you the minimum score you need on your final exam to hit your target, along with the equivalent letter grade.
          </p>
          <p>
            <strong>The formula:</strong> if your current grade is <em>C</em> (worth <em>W₁</em>% of the course) and the final is worth <em>W₂</em>%, your overall grade is <em>(C × W₁ + F × W₂) / (W₁ + W₂)</em>, where <em>F</em> is your final exam score. Rearranging gives: <em>F = (Target × Total − C × W₁) / W₂</em>. This tool does that algebra for you instantly.
          </p>
          <p>
            Common weight splits are 60/40 (current work / final exam) or 70/30, but the calculator works for any combination. If your weights don't add up to 100%, the tool will flag this — though the formula handles it correctly regardless by using the actual weight values.
          </p>
          <p>
            The <strong>what-if table</strong> shows your resulting overall grade for final scores from 50% to 100% in 5-point steps, with the minimum required score highlighted. The <strong>grade range bars</strong> show your best-case scenario (100% on the final) and worst-case (0%), so you can see exactly how much the final can move your grade in either direction.
          </p>
          <p>
            If you've already secured your target — or if reaching it is mathematically impossible — the calculator tells you that immediately, so you know whether to celebrate or adjust your goal.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Final Exam Score Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: 'Current 87%, want A- (90%), final 40%',    value: '94.5%',  sub: 'need A on final' },
              { label: 'Current 75%, want B (83%), final 30%',     value: '102%',   sub: 'not achievable' },
              { label: 'Current 91%, want A (93%), final 25%',     value: '99%',    sub: 'need A+ on final' },
              { label: 'Current 78%, want B- (80%), final 40%',    value: '83%',    sub: 'need B on final' },
              { label: 'Current 95%, want B+ (87%), final 50%',    value: '79%',    sub: 'need B on final, achievable' },
              { label: 'Current 88%, want A (93%), final 50%',     value: '98%',    sub: 'very high but possible' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="final-exam-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
