import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core formulas ─────────────────────────────────────────────

function mifflin(wKg, hCm, age, sex) {
  const base = 10 * wKg + 6.25 * hCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function lbsToKg(lbs)        { return lbs * 0.453592; }
function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }
function fmt(n, dp = 0)       { return isFinite(n) ? Math.round(n * 10 ** dp) / 10 ** dp : '—'; }

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary',         desc: 'Desk job, little exercise',          mult: 1.2   },
  { id: 'light',     label: 'Lightly active',     desc: 'Light exercise 1–3 days/week',       mult: 1.375 },
  { id: 'moderate',  label: 'Moderately active',  desc: 'Moderate exercise 3–5 days/week',    mult: 1.55  },
  { id: 'very',      label: 'Very active',         desc: 'Hard exercise 6–7 days/week',        mult: 1.725 },
  { id: 'extra',     label: 'Extremely active',    desc: 'Physical job + hard exercise daily', mult: 1.9   },
];

const GOALS = [
  { id: 'lose2',    label: 'Lose 2 lbs/week',    delta: -1000, note: 'Aggressive cut' },
  { id: 'lose1',    label: 'Lose 1 lb/week',     delta: -500,  note: 'Steady deficit' },
  { id: 'lose05',   label: 'Lose 0.5 lb/week',   delta: -250,  note: 'Mild deficit' },
  { id: 'maintain', label: 'Maintain weight',    delta: 0,     note: 'TDEE' },
  { id: 'gain05',   label: 'Gain 0.5 lb/week',   delta: +250,  note: 'Lean bulk' },
  { id: 'gain1',    label: 'Gain 1 lb/week',     delta: +500,  note: 'Muscle gain' },
];

const MACRO_PRESETS = [
  { id: 'balanced',   label: 'Balanced',          protein: 30, carbs: 40, fat: 30 },
  { id: 'lowcarb',    label: 'Low Carb',           protein: 35, carbs: 25, fat: 40 },
  { id: 'highprotein',label: 'High Protein',       protein: 40, carbs: 35, fat: 25 },
  { id: 'keto',       label: 'Keto',               protein: 25, carbs: 5,  fat: 70 },
];

// ── Shared UI ─────────────────────────────────────────────────

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
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
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

// ── Macro bar ─────────────────────────────────────────────────

