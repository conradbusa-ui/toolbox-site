import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── BMR Formulas ──────────────────────────────────────────────

// Mifflin-St Jeor (most accurate for most adults)
function mifflinStJeor(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

// Harris-Benedict (revised 1984)
function harrisBenedict(weightKg, heightCm, age, sex) {
  if (sex === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
}

// Katch-McArdle (uses lean body mass)
function katchMcArdle(leanMassKg) {
  return 370 + 21.6 * leanMassKg;
}

// TDEE multipliers
const ACTIVITY_LEVELS = [
  { id: 'sedentary',    label: 'Sedentary',          desc: 'Little or no exercise',             multiplier: 1.2   },
  { id: 'light',        label: 'Lightly active',      desc: 'Light exercise 1–3 days/week',      multiplier: 1.375 },
  { id: 'moderate',     label: 'Moderately active',   desc: 'Moderate exercise 3–5 days/week',   multiplier: 1.55  },
  { id: 'very',         label: 'Very active',          desc: 'Hard exercise 6–7 days/week',       multiplier: 1.725 },
  { id: 'extra',        label: 'Extremely active',     desc: 'Very hard exercise + physical job', multiplier: 1.9   },
];

// Conversion helpers
function lbsToKg(lbs)    { return lbs * 0.453592; }
function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }
function fmt(n, dp = 0)  { return isFinite(n) ? Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp) : '—'; }

// ── Shared UI ─────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
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
      <div style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: accent ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '26px', marginBottom: '10px' }}>
      {children}
    </p>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Calorie goal bar ──────────────────────────────────────────

function CalorieGoals({ tdee }) {
  const goals = [
    { label: 'Extreme loss',  cal: tdee - 1000, note: '−1000 kcal/day', color: '#ef4444' },
    { label: 'Weight loss',   cal: tdee - 500,  note: '−500 kcal/day',  color: '#f97316' },
    { label: 'Mild loss',     cal: tdee - 250,  note: '−250 kcal/day',  color: '#eab308' },
    { label: 'Maintenance',   cal: tdee,         note: 'TDEE',           color: 'var(--accent)' },
    { label: 'Mild gain',     cal: tdee + 250,  note: '+250 kcal/day',  color: '#84cc16' },
    { label: 'Weight gain',   cal: tdee + 500,  note: '+500 kcal/day',  color: '#22c55e' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      {goals.map(g => (
        <div key={g.label} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: g.color, flexShrink: 0 }} />
          <div style={{ flex: '0 0 130px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{g.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.92rem', color: g.color, flex: '0 0 90px' }}>
            {fmt(g.cal)} kcal
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{g.note}</div>
        </div>
      ))}
    </div>
  );
}

// ── Macros breakdown ──────────────────────────────────────────

