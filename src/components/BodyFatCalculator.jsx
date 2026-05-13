import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Formulas ──────────────────────────────────────────────────

// U.S. Navy Method
function navyBodyFat(sex, waistCm, neckCm, heightCm, hipCm) {
  if (sex === 'male') {
    return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  return 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
}

// BMI Method (Deurenberg)
function bmiBodyFat(bmi, age, sex) {
  const sexVal = sex === 'male' ? 1 : 0;
  return 1.20 * bmi + 0.23 * age - 10.8 * sexVal - 5.4;
}

// Jackson-Pollock 3-site skinfold (male: chest/abdomen/thigh, female: tricep/suprailiac/thigh)
function jacksonPollock3(sex, age, s1, s2, s3) {
  const sum = s1 + s2 + s3;
  let density;
  if (sex === 'male') {
    density = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
  } else {
    density = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  }
  return (495 / density) - 450;
}

// Helpers
function cmToIn(cm)    { return cm / 2.54; }
function inToCm(inch)  { return inch * 2.54; }
function lbsToKg(lbs)  { return lbs * 0.453592; }
function kgToLbs(kg)   { return kg / 0.453592; }
function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }
function bmi(wKg, hCm) { return wKg / Math.pow(hCm / 100, 2); }
function fmt(n, dp = 1) { return isFinite(n) ? parseFloat(n.toFixed(dp)) : null; }

// Body fat categories (ACE)
function getCategory(bf, sex) {
  if (sex === 'male') {
    if (bf < 6)  return { label: 'Essential fat',  color: '#7c3aed', bg: '#ede9fe' };
    if (bf < 14) return { label: 'Athletes',        color: '#0891b2', bg: '#e0f2fe' };
    if (bf < 18) return { label: 'Fitness',         color: '#0d9488', bg: '#ccfbf1' };
    if (bf < 25) return { label: 'Average',         color: '#16a34a', bg: '#dcfce7' };
    return              { label: 'Obese',           color: '#dc2626', bg: '#fee2e2' };
  } else {
    if (bf < 14) return { label: 'Essential fat',  color: '#7c3aed', bg: '#ede9fe' };
    if (bf < 21) return { label: 'Athletes',        color: '#0891b2', bg: '#e0f2fe' };
    if (bf < 25) return { label: 'Fitness',         color: '#0d9488', bg: '#ccfbf1' };
    if (bf < 32) return { label: 'Average',         color: '#16a34a', bg: '#dcfce7' };
    return              { label: 'Obese',           color: '#dc2626', bg: '#fee2e2' };
  }
}

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
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

// ── Body fat gauge ────────────────────────────────────────────

