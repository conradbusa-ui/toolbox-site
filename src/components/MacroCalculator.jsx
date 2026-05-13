import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core formulas ─────────────────────────────────────────────

function mifflin(wKg, hCm, age, sex) {
  const base = 10 * wKg + 6.25 * hCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_MULTS = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  very:      1.9,
};

const GOAL_DELTAS = {
  lose2:    -1000,
  lose1:    -500,
  lose05:   -250,
  maintain: 0,
  gain05:   250,
  gain1:    500,
};

// Macro presets — protein/carbs/fat % of calories
const MACRO_PRESETS = [
  { id: 'balanced',    label: 'Balanced',           p: 30, c: 40, f: 30, desc: 'General health' },
  { id: 'highprotein', label: 'High Protein',        p: 40, c: 30, f: 30, desc: 'Muscle building / fat loss' },
  { id: 'lowcarb',     label: 'Low Carb',            p: 35, c: 25, f: 40, desc: 'Fat loss / metabolic health' },
  { id: 'keto',        label: 'Keto',                p: 25, c: 5,  f: 70, desc: 'Ketogenic diet' },
  { id: 'athletic',    label: 'Athletic',            p: 25, c: 55, f: 20, desc: 'Endurance / performance' },
  { id: 'custom',      label: 'Custom',              p: 0,  c: 0,  f: 0,  desc: 'Set your own split' },
];

// Protein per kg recommendations
const PROTEIN_REC = {
  sedentary: { min: 0.8,  max: 1.0,  label: 'Sedentary (RDA)' },
  light:     { min: 1.2,  max: 1.6,  label: 'Lightly active' },
  moderate:  { min: 1.4,  max: 1.8,  label: 'Moderately active' },
  active:    { min: 1.6,  max: 2.0,  label: 'Active' },
  very:      { min: 1.8,  max: 2.2,  label: 'Very active / athlete' },
};

// Caloric density
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

function calcMacros(calories, pPct, cPct, fPct) {
  return {
    protein: Math.round((calories * pPct / 100) / KCAL_PER_G.protein),
    carbs:   Math.round((calories * cPct / 100) / KCAL_PER_G.carbs),
    fat:     Math.round((calories * fPct / 100) / KCAL_PER_G.fat),
    proteinCal: Math.round(calories * pPct / 100),
    carbsCal:   Math.round(calories * cPct / 100),
    fatCal:     Math.round(calories * fPct / 100),
  };
}

// Helpers
function lbsToKg(lbs)        { return lbs * 0.453592; }
function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }
function fmt(n, dp = 0)       { return isFinite(n) ? Math.round(n * 10**dp) / 10**dp : 0; }

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

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px 18px', textAlign: 'center',
      flex: '1 1 120px', minWidth: '110px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.65rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

// ── Macro donut chart (SVG) ───────────────────────────────────