function MacroBreakdown({ calories }) {
  // Standard split: 30% protein, 40% carbs, 30% fat
  const protein = (calories * 0.30) / 4;
  const carbs   = (calories * 0.40) / 4;
  const fat     = (calories * 0.30) / 9;

  const bars = [
    { label: 'Protein', grams: protein, pct: 30, color: '#0d9488' },
    { label: 'Carbs',   grams: carbs,   pct: 40, color: '#0891b2' },
    { label: 'Fat',     grams: fat,     pct: 30, color: '#7c3aed' },
  ];

  return (
    <div style={{ marginTop: '10px' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '10px' }}>
        Suggested macronutrient split (30% protein / 40% carbs / 30% fat) at maintenance calories:
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {bars.map(b => (
          <div key={b.label} style={{
            flex: '1 1 100px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              {b.label}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--mono)', color: b.color }}>
              {fmt(b.grams)}g
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{b.pct}% of calories</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Formula comparison table ──────────────────────────────────

function FormulaComparison({ mifflin, harris, katch, leanMass, activity }) {
  const mult = ACTIVITY_LEVELS.find(a => a.id === activity)?.multiplier ?? 1.2;
  const rows = [
    { name: 'Mifflin-St Jeor', bmr: mifflin, note: 'Most accurate for most adults' },
    { name: 'Harris-Benedict', bmr: harris,  note: 'Classic formula (revised 1984)' },
    ...(katch !== null ? [{ name: 'Katch-McArdle', bmr: katch, note: 'Uses lean body mass' }] : []),
  ];

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Formula', 'BMR (kcal/day)', 'TDEE (kcal/day)', 'Notes'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.name}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmt(r.bmr)}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmt(r.bmr * mult)}</td>
              <td style={{ padding: '8px 12px', color: 'var(--text-3)', fontSize: '0.78rem' }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function BMRCalculator() {
  const [unit, setUnit]         = useState('metric');   // 'metric' | 'imperial'
  const [sex, setSex]           = useState('male');
  const [age, setAge]           = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [bodyFat, setBodyFat]   = useState('');         // optional, for Katch-McArdle
  const [activity, setActivity] = useState('moderate');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');

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
      const ft = parseFloat(heightFt) || 0;
      const ins = parseFloat(heightIn) || 0;
      hCm = ftInToCm(ft, ins);
      if (isNaN(wKg) || wKg <= 0) { setError('Enter a valid weight in lbs.'); setResult(null); return; }
      if (hCm <= 0) { setError('Enter a valid height (feet and/or inches).'); setResult(null); return; }
    }

    if (wKg < 20 || wKg > 300) { setError('Weight seems out of range (20–300 kg / 44–660 lbs).'); setResult(null); return; }
    if (hCm < 100 || hCm > 250) { setError('Height seems out of range (100–250 cm / ~3\'3"–8\'2").'); setResult(null); return; }

    const mifflin = mifflinStJeor(wKg, hCm, ageV, sex);
    const harris  = harrisBenedict(wKg, hCm, ageV, sex);

    let katch = null;
    let leanMass = null;
    const bfPct = parseFloat(bodyFat);
    if (!isNaN(bfPct) && bfPct > 0 && bfPct < 100) {
      leanMass = wKg * (1 - bfPct / 100);
      katch = katchMcArdle(leanMass);
    }

    const mult = ACTIVITY_LEVELS.find(a => a.id === activity)?.multiplier ?? 1.55;
    const bmr  = mifflin; // primary result
    const tdee = bmr * mult;

    setResult({ mifflin, harris, katch, leanMass, bmr, tdee, mult, wKg, hCm, ageV, sex, activity, bfPct });
    setError('');
  }

  function copyResults() {
    if (!result) return;
    const lines = [
      `BMR (Mifflin-St Jeor): ${fmt(result.mifflin)} kcal/day`,
      `BMR (Harris-Benedict): ${fmt(result.harris)} kcal/day`,
      result.katch ? `BMR (Katch-McArdle): ${fmt(result.katch)} kcal/day` : '',
      `TDEE: ${fmt(result.tdee)} kcal/day`,
      `Activity: ${ACTIVITY_LEVELS.find(a => a.id === result.activity)?.label}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const activityLabel = ACTIVITY_LEVELS.find(a => a.id === activity)?.label ?? '';

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>BMR Calculator</span>
          </div>
          <h1>BMR Calculator</h1>
          <p className="subtitle">
            Calculate your Basal Metabolic Rate and daily calorie needs using three clinically validated formulas — with a full TDEE breakdown, calorie goals, and macro split.
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
                    fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age + weight + height */}
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
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="e.g. 5" />
              </div>
              <div className="form-group">
                <label>Height (inches)</label>
                <input type="number" value={heightIn}
                  onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="e.g. 9" />
              </div>
            </div>
          )}

          {/* Body fat (optional) */}
          <div className="form-group">
            <label>Body fat % <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-3)' }}>(optional — enables Katch-McArdle formula)</span></label>
            <input type="number" value={bodyFat} min="1" max="70"
              onChange={e => { setBodyFat(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 18" style={{ maxWidth: '200px' }} />
          </div>

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
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activity === al.id ? 'var(--accent-hover)' : 'var(--text)' }}>
                      {al.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px' }}>{al.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: activity === al.id ? 'var(--accent-hover)' : 'var(--text-3)', flexShrink: 0 }}>
                    ×{al.multiplier}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={calculate}>Calculate BMR</button>
            <button className="btn btn-ghost" onClick={() => {
              setAge(''); setWeightKg(''); setWeightLbs(''); setHeightCm('');
              setHeightFt(''); setHeightIn(''); setBodyFat('');
              setResult(null); setError('');
            }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copyResults}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              <SectionTitle>Your BMR &amp; TDEE</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="BMR" value={`${fmt(result.mifflin)} kcal`} sub="calories at complete rest" />
                <StatCard accent label="TDEE" value={`${fmt(result.tdee)} kcal`} sub={`${activityLabel} (×${result.mult})`} />
                {result.katch && <StatCard accent label="BMR (Katch)" value={`${fmt(result.katch)} kcal`} sub="lean mass formula" />}
              </div>

              <SectionTitle>Summary</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Weight" value={`${fmt(result.wKg, 1)} kg`} sub={`${fmt(result.wKg / 0.453592, 1)} lbs`} />
                <StatCard label="Height" value={`${fmt(result.hCm, 0)} cm`} sub={`${Math.floor(result.hCm / 30.48)}′${fmt((result.hCm % 30.48) / 2.54, 0)}″`} />
                <StatCard label="Age" value={result.ageV} sub="years" />
                <StatCard label="Sex" value={result.sex.charAt(0).toUpperCase() + result.sex.slice(1)} />
                {result.leanMass && <StatCard label="Lean mass" value={`${fmt(result.leanMass, 1)} kg`} sub={`${result.bfPct}% body fat`} />}
              </div>

              <SectionTitle>Calorie goals by objective</SectionTitle>
              <CalorieGoals tdee={result.tdee} />

              <SectionTitle>Suggested macro split (at maintenance)</SectionTitle>
              <MacroBreakdown calories={result.tdee} />

              <SectionTitle>Formula comparison</SectionTitle>
              <FormulaComparison
                mifflin={result.mifflin} harris={result.harris}
                katch={result.katch} leanMass={result.leanMass}
                activity={result.activity}
              />

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ BMR estimates vary by formula and individual. These results are for informational purposes and should not replace personalised advice from a registered dietitian or healthcare provider.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>What Is BMR and How Is It Calculated?</h2>
          <p>
            Your <strong>Basal Metabolic Rate (BMR)</strong> is the number of calories your body needs to maintain basic physiological functions — breathing, circulation, cell production, and temperature regulation — while at complete rest. It represents the minimum energy your body requires to survive, typically accounting for 60–75% of total daily calorie expenditure.
          </p>
          <p>
            This calculator uses three clinically validated formulas. The <strong>Mifflin-St Jeor equation</strong> (1990) is considered the most accurate for most adults and is the primary result shown. The <strong>Harris-Benedict equation</strong> (revised 1984) is the classic formula used for decades in clinical settings. The <strong>Katch-McArdle formula</strong> is available when you enter your body fat percentage — it calculates from lean body mass and is often more accurate for athletic individuals with above-average muscle mass.
          </p>
          <p>
            BMR alone doesn't tell you how many calories to eat — you need your <strong>Total Daily Energy Expenditure (TDEE)</strong>, which multiplies your BMR by an activity factor ranging from 1.2 (sedentary) to 1.9 (extremely active). The calorie goals section shows what to target for weight loss, maintenance, or muscle gain.
          </p>
          <p>
            The <strong>macro breakdown</strong> shows a standard 30% protein / 40% carbs / 30% fat split in grams, calculated from your maintenance calories. Adjust these ratios based on your specific goals — higher protein is typically recommended for fat loss and muscle building.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Example BMR Results</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'Male, 30, 80kg, 180cm', bmr: '1,780 kcal', tdee: '2,759 kcal', note: 'moderately active' },
              { label: 'Female, 25, 60kg, 165cm', bmr: '1,345 kcal', tdee: '2,085 kcal', note: 'moderately active' },
              { label: 'Male, 45, 90kg, 175cm', bmr: '1,774 kcal', tdee: '2,439 kcal', note: 'lightly active' },
              { label: 'Female, 35, 70kg, 170cm', bmr: '1,427 kcal', tdee: '2,461 kcal', note: 'very active' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px', fontFamily: 'var(--mono)' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.bmr}</div>
                <div className="stat-label">TDEE: {ex.tdee}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{ex.note}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="bmr-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