function MacroBar({ protein, carbs, fat }) {
  const total = protein + carbs + fat;
  const pctP = (protein / total) * 100;
  const pctC = (carbs / total) * 100;
  const pctF = (fat / total) * 100;

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ width: `${pctP}%`, background: '#0d9488', transition: 'width 0.3s' }} />
        <div style={{ width: `${pctC}%`, background: '#0891b2', transition: 'width 0.3s' }} />
        <div style={{ width: `${pctF}%`, background: '#7c3aed', transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Protein', pct: protein, color: '#0d9488', cal: protein * 4 / total },
          { label: 'Carbs',   pct: carbs,   color: '#0891b2', cal: carbs   * 4 / total },
          { label: 'Fat',     pct: fat,     color: '#7c3aed', cal: fat     * 9 / total },
        ].map(m => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{m.label}</span>
            <span style={{ fontFamily: 'var(--mono)', color: m.color, fontWeight: 700 }}>{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Macro grid ────────────────────────────────────────────────

function MacroGrid({ calories, proteinPct, carbsPct, fatPct }) {
  const protein = (calories * proteinPct / 100) / 4;
  const carbs   = (calories * carbsPct   / 100) / 4;
  const fat     = (calories * fatPct     / 100) / 9;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
      {[
        { label: 'Protein', grams: protein, pct: proteinPct, kcal: calories * proteinPct / 100, color: '#0d9488', cal: '4 kcal/g' },
        { label: 'Carbs',   grams: carbs,   pct: carbsPct,   kcal: calories * carbsPct   / 100, color: '#0891b2', cal: '4 kcal/g' },
        { label: 'Fat',     grams: fat,     pct: fatPct,     kcal: calories * fatPct     / 100, color: '#7c3aed', cal: '9 kcal/g' },
      ].map(m => (
        <div key={m.label} style={{
          flex: '1 1 100px', background: 'var(--surface2)',
          border: `1px solid var(--border)`, borderRadius: 'var(--radius-sm)',
          padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
            {m.label}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--mono)', color: m.color }}>
            {fmt(m.grams)}g
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>
            {fmt(m.kcal)} kcal · {m.pct}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Timeline projection ───────────────────────────────────────

function WeightTimeline({ tdee, goalId, wKg, unit }) {
  const goal = GOALS.find(g => g.id === goalId);
  if (!goal || goal.delta === 0) return null;

  // 1 lb of fat ≈ 3500 kcal; 1 kg ≈ 7700 kcal
  const weeklyKg = (Math.abs(goal.delta) * 7) / 7700;
  const direction = goal.delta < 0 ? -1 : 1;

  const milestones = [1, 2, 4, 8, 12, 24];
  const displayUnit = unit === 'imperial' ? 'lbs' : 'kg';
  const toDisplay = (kg) => unit === 'imperial' ? fmt(kg / 0.453592, 1) : fmt(kg, 1);
  const startDisplay = toDisplay(wKg);

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Weeks', 'Weight lost/gained', `Projected weight (${displayUnit})`].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {milestones.map((wk, i) => {
            const deltaKg = weeklyKg * wk * direction;
            const newKg = wKg + deltaKg;
            return (
              <tr key={wk} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{wk}w</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: goal.delta < 0 ? '#dc2626' : '#16a34a' }}>
                  {goal.delta < 0 ? '−' : '+'}{toDisplay(Math.abs(deltaKg))} {displayUnit}
                </td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  {toDisplay(newKg)} {displayUnit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function CalorieCalculator() {
  // Inputs
  const [unit, setUnit]         = useState('metric');
  const [sex, setSex]           = useState('male');
  const [age, setAge]           = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [activity, setActivity] = useState('moderate');
  const [goalId, setGoalId]     = useState('maintain');
  const [macroPreset, setMacroPreset] = useState('balanced');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs]     = useState('');
  const [customFat, setCustomFat]         = useState('');
  const [useCustom, setUseCustom]         = useState(false);

  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  function calculate() {
    const ageV = parseFloat(age);
    if (isNaN(ageV) || ageV < 1 || ageV > 120) { setError('Enter a valid age (1–120).'); setResult(null); return; }

    let wKg, hCm;
    if (unit === 'metric') {
      wKg = parseFloat(weightKg);
      hCm = parseFloat(heightCm);
      if (isNaN(wKg) || wKg <= 0) { setError('Enter a valid weight in kg.'); setResult(null); return; }
      if (isNaN(hCm) || hCm <= 0) { setError('Enter a valid height in cm.'); setResult(null); return; }
    } else {
      wKg = lbsToKg(parseFloat(weightLbs));
      hCm = ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
      if (isNaN(wKg) || wKg <= 0) { setError('Enter a valid weight in lbs.'); setResult(null); return; }
      if (hCm <= 0) { setError('Enter a valid height.'); setResult(null); return; }
    }

    if (wKg < 20 || wKg > 300) { setError('Weight out of range (20–300 kg / 44–660 lbs).'); setResult(null); return; }
    if (hCm < 100 || hCm > 250) { setError('Height out of range (100–250 cm).'); setResult(null); return; }

    const bmrVal  = mifflin(wKg, hCm, ageV, sex);
    const actMult = ACTIVITY_LEVELS.find(a => a.id === activity)?.mult ?? 1.55;
    const tdee    = bmrVal * actMult;
    const goalDelta = GOALS.find(g => g.id === goalId)?.delta ?? 0;
    const targetCal = tdee + goalDelta;

    // Macros
    let pPct, cPct, fPct;
    if (useCustom) {
      pPct = parseFloat(customProtein) || 0;
      cPct = parseFloat(customCarbs)   || 0;
      fPct = parseFloat(customFat)     || 0;
      if (Math.abs(pPct + cPct + fPct - 100) > 1) {
        setError('Custom macros must add up to 100%.'); setResult(null); return;
      }
    } else {
      const preset = MACRO_PRESETS.find(p => p.id === macroPreset);
      pPct = preset.protein; cPct = preset.carbs; fPct = preset.fat;
    }

    setResult({ bmr: bmrVal, tdee, targetCal, goalDelta, actMult, wKg, hCm, ageV, sex, activity, goalId, pPct, cPct, fPct });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `BMR: ${fmt(result.bmr)} kcal/day`,
      `TDEE (maintenance): ${fmt(result.tdee)} kcal/day`,
      `Target calories: ${fmt(result.targetCal)} kcal/day`,
      `Goal: ${GOALS.find(g => g.id === result.goalId)?.label}`,
      `Protein: ${fmt((result.targetCal * result.pPct / 100) / 4)}g`,
      `Carbs: ${fmt((result.targetCal * result.cPct / 100) / 4)}g`,
      `Fat: ${fmt((result.targetCal * result.fPct / 100) / 9)}g`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => { setToast('Copied!'); setTimeout(() => setToast(''), 2000); });
  }

  const selectedGoal = GOALS.find(g => g.id === goalId);
  const selectedActivity = ACTIVITY_LEVELS.find(a => a.id === activity);
  const macroSplit = useCustom
    ? { protein: parseFloat(customProtein)||0, carbs: parseFloat(customCarbs)||0, fat: parseFloat(customFat)||0 }
    : MACRO_PRESETS.find(p => p.id === macroPreset);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Calorie Calculator</span>
          </div>
          <h1>Calorie Calculator</h1>
          <p className="subtitle">
            Find out exactly how many calories you need to lose weight, maintain, or build muscle — with personalised macros, a daily target, and a week-by-week weight projection.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Unit toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['metric', 'imperial'].map(u => (
              <button key={u} onClick={() => { setUnit(u); setResult(null); setError(''); }}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${unit === u ? 'var(--accent)' : 'var(--border)'}`,
                  background: unit === u ? 'var(--accent-light)' : 'var(--surface2)',
                  color: unit === u ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {u === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lbs / ft)'}
              </button>
            ))}
          </div>

          {/* Sex */}
          <div className="form-group">
            <label>Biological sex</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['male', 'female'].map(s => (
                <button key={s} onClick={() => { setSex(s); setResult(null); }}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${sex === s ? 'var(--accent)' : 'var(--border)'}`,
                    background: sex === s ? 'var(--accent-light)' : 'var(--surface2)',
                    color: sex === s ? 'var(--accent-hover)' : 'var(--text)',
                    fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                    transition: 'all 0.15s', textTransform: 'capitalize',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age, weight, height */}
          <div className="form-row">
            <div className="form-group">
              <label>Age (years)</label>
              <input type="number" value={age} min="1" max="120"
                onChange={e => { setAge(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 30" />
            </div>
            {unit === 'metric' ? (
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" value={weightKg}
                  onChange={e => { setWeightKg(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="e.g. 75" />
              </div>
            ) : (
              <div className="form-group">
                <label>Weight (lbs)</label>
                <input type="number" value={weightLbs}
                  onChange={e => { setWeightLbs(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="e.g. 165" />
              </div>
            )}
          </div>

          {unit === 'metric' ? (
            <div className="form-group">
              <label>Height (cm)</label>
              <input type="number" value={heightCm}
                onChange={e => { setHeightCm(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 175" />
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Height (feet)</label>
                <input type="number" value={heightFt}
                  onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }}
                  placeholder="e.g. 5" />
              </div>
              <div className="form-group">
                <label>Height (inches)</label>
                <input type="number" value={heightIn}
                  onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                  placeholder="e.g. 9" />
              </div>
            </div>
          )}

          {/* Activity level */}
          <div className="form-group">
            <label>Activity level</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ACTIVITY_LEVELS.map(al => (
                <button key={al.id} onClick={() => { setActivity(al.id); setResult(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${activity === al.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: activity === al.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activity === al.id ? 'var(--accent-hover)' : 'var(--text)' }}>{al.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px' }}>{al.desc}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: activity === al.id ? 'var(--accent-hover)' : 'var(--text-3)', flexShrink: 0 }}>×{al.mult}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="form-group">
            <label>Goal</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: '6px' }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => { setGoalId(g.id); setResult(null); }}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${goalId === g.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: goalId === g.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: goalId === g.id ? 'var(--accent-hover)' : 'var(--text)' }}>{g.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px', fontFamily: 'var(--mono)' }}>
                    {g.delta === 0 ? 'TDEE' : (g.delta > 0 ? '+' : '') + g.delta + ' kcal/day'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Macro preset */}
          <div className="form-group">
            <label>Macro split</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {MACRO_PRESETS.map(p => (
                <button key={p.id}
                  className={`tag${!useCustom && macroPreset === p.id ? ' active' : ''}`}
                  onClick={() => { setMacroPreset(p.id); setUseCustom(false); setResult(null); }}>
                  {p.label} ({p.protein}P/{p.carbs}C/{p.fat}F)
                </button>
              ))}
              <button
                className={`tag${useCustom ? ' active' : ''}`}
                onClick={() => { setUseCustom(true); setResult(null); }}>
                Custom
              </button>
            </div>

            {!useCustom && macroSplit && (
              <MacroBar protein={macroSplit.protein} carbs={macroSplit.carbs} fat={macroSplit.fat} />
            )}

            {useCustom && (
              <div className="form-row">
                {[
                  { label: 'Protein %', val: customProtein, set: setCustomProtein },
                  { label: 'Carbs %',   val: customCarbs,   set: setCustomCarbs   },
                  { label: 'Fat %',     val: customFat,     set: setCustomFat     },
                ].map(f => (
                  <div key={f.label} className="form-group" style={{ flex: 1 }}>
                    <label>{f.label}</label>
                    <input type="number" value={f.val} min="0" max="100"
                      onChange={e => { f.set(e.target.value); setResult(null); setError(''); }}
                      placeholder="e.g. 30" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="btn-group" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={calculate}>Calculate Calories</button>
            <button className="btn btn-ghost" onClick={() => {
              setAge(''); setWeightKg(''); setWeightLbs(''); setHeightCm('');
              setHeightFt(''); setHeightIn(''); setResult(null); setError('');
            }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              <SectionTitle>Your Daily Calorie Target</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="Target calories" value={`${fmt(result.targetCal)} kcal`}
                  sub={selectedGoal?.label} />
                <StatCard accent label="Maintenance (TDEE)" value={`${fmt(result.tdee)} kcal`}
                  sub={`BMR × ${result.actMult}`} />
                <StatCard accent label="BMR" value={`${fmt(result.bmr)} kcal`}
                  sub="at complete rest" />
              </div>

              {result.goalDelta !== 0 && (
                <div style={{
                  marginTop: '12px', padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                  background: result.goalDelta < 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${result.goalDelta < 0 ? '#fca5a5' : '#86efac'}`,
                  fontSize: '0.85rem', color: result.goalDelta < 0 ? '#dc2626' : '#15803d', fontWeight: 600,
                }}>
                  {result.goalDelta < 0
                    ? `🔥 Calorie deficit: ${Math.abs(result.goalDelta)} kcal/day below maintenance`
                    : `💪 Calorie surplus: +${result.goalDelta} kcal/day above maintenance`}
                </div>
              )}

              <SectionTitle>Daily Macros at {fmt(result.targetCal)} kcal</SectionTitle>
              <MacroGrid
                calories={result.targetCal}
                proteinPct={result.pPct}
                carbsPct={result.cPct}
                fatPct={result.fPct}
              />

              {/* All goals comparison */}
              <SectionTitle>All calorie targets at a glance</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {GOALS.map(g => {
                  const cal = result.tdee + g.delta;
                  const isSelected = g.id === result.goalId;
                  return (
                    <div key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-light)' : 'var(--surface2)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                      <div style={{ flex: '0 0 160px', fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {g.label}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.92rem', color: isSelected ? 'var(--accent-hover)' : 'var(--text)', flex: '0 0 110px' }}>
                        {fmt(cal)} kcal
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{g.note}</div>
                      {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '99px' }}>Selected</span>}
                    </div>
                  );
                })}
              </div>

              {/* Weight timeline */}
              {result.goalId !== 'maintain' && (
                <>
                  <SectionTitle>Weight projection</SectionTitle>
                  <WeightTimeline tdee={result.tdee} goalId={result.goalId} wKg={result.wKg} unit={unit} />
                </>
              )}

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ Results are estimates based on the Mifflin-St Jeor equation. Individual metabolism varies. Consult a registered dietitian or healthcare provider for personalised nutrition advice.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Calorie Calculator</h2>
          <p>
            Enter your age, sex, weight, height, and activity level, then select your goal — and this calculator instantly shows your daily calorie target, maintenance calories, BMR, and a full macro breakdown. All calculations use the <strong>Mifflin-St Jeor equation</strong>, the most accurate BMR formula for most adults, validated in clinical research since 1990.
          </p>
          <p>
            <strong>How calorie targets are calculated:</strong> Your BMR (the calories your body burns at rest) is multiplied by your activity factor to get your TDEE — Total Daily Energy Expenditure. This is your maintenance level. From there, a deficit or surplus is applied based on your goal: a 500 kcal/day deficit creates a roughly 1 lb/week weight loss, while a 500 kcal/day surplus supports 1 lb/week of muscle gain.
          </p>
          <p>
            <strong>Macros:</strong> Choose from four preset macro splits — Balanced (30/40/30), Low Carb (35/25/40), High Protein (40/35/25), or Keto (25/5/70) — or set your own custom percentages. The calculator converts each macro percentage into daily grams, using 4 kcal/g for protein and carbs and 9 kcal/g for fat.
          </p>
          <p>
            The <strong>weight projection table</strong> estimates your weight at 1, 2, 4, 8, 12, and 24 weeks based on your calorie deficit or surplus, using the standard 7,700 kcal per kg of body fat approximation. This gives a realistic, week-by-week picture of what to expect — helping you stay motivated and adjust if needed.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Example Daily Calorie Targets</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'Male 30y, 80kg, 180cm', goal: 'Lose 1 lb/wk', cal: '2,259 kcal', activity: 'Moderate' },
              { label: 'Female 25y, 60kg, 165cm', goal: 'Maintain', cal: '2,085 kcal', activity: 'Moderate' },
              { label: 'Male 35y, 90kg, 175cm', goal: 'Lose 0.5 lb/wk', cal: '2,258 kcal', activity: 'Light' },
              { label: 'Female 28y, 65kg, 168cm', goal: 'Gain 1 lb/wk', cal: '2,913 kcal', activity: 'Very active' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.cal}</div>
                <div className="stat-label">{ex.goal} · {ex.activity}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="calorie-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