function MacroDonut({ pPct, cPct, fPct, calories }) {
  const R = 52, cx = 64, cy = 64, stroke = 18;
  const circ = 2 * Math.PI * R;

  const segments = [
    { pct: pPct, color: '#0d9488', label: 'Protein' },
    { pct: cPct, color: '#0891b2', label: 'Carbs'   },
    { pct: fPct, color: '#7c3aed', label: 'Fat'     },
  ];

  let offset = 0;
  const arcs = segments.map(s => {
    const len = (s.pct / 100) * circ;
    const arc = { ...s, len, offset, dash: `${len} ${circ}` };
    offset += len;
    return arc;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg width="128" height="128" viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={a.color} strokeWidth={stroke}
            strokeDasharray={a.dash}
            strokeDashoffset={-a.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))}
        {/* Centre text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" fontFamily="var(--mono)">
          {fmt(calories)}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="var(--text-3)" fontFamily="var(--mono)">
          kcal
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: 55 }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: s.color, fontWeight: 700 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Macro detail cards ────────────────────────────────────────

function MacroDetailCard({ label, grams, kcal, pct, color, icon, subNote }) {
  return (
    <div style={{
      flex: '1 1 140px', minWidth: '130px',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      {/* Color bar */}
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 800, fontFamily: 'var(--mono)', color, lineHeight: 1 }}>
          {grams}g
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '4px', lineHeight: 1.5 }}>
          {kcal} kcal · {pct}%
        </div>
        {subNote && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
            {subNote}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meal split table ──────────────────────────────────────────

function MealSplit({ macros, calories }) {
  const meals = [
    { label: 'Breakfast',    share: 0.25 },
    { label: 'Morning snack',share: 0.10 },
    { label: 'Lunch',        share: 0.30 },
    { label: 'Afternoon snack', share: 0.10 },
    { label: 'Dinner',       share: 0.25 },
  ];

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Meal', 'Calories', 'Protein', 'Carbs', 'Fat'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, i) => (
            <tr key={meal.label} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{meal.label}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: 'var(--accent-hover)', fontWeight: 700 }}>{fmt(calories * meal.share)}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#0d9488', fontWeight: 600 }}>{fmt(macros.protein * meal.share)}g</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#0891b2', fontWeight: 600 }}>{fmt(macros.carbs * meal.share)}g</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#7c3aed', fontWeight: 600 }}>{fmt(macros.fat * meal.share)}g</td>
            </tr>
          ))}
          {/* Total row */}
          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--accent-light)' }}>
            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--accent-hover)' }}>Total</td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmt(calories)}</td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#0d9488' }}>{macros.protein}g</td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#0891b2' }}>{macros.carbs}g</td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#7c3aed' }}>{macros.fat}g</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary',         desc: 'Desk job, minimal exercise',        mult: 1.2   },
  { id: 'light',     label: 'Lightly active',     desc: 'Light exercise 1–3 days/week',      mult: 1.375 },
  { id: 'moderate',  label: 'Moderately active',  desc: 'Moderate exercise 3–5 days/week',   mult: 1.55  },
  { id: 'active',    label: 'Active',             desc: 'Hard exercise 5–6 days/week',       mult: 1.725 },
  { id: 'very',      label: 'Very active',         desc: 'Physical job + daily hard exercise', mult: 1.9  },
];

const GOALS = [
  { id: 'lose2',    label: 'Lose 2 lbs/week',   delta: -1000 },
  { id: 'lose1',    label: 'Lose 1 lb/week',    delta: -500  },
  { id: 'lose05',   label: 'Lose 0.5 lb/week',  delta: -250  },
  { id: 'maintain', label: 'Maintain weight',   delta: 0     },
  { id: 'gain05',   label: 'Gain 0.5 lb/week',  delta: 250   },
  { id: 'gain1',    label: 'Gain 1 lb/week',    delta: 500   },
];