function BFGauge({ bf, sex }) {
  if (!isFinite(bf) || bf <= 0) return null;
  const max = 50;
  const pct = Math.min(bf / max * 100, 100);
  const cat = getCategory(bf, sex);

  // Colour zones for background gradient
  const zones = sex === 'male'
    ? [
        { label: 'Essential', end: 6/max*100,  color: '#7c3aed' },
        { label: 'Athletes',  end: 14/max*100, color: '#0891b2' },
        { label: 'Fitness',   end: 18/max*100, color: '#0d9488' },
        { label: 'Average',   end: 25/max*100, color: '#16a34a' },
        { label: 'Obese',     end: 100,         color: '#dc2626' },
      ]
    : [
        { label: 'Essential', end: 14/max*100, color: '#7c3aed' },
        { label: 'Athletes',  end: 21/max*100, color: '#0891b2' },
        { label: 'Fitness',   end: 25/max*100, color: '#0d9488' },
        { label: 'Average',   end: 32/max*100, color: '#16a34a' },
        { label: 'Obese',     end: 100,         color: '#dc2626' },
      ];

  return (
    <div style={{ marginTop: '14px' }}>
      {/* Gauge bar */}
      <div style={{ position: 'relative', height: '14px', borderRadius: '99px', overflow: 'hidden', background: 'var(--surface2)', marginBottom: '6px' }}>
        {/* Gradient zones */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to right, #7c3aed, #0891b2, #0d9488, #16a34a, #dc2626)`,
          opacity: 0.25,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: cat.color,
          borderRadius: '99px',
          transition: 'width 0.4s',
        }} />
        {/* Pointer line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pct}%`,
          width: '2px', background: 'white',
          transform: 'translateX(-50%)',
        }} />
      </div>
      {/* Zone labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-3)', marginBottom: '12px' }}>
        {zones.map(z => (
          <span key={z.label} style={{ color: z.color, fontWeight: 600 }}>{z.label}</span>
        ))}
      </div>
      {/* Category badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: 'var(--radius-sm)',
        background: cat.bg, border: `1px solid ${cat.color}`,
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: cat.color }}>{cat.label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem', color: cat.color }}>{fmt(bf)}%</span>
      </div>
    </div>
  );
}

// ── Body composition breakdown ────────────────────────────────

function CompositionBreakdown({ bf, wKg, unit }) {
  const fatMass = wKg * bf / 100;
  const leanMass = wKg - fatMass;
  const toDisplay = (kg) => unit === 'imperial'
    ? `${fmt(kgToLbs(kg), 1)} lbs`
    : `${fmt(kg, 1)} kg`;

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
      {[
        { label: 'Total weight', val: toDisplay(wKg),    color: 'var(--text)',        icon: '⚖' },
        { label: 'Fat mass',     val: toDisplay(fatMass), color: '#dc2626',           icon: '🔴' },
        { label: 'Lean mass',    val: toDisplay(leanMass), color: '#16a34a',          icon: '💪' },
        { label: 'Body fat %',   val: `${fmt(bf)}%`,      color: 'var(--accent-hover)', icon: '%' },
      ].map(c => (
        <div key={c.label} style={{
          flex: '1 1 110px', background: 'var(--surface2)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{c.icon}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--mono)', color: c.color }}>{c.val}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Body fat reference table ──────────────────────────────────

function ReferenceTable({ sex }) {
  const maleCats = [
    { label: 'Essential fat', range: '2–5%',   color: '#7c3aed' },
    { label: 'Athletes',      range: '6–13%',  color: '#0891b2' },
    { label: 'Fitness',       range: '14–17%', color: '#0d9488' },
    { label: 'Average',       range: '18–24%', color: '#16a34a' },
    { label: 'Obese',         range: '25%+',   color: '#dc2626' },
  ];
  const femaleCats = [
    { label: 'Essential fat', range: '10–13%', color: '#7c3aed' },
    { label: 'Athletes',      range: '14–20%', color: '#0891b2' },
    { label: 'Fitness',       range: '21–24%', color: '#0d9488' },
    { label: 'Average',       range: '25–31%', color: '#16a34a' },
    { label: 'Obese',         range: '32%+',   color: '#dc2626' },
  ];
  const cats = sex === 'male' ? maleCats : femaleCats;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
      {cats.map(c => (
        <div key={c.label} style={{
          flex: '1 1 100px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface2)', border: `1px solid var(--border)`,
          textAlign: 'center',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, marginBottom: '6px' }} />
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.9rem', color: c.color }}>{c.range}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', fontWeight: 600 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Mode: Navy method ─────────────────────────────────────────

function NavyMode({ sex, unit, wKg }) {
  const [waist, setWaist] = useState('');
  const [neck,  setNeck]  = useState('');
  const [hip,   setHip]   = useState('');
  const [height,setHeight]= useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  const isMetric = unit === 'metric';
  const toNum = v => parseFloat(v);
  const toCm  = v => isMetric ? toNum(v) : inToCm(toNum(v));
  const unitLabel = isMetric ? 'cm' : 'in';

  function calculate() {
    let hCm;
    if (isMetric) {
      hCm = toNum(height);
    } else {
      hCm = ftInToCm(parseFloat(heightFt)||0, parseFloat(heightIn)||0);
    }
    const wCm = toCm(waist);
    const nCm = toCm(neck);
    const hipCm = sex === 'female' ? toCm(hip) : 0;

    if (!isFinite(hCm) || hCm <= 0) { setError('Enter a valid height.'); return; }
    if (!isFinite(wCm) || wCm <= 0) { setError('Enter a valid waist measurement.'); return; }
    if (!isFinite(nCm) || nCm <= 0) { setError('Enter a valid neck measurement.'); return; }
    if (sex === 'female' && (!isFinite(hipCm) || hipCm <= 0)) { setError('Enter a valid hip measurement.'); return; }
    if (nCm >= wCm) { setError('Neck circumference must be smaller than waist circumference.'); return; }

    const bf = navyBodyFat(sex, wCm, nCm, hCm, hipCm);

    if (!isFinite(bf) || bf < 0 || bf > 70) { setError('Measurements produced an invalid result. Please check your inputs.'); return; }

    setResult({ bf, wKg });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        The U.S. Navy formula uses circumference measurements to estimate body fat. Measure at the widest points with a tape measure.
      </p>

      {isMetric ? (
        <div className="form-group">
          <label>Height ({unitLabel})</label>
          <input type="number" value={height} onChange={e => { setHeight(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="e.g. 175" />
        </div>
      ) : (
        <div className="form-row">
          <div className="form-group">
            <label>Height (ft)</label>
            <input type="number" value={heightFt} onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }} placeholder="5" />
          </div>
          <div className="form-group">
            <label>Height (in)</label>
            <input type="number" value={heightIn} onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }} placeholder="9" />
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Waist ({unitLabel}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>at navel</span></label>
          <input type="number" value={waist} onChange={e => { setWaist(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} placeholder={isMetric ? '85' : '33'} />
        </div>
        <div className="form-group">
          <label>Neck ({unitLabel}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>below larynx</span></label>
          <input type="number" value={neck} onChange={e => { setNeck(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} placeholder={isMetric ? '38' : '15'} />
        </div>
        {sex === 'female' && (
          <div className="form-group">
            <label>Hip ({unitLabel}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>at widest</span></label>
            <input type="number" value={hip} onChange={e => { setHip(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()} placeholder={isMetric ? '95' : '37'} />
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setWaist(''); setNeck(''); setHip(''); setHeight(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <>
          <BFGauge bf={result.bf} sex={sex} />
          {wKg > 0 && <CompositionBreakdown bf={result.bf} wKg={wKg} unit={unit} />}
        </>
      )}
    </div>
  );
}

// ── Mode: BMI method ──────────────────────────────────────────

function BMIMode({ sex, unit, wKg }) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [age, setAge]     = useState('');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  const isMetric = unit === 'metric';

  function calculate() {
    const ageV = parseFloat(age);
    let wKgVal, hCm;

    if (isMetric) {
      wKgVal = parseFloat(weight);
      hCm    = parseFloat(height);
    } else {
      wKgVal = lbsToKg(parseFloat(weightLbs));
      hCm    = ftInToCm(parseFloat(heightFt)||0, parseFloat(heightIn)||0);
    }

    if (isNaN(ageV) || ageV < 1 || ageV > 120) { setError('Enter a valid age.'); return; }
    if (!isFinite(wKgVal) || wKgVal <= 0) { setError('Enter a valid weight.'); return; }
    if (!isFinite(hCm) || hCm <= 0) { setError('Enter a valid height.'); return; }

    const bmiVal = bmi(wKgVal, hCm);
    const bf = bmiBodyFat(bmiVal, ageV, sex);

    if (!isFinite(bf) || bf < 0) { setError('Could not calculate body fat. Check your inputs.'); return; }

    setResult({ bf, bmiVal, wKgVal });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Estimates body fat from BMI using the Deurenberg formula. Less precise than the Navy method but requires no measurements beyond weight and height.
      </p>

      <div className="form-row">
        {isMetric ? (
          <>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" value={weight} onChange={e => { setWeight(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="75" />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input type="number" value={height} onChange={e => { setHeight(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="175" />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Weight (lbs)</label>
              <input type="number" value={weightLbs} onChange={e => { setWeightLbs(e.target.value); setResult(null); setError(''); }} placeholder="165" />
            </div>
            <div className="form-group">
              <label>Height (ft)</label>
              <input type="number" value={heightFt} onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }} placeholder="5" />
            </div>
            <div className="form-group">
              <label>Height (in)</label>
              <input type="number" value={heightIn} onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }} placeholder="9" />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Age (years)</label>
          <input type="number" value={age} onChange={e => { setAge(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="30" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setWeight(''); setHeight(''); setWeightLbs(''); setHeightFt(''); setHeightIn(''); setAge(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Body Fat %" value={`${fmt(result.bf)}%`} sub={getCategory(result.bf, sex).label} />
            <StatCard label="BMI" value={fmt(result.bmiVal)} sub="kg/m²" />
          </div>
          <BFGauge bf={result.bf} sex={sex} />
          <CompositionBreakdown bf={result.bf} wKg={result.wKgVal} unit={unit} />
        </>
      )}
    </div>
  );
}

// ── Mode: Skinfold ────────────────────────────────────────────

function SkinfoldMode({ sex, unit }) {
  const [age, setAge] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  const maleSites   = ['Chest (mm)', 'Abdomen (mm)', 'Thigh (mm)'];
  const femaleSites = ['Tricep (mm)', 'Suprailiac (mm)', 'Thigh (mm)'];
  const sites = sex === 'male' ? maleSites : femaleSites;

  function calculate() {
    const ageV = parseFloat(age);
    const v1 = parseFloat(s1), v2 = parseFloat(s2), v3 = parseFloat(s3);

    if (isNaN(ageV) || ageV < 1) { setError('Enter a valid age.'); return; }
    if (isNaN(v1) || v1 <= 0 || isNaN(v2) || v2 <= 0 || isNaN(v3) || v3 <= 0) {
      setError('Enter valid measurements (mm) for all three skinfold sites.'); return;
    }

    const bf = jacksonPollock3(sex, ageV, v1, v2, v3);

    if (!isFinite(bf) || bf < 0 || bf > 70) { setError('Measurements produced an invalid result. Check your inputs.'); return; }

    setResult({ bf, sum: v1 + v2 + v3 });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        The Jackson-Pollock 3-site skinfold method uses calipers to pinch and measure fat at three body sites. This is the most accurate of the three methods when done correctly.
      </p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '16px', fontStyle: 'italic' }}>
        {sex === 'male'
          ? 'Sites: Chest (diagonal fold halfway between upper armpit and nipple), Abdomen (vertical fold 2cm right of navel), Thigh (vertical fold at midpoint of thigh).'
          : 'Sites: Tricep (vertical fold at midpoint of back of upper arm), Suprailiac (diagonal fold just above hip bone), Thigh (vertical fold at midpoint of thigh).'}
      </p>

      <div className="form-group">
        <label>Age (years)</label>
        <input type="number" value={age} onChange={e => { setAge(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="30" style={{ maxWidth: '160px' }} />
      </div>

      <div className="form-row">
        {[{ val: s1, set: setS1 }, { val: s2, set: setS2 }, { val: s3, set: setS3 }].map((f, i) => (
          <div key={i} className="form-group">
            <label>{sites[i]}</label>
            <input type="number" value={f.val}
              onChange={e => { f.set(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 15" />
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setAge(''); setS1(''); setS2(''); setS3(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Body Fat %" value={`${fmt(result.bf)}%`} sub={getCategory(result.bf, sex).label} />
            <StatCard label="Skinfold sum" value={`${result.sum} mm`} sub="3-site total" />
          </div>
          <BFGauge bf={result.bf} sex={sex} />
        </>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Navy Method',   desc: 'circumference measurements' },
  { label: 'BMI Method',    desc: 'weight & height only' },
  { label: 'Skinfold (JP)', desc: 'caliper 3-site method' },
];

// ── Main component ────────────────────────────────────────────

export default function BodyFatCalculator() {
  const [mode, setMode]   = useState(0);
  const [unit, setUnit]   = useState('metric');
  const [sex,  setSex]    = useState('male');
  const [weightKg, setWeightKg]   = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  const wKg = unit === 'metric'
    ? parseFloat(weightKg) || 0
    : lbsToKg(parseFloat(weightLbs) || 0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Body Fat Calculator</span>
          </div>
          <h1>Body Fat Calculator</h1>
          <p className="subtitle">
            Estimate your body fat percentage using three clinically validated methods — Navy circumference, BMI-based, and Jackson-Pollock skinfold — with a visual gauge and full body composition breakdown.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Global controls: unit + sex */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['metric', 'imperial'].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                style={{
                  flex: 1, minWidth: '120px', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${unit === u ? 'var(--accent)' : 'var(--border)'}`,
                  background: unit === u ? 'var(--accent-light)' : 'var(--surface2)',
                  color: unit === u ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {u === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lbs/ft)'}
              </button>
            ))}
            {['male', 'female'].map(s => (
              <button key={s} onClick={() => setSex(s)}
                style={{
                  flex: 1, minWidth: '100px', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
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

          {/* Optional weight for body composition */}
          <div className="form-group" style={{ maxWidth: '220px' }}>
            <label>
              {unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'}
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}> — optional, for mass breakdown</span>
            </label>
            {unit === 'metric'
              ? <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 75" />
              : <input type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="e.g. 165" />
            }
          </div>

          {/* Mode tabs */}
          <SectionTitle>Calculation method</SectionTitle>
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

          {mode === 0 && <NavyMode  sex={sex} unit={unit} wKg={wKg} />}
          {mode === 1 && <BMIMode   sex={sex} unit={unit} wKg={wKg} />}
          {mode === 2 && <SkinfoldMode sex={sex} unit={unit} />}

          {/* Reference table */}
          <SectionTitle>Body fat categories (ACE) — {sex}</SectionTitle>
          <ReferenceTable sex={sex} />
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>About the Body Fat Calculator</h2>
          <p>
            Body fat percentage is a more meaningful health metric than BMI alone — it tells you what proportion of your body weight is fat versus lean mass (muscle, bone, organs, and water). This calculator offers three clinically validated estimation methods so you can choose the one that matches the measurements you have available.
          </p>
          <p>
            The <strong>U.S. Navy method</strong> uses circumference measurements — waist, neck, and (for women) hips — alongside height to estimate body fat using a logarithmic formula developed by the U.S. military. It requires no special equipment beyond a soft tape measure and is accurate to within 3–4% for most people.
          </p>
          <p>
            The <strong>BMI method</strong> (Deurenberg formula) estimates body fat from your BMI, age, and sex. It's the least precise of the three but requires only weight and height — useful for a quick estimate when no tape measure is available. It tends to overestimate body fat in very muscular individuals.
          </p>
          <p>
            The <strong>Jackson-Pollock 3-site skinfold method</strong> uses calipers to measure subcutaneous fat at three specific body sites. When performed correctly by an experienced practitioner, it is the most accurate field method available, with an error margin of approximately 3%. The sites differ by sex: chest, abdomen, and thigh for males; tricep, suprailiac, and thigh for females.
          </p>
          <p>
            Results are classified using the <strong>American Council on Exercise (ACE)</strong> body fat categories — essential fat, athletes, fitness, average, and obese — displayed on a colour-coded gauge. If you enter your weight, the tool also calculates your fat mass and lean mass in kg or lbs.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Body Fat % Reference Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))' }}>
            {[
              { label: 'Male athlete',       value: '8–12%',  sub: 'competition-ready' },
              { label: 'Male fitness',       value: '14–17%', sub: 'healthy and lean' },
              { label: 'Male average',       value: '18–24%', sub: 'typical adult male' },
              { label: 'Female athlete',     value: '16–20%', sub: 'competition-ready' },
              { label: 'Female fitness',     value: '21–24%', sub: 'healthy and lean' },
              { label: 'Female average',     value: '25–31%', sub: 'typical adult female' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '2px' }}>{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="body-fat-calculator" />
      </div>
    </div>
  );
}