export default function MacroCalculator() {
  // Body info
  const [unit, setUnit]           = useState('metric');
  const [sex, setSex]             = useState('male');
  const [age, setAge]             = useState('');
  const [weightKg, setWeightKg]   = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightCm, setHeightCm]   = useState('');
  const [heightFt, setHeightFt]   = useState('');
  const [heightIn, setHeightIn]   = useState('');

  // Goal & activity
  const [activity, setActivity]   = useState('moderate');
  const [goalId, setGoalId]       = useState('maintain');

  // Macro preset
  const [presetId, setPresetId]   = useState('balanced');
  const [customP, setCustomP]     = useState('');
  const [customC, setCustomC]     = useState('');
  const [customF, setCustomF]     = useState('');

  // Result
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  const isMetric = unit === 'metric';

  function calculate() {
    const ageV = parseFloat(age);
    if (isNaN(ageV) || ageV < 1 || ageV > 120) { setError('Enter a valid age (1–120).'); setResult(null); return; }

    let wKg, hCm;
    if (isMetric) {
      wKg = parseFloat(weightKg);
      hCm = parseFloat(heightCm);
      if (isNaN(wKg) || wKg <= 0) { setError('Enter a valid weight in kg.'); setResult(null); return; }
      if (isNaN(hCm) || hCm <= 0) { setError('Enter a valid height in cm.'); setResult(null); return; }
    } else {
      wKg = lbsToKg(parseFloat(weightLbs));
      hCm = ftInToCm(parseFloat(heightFt)||0, parseFloat(heightIn)||0);
      if (isNaN(wKg) || wKg <= 0) { setError('Enter a valid weight in lbs.'); setResult(null); return; }
      if (hCm <= 0) { setError('Enter a valid height.'); setResult(null); return; }
    }
    if (wKg < 20 || wKg > 300) { setError('Weight seems out of range (20–300 kg).'); setResult(null); return; }
    if (hCm < 100 || hCm > 250) { setError('Height seems out of range (100–250 cm).'); setResult(null); return; }

    // Macro percentages
    let pPct, cPct, fPct;
    if (presetId === 'custom') {
      pPct = parseFloat(customP) || 0;
      cPct = parseFloat(customC) || 0;
      fPct = parseFloat(customF) || 0;
      const sum = pPct + cPct + fPct;
      if (Math.abs(sum - 100) > 0.5) { setError(`Custom macros must add up to 100% (currently ${fmt(sum, 1)}%).`); setResult(null); return; }
    } else {
      const preset = MACRO_PRESETS.find(p => p.id === presetId);
      pPct = preset.p; cPct = preset.c; fPct = preset.f;
    }

    const bmrVal  = mifflin(wKg, hCm, ageV, sex);
    const actMult = ACTIVITY_MULTS[activity] || 1.55;
    const tdee    = bmrVal * actMult;
    const goalDelta = GOAL_DELTAS[goalId] || 0;
    const targetCal = Math.max(1200, tdee + goalDelta); // floor at 1200

    const macros = calcMacros(targetCal, pPct, cPct, fPct);

    // Protein recommendation range
    const protRec = PROTEIN_REC[activity];
    const protRecMin = Math.round(wKg * protRec.min);
    const protRecMax = Math.round(wKg * protRec.max);
    const protOk = macros.protein >= protRecMin && macros.protein <= protRecMax * 1.2;

    setResult({
      bmr: bmrVal, tdee, targetCal, goalDelta,
      macros, pPct, cPct, fPct,
      wKg, hCm, ageV, sex,
      actMult, activity, goalId,
      protRecMin, protRecMax, protOk,
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const { macros, targetCal, tdee, bmr } = result;
    const lines = [
      `Daily calories: ${fmt(targetCal)} kcal`,
      `Protein: ${macros.protein}g (${result.pPct}%)`,
      `Carbs: ${macros.carbs}g (${result.cPct}%)`,
      `Fat: ${macros.fat}g (${result.fPct}%)`,
      `TDEE: ${fmt(tdee)} kcal`,
      `BMR: ${fmt(bmr)} kcal`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const selectedPreset = MACRO_PRESETS.find(p => p.id === presetId);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Macro Calculator</span>
          </div>
          <h1>Macro Calculator</h1>
          <p className="subtitle">
            Calculate your exact daily protein, carbs, and fat targets based on your body, activity level, and goal — with a meal-by-meal breakdown and 5 macro preset splits.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Unit + sex */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['metric', 'imperial'].map(u => (
              <button key={u} onClick={() => { setUnit(u); setResult(null); setError(''); }}
                style={{
                  flex: 1, minWidth: '130px', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${unit === u ? 'var(--accent)' : 'var(--border)'}`,
                  background: unit === u ? 'var(--accent-light)' : 'var(--surface2)',
                  color: unit === u ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {u === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lbs / ft)'}
              </button>
            ))}
            {['male', 'female'].map(s => (
              <button key={s} onClick={() => { setSex(s); setResult(null); }}
                style={{
                  flex: 1, minWidth: '90px', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${sex === s ? 'var(--accent)' : 'var(--border)'}`,
                  background: sex === s ? 'var(--accent-light)' : 'var(--surface2)',
                  color: sex === s ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Age + weight + height */}
          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input type="number" value={age} min="1" max="120"
                onChange={e => { setAge(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 30" />
            </div>
            {isMetric ? (
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

          {isMetric ? (
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
                  placeholder="5" />
              </div>
              <div className="form-group">
                <label>Height (inches)</label>
                <input type="number" value={heightIn}
                  onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                  placeholder="9" />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '6px' }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => { setGoalId(g.id); setResult(null); }}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${goalId === g.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: goalId === g.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: goalId === g.id ? 'var(--accent-hover)' : 'var(--text)' }}>{g.label}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '2px' }}>
                    {g.delta === 0 ? 'TDEE' : (g.delta > 0 ? '+' : '') + g.delta + ' kcal/day'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Macro preset */}
          <div className="form-group">
            <label>Macro split</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '6px', marginBottom: '10px' }}>
              {MACRO_PRESETS.map(p => (
                <button key={p.id} onClick={() => { setPresetId(p.id); setResult(null); }}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${presetId === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: presetId === p.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: presetId === p.id ? 'var(--accent-hover)' : 'var(--text)' }}>{p.label}</div>
                  {p.id !== 'custom' ? (
                    <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '2px' }}>
                      {p.p}P / {p.c}C / {p.f}F
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>Set your own %</div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom inputs */}
            {presetId === 'custom' && (
              <div className="form-row">
                {[
                  { label: 'Protein %', val: customP, set: setCustomP },
                  { label: 'Carbs %',   val: customC, set: setCustomC },
                  { label: 'Fat %',     val: customF, set: setCustomF },
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
          <div className="btn-group" style={{ marginTop: '4px' }}>
            <button className="btn btn-primary" onClick={calculate}>Calculate Macros</button>
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

              {/* Calorie summary */}
              <SectionTitle>Daily calorie target</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="Target calories" value={`${fmt(result.targetCal)} kcal`}
                  sub={GOALS.find(g => g.id === result.goalId)?.label} />
                <StatCard accent label="TDEE (maintenance)" value={`${fmt(result.tdee)} kcal`}
                  sub={`BMR × ${result.actMult}`} />
                <StatCard accent label="BMR" value={`${fmt(result.bmr)} kcal`} sub="at rest" />
              </div>

              {result.goalDelta !== 0 && (
                <div style={{
                  marginTop: '10px', padding: '9px 14px', borderRadius: 'var(--radius-sm)',
                  background: result.goalDelta < 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${result.goalDelta < 0 ? '#fca5a5' : '#86efac'}`,
                  fontSize: '0.82rem', fontWeight: 600,
                  color: result.goalDelta < 0 ? '#dc2626' : '#15803d',
                }}>
                  {result.goalDelta < 0
                    ? `🔥 ${Math.abs(result.goalDelta)} kcal/day deficit below maintenance`
                    : `💪 +${result.goalDelta} kcal/day surplus above maintenance`}
                </div>
              )}

              {/* Macro split */}
              <SectionTitle>Your macros — {selectedPreset?.label} split</SectionTitle>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <MacroDonut pPct={result.pPct} cPct={result.cPct} fPct={result.fPct} calories={result.targetCal} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                  <MacroDetailCard
                    label="Protein" grams={result.macros.protein}
                    kcal={result.macros.proteinCal} pct={result.pPct}
                    color="#0d9488" icon="🥩"
                    subNote={`Rec: ${result.protRecMin}–${result.protRecMax}g/day`}
                  />
                  <MacroDetailCard
                    label="Carbohydrates" grams={result.macros.carbs}
                    kcal={result.macros.carbsCal} pct={result.cPct}
                    color="#0891b2" icon="🌾"
                    subNote="4 kcal per gram"
                  />
                  <MacroDetailCard
                    label="Fat" grams={result.macros.fat}
                    kcal={result.macros.fatCal} pct={result.fPct}
                    color="#7c3aed" icon="🥑"
                    subNote="9 kcal per gram"
                  />
                </div>
              </div>

              {/* Protein recommendation check */}
              {!result.protOk && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: '#fef9c3', border: '1px solid #fcd34d',
                  fontSize: '0.8rem', color: '#92400e',
                }}>
                  ⚠ Your protein target ({result.macros.protein}g) is below the recommended range for your activity level ({result.protRecMin}–{result.protRecMax}g). Consider increasing protein or choosing a High Protein split.
                </div>
              )}

              {/* Preset comparison */}
              <SectionTitle>Compare all macro splits</SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Split', 'Protein', 'Carbs', 'Fat', 'Best for'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MACRO_PRESETS.filter(p => p.id !== 'custom').map((p, i) => {
                      const m = calcMacros(result.targetCal, p.p, p.c, p.f);
                      const isActive = p.id === presetId;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: isActive ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                          <td style={{ padding: '8px 12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-hover)' : 'var(--text)' }}>
                            {p.label} {isActive && '✓'}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#0d9488', fontWeight: 600 }}>{m.protein}g</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#0891b2', fontWeight: 600 }}>{m.carbs}g</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#7c3aed', fontWeight: 600 }}>{m.fat}g</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.76rem', color: 'var(--text-3)' }}>{p.desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Meal split */}
              <SectionTitle>Meal-by-meal breakdown</SectionTitle>
              <MealSplit macros={result.macros} calories={result.targetCal} />

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ Macro targets are estimates based on the Mifflin-St Jeor equation. Individual needs vary. These figures are for informational purposes and should not replace advice from a registered dietitian.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Calculate Your Macros</h2>
          <p>
            Macronutrients — protein, carbohydrates, and fat — are the three nutrients that provide calories. Knowing your daily macro targets helps you eat in a way that supports your specific goal, whether that's losing fat, building muscle, improving athletic performance, or simply eating a balanced diet. This calculator works out your personalised targets in three steps.
          </p>
          <p>
            <strong>Step 1 — Calories:</strong> Your total daily energy expenditure (TDEE) is calculated using the Mifflin-St Jeor BMR formula multiplied by your activity factor. A calorie deficit or surplus is then applied based on your goal. A 500 kcal/day deficit produces approximately 1 lb of fat loss per week; a 500 kcal/day surplus supports lean muscle gain.
          </p>
          <p>
            <strong>Step 2 — Macro split:</strong> Choose from five evidence-based preset splits or enter your own. The <strong>Balanced (30/40/30)</strong> split suits most people for general health. <strong>High Protein (40/30/30)</strong> is ideal for body recomposition — cutting fat while preserving muscle. <strong>Low Carb (35/25/40)</strong> reduces insulin response and suits metabolic health goals. <strong>Keto (25/5/70)</strong> keeps carbs under 5% to maintain ketosis. <strong>Athletic (25/55/20)</strong> maximises glycogen stores for endurance performance.
          </p>
          <p>
            <strong>Step 3 — Grams:</strong> Each macro percentage is converted to daily grams using the caloric densities: protein = 4 kcal/g, carbs = 4 kcal/g, fat = 9 kcal/g. The result also shows a protein recommendation range based on your activity level (0.8–2.2g per kg of bodyweight) and a meal-by-meal breakdown across five meals using standard meal share percentages.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Macro Target Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))' }}>
            {[
              { label: 'Male 30, 80kg, moderate, lose 1lb', protein: '169g', carbs: '226g', fat: '75g',  kcal: '2,259' },
              { label: 'Female 25, 60kg, moderate, maintain', protein: '156g', carbs: '209g', fat: '70g', kcal: '2,085' },
              { label: 'Male 35, 90kg, active, maintain',    protein: '236g', carbs: '315g', fat: '105g', kcal: '3,146' },
              { label: 'Female 28, 65kg, light, keto',       protein: '120g', carbs: '24g',  fat: '150g', kcal: '1,924' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '0.95rem' }}>{ex.kcal} kcal</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '3px', fontFamily: 'var(--mono)' }}>
                  P:{ex.protein} · C:{ex.carbs} · F:{ex.fat}
                </div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="macro-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
