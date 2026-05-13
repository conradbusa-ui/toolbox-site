import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculations ─────────────────────────────────────────

function calcWHR(waist, hip) {
  if (!hip || hip === 0) return null;
  return waist / hip;
}

function calcWaistHeight(waist, height) {
  if (!height || height === 0) return null;
  return waist / height;
}

// WHO risk categories for WHR
function getWHRCategory(whr, gender) {
  if (gender === 'male') {
    if (whr < 0.90) return { label: 'Low risk',         color: '#16a34a', risk: 'low',     desc: 'Low cardiovascular risk' };
    if (whr < 0.96) return { label: 'Moderate risk',    color: '#f59e0b', risk: 'moderate',desc: 'Moderate cardiovascular risk' };
    if (whr < 1.00) return { label: 'High risk',        color: '#f97316', risk: 'high',    desc: 'High cardiovascular risk' };
    return           { label: 'Very high risk',  color: '#dc2626', risk: 'very-high',desc: 'Very high cardiovascular risk' };
  } else {
    if (whr < 0.80) return { label: 'Low risk',         color: '#16a34a', risk: 'low',     desc: 'Low cardiovascular risk' };
    if (whr < 0.86) return { label: 'Moderate risk',    color: '#f59e0b', risk: 'moderate',desc: 'Moderate cardiovascular risk' };
    if (whr < 0.90) return { label: 'High risk',        color: '#f97316', risk: 'high',    desc: 'High cardiovascular risk' };
    return           { label: 'Very high risk',  color: '#dc2626', risk: 'very-high',desc: 'Very high cardiovascular risk' };
  }
}

// Waist-to-height ratio categories
function getWHtRCategory(whtr) {
  if (whtr < 0.40) return { label: 'Underweight',  color: '#0891b2', desc: 'Possibly too lean' };
  if (whtr < 0.50) return { label: 'Healthy',      color: '#16a34a', desc: 'Healthy range' };
  if (whtr < 0.60) return { label: 'Overweight',   color: '#f59e0b', desc: 'Increased risk' };
  return            { label: 'Obese',          color: '#dc2626', desc: 'High health risk' };
}

// Body shape classification
function getBodyShape(whr, gender) {
  if (gender === 'male') {
    if (whr < 0.85) return { shape: 'Pear',   icon: '🍐', desc: 'Fat stored around hips and thighs' };
    if (whr < 0.95) return { shape: 'Oval',   icon: '🥚', desc: 'Moderately apple-shaped' };
    return           { shape: 'Apple',  icon: '🍎', desc: 'Fat stored around abdomen' };
  } else {
    if (whr < 0.75) return { shape: 'Pear',       icon: '🍐', desc: 'Fat stored around hips and thighs' };
    if (whr < 0.80) return { shape: 'Hourglass',  icon: '⌛', desc: 'Balanced waist and hip ratio' };
    if (whr < 0.85) return { shape: 'Banana',     icon: '🍌', desc: 'Relatively straight figure' };
    return           { shape: 'Apple',      icon: '🍎', desc: 'Fat stored around abdomen' };
  }
}

// Ideal waist range given hip and gender
function idealWaistRange(hip, gender) {
  if (gender === 'male') return { min: hip * 0.80, max: hip * 0.89 };
  return { min: hip * 0.65, max: hip * 0.79 };
}

// Unit conversions
function cmToIn(cm) { return cm / 2.54; }
function inToCm(inches) { return inches * 2.54; }

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
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
      borderRadius: 'var(--radius)', padding: '14px 18px',
      textAlign: 'center', flex: '1 1 130px', minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: 'clamp(1rem,2.8vw,1.55rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Risk gauge ────────────────────────────────────────────────

function RiskGauge({ whr, gender, category }) {
  // Define scale range
  const { min, max } = gender === 'male'
    ? { min: 0.70, max: 1.10 }
    : { min: 0.60, max: 1.05 };

  const pct = Math.min(Math.max((whr - min) / (max - min), 0), 1) * 100;

  // Thresholds for male/female
  const thresholds = gender === 'male'
    ? [{ pct: (0.90 - min)/(max-min)*100, label:'0.90' }, { pct: (0.96 - min)/(max-min)*100, label:'0.96' }, { pct: (1.00 - min)/(max-min)*100, label:'1.00' }]
    : [{ pct: (0.80 - min)/(max-min)*100, label:'0.80' }, { pct: (0.86 - min)/(max-min)*100, label:'0.86' }, { pct: (0.90 - min)/(max-min)*100, label:'0.90' }];

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Gradient bar */}
      <div style={{ position: 'relative', height: '16px', borderRadius: '99px', background: 'linear-gradient(to right, #16a34a, #f59e0b, #f97316, #dc2626)', overflow: 'visible', marginBottom: '22px' }}>
        {/* Threshold markers */}
        {thresholds.map(t => (
          <div key={t.label} style={{ position: 'absolute', left: `${t.pct}%`, top: 0, bottom: 0, width: '2px', background: 'white', opacity: 0.6 }}>
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{t.label}</div>
          </div>
        ))}
        {/* Needle */}
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 20, height: 20, borderRadius: '50%',
          background: category.color,
          border: '3px solid white',
          boxShadow: `0 0 0 2px ${category.color}`,
          zIndex: 2,
          transition: 'left 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
        <span>{fmt(min, 2)}</span>
        <span style={{ fontWeight: 700, color: category.color }}>{fmt(whr, 3)} ← your WHR</span>
        <span>{fmt(max, 2)}</span>
      </div>
    </div>
  );
}

// ── WHO reference table ───────────────────────────────────────

function WHRTable({ gender }) {
  const male = [
    { range: '< 0.90',      risk: 'Low risk',       color: '#16a34a' },
    { range: '0.90 – 0.95', risk: 'Moderate risk',  color: '#f59e0b' },
    { range: '0.96 – 0.99', risk: 'High risk',      color: '#f97316' },
    { range: '≥ 1.00',      risk: 'Very high risk', color: '#dc2626' },
  ];
  const female = [
    { range: '< 0.80',      risk: 'Low risk',       color: '#16a34a' },
    { range: '0.80 – 0.85', risk: 'Moderate risk',  color: '#f59e0b' },
    { range: '0.86 – 0.89', risk: 'High risk',      color: '#f97316' },
    { range: '≥ 0.90',      risk: 'Very high risk', color: '#dc2626' },
  ];
  const rows = gender === 'male' ? male : female;

  return (
    <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--surface2)' }}>
        {['WHR', 'Risk Category'].map(h => (
          <div key={h} style={{ padding: '8px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.range} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
          <div style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '0.85rem' }}>{r.range}</div>
          <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: r.color }}>{r.risk}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function WHRCalculator() {
  const [waist,   setWaist]   = useState('');
  const [hip,     setHip]     = useState('');
  const [height,     setHeight]     = useState('');
  const [heightFt,   setHeightFt]   = useState('');
  const [heightIn,   setHeightIn]   = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [unit,    setUnit]    = useState('cm');
  const [gender,  setGender]  = useState('female');
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');

  function toStandard(val) {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) return null;
    return unit === 'cm' ? n : inToCm(n);
  }

  function calculate() {
    const waistCm  = toStandard(waist);
    const hipCm    = toStandard(hip);
    const heightCm = (() => {
      if (heightUnit === 'ft') {
        const ft = parseFloat(heightFt) || 0;
        const inches = parseFloat(heightIn) || 0;
        const total = ft * 30.48 + inches * 2.54;
        return total > 0 ? total : null;
      }
      return height.trim() ? toStandard(height) : null;
    })();

    if (!waistCm)  { setError('Enter a valid waist measurement.'); setResult(null); return; }
    if (!hipCm)    { setError('Enter a valid hip measurement.'); setResult(null); return; }
    if (waistCm > 250 || hipCm > 250) { setError('Measurements seem too large. Please check values.'); setResult(null); return; }
    if (waistCm < 30 || hipCm < 30)   { setError('Measurements seem too small. Please check values.'); setResult(null); return; }

    const whr      = calcWHR(waistCm, hipCm);
    const whtr     = heightCm ? calcWaistHeight(waistCm, heightCm) : null;
    const category = getWHRCategory(whr, gender);
    const shape    = getBodyShape(whr, gender);
    const ideal    = idealWaistRange(hipCm, gender);
    const whtrCat  = whtr ? getWHtRCategory(whtr) : null;

    // Waist reduction needed to reach low risk
    const lowRiskWHR = gender === 'male' ? 0.89 : 0.79;
    const waistToLow = hipCm * lowRiskWHR;
    const waistDiff  = waistCm - waistToLow;

    setResult({
      whr, whtr, category, shape, ideal,
      waistCm, hipCm, heightCm,
      waistToLow, waistDiff,
      whtrCat, gender, unit,
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Waist-to-Hip Ratio: ${fmt(result.whr, 3)}`,
      `Risk category: ${result.category.label}`,
      `Body shape: ${result.shape.shape}`,
      result.whtr ? `Waist-to-Height ratio: ${fmt(result.whtr, 3)}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  // Live WHR preview
  const liveWHR = (() => {
    const wCm = toStandard(waist), hCm = toStandard(hip);
    if (!wCm || !hCm) return null;
    return calcWHR(wCm, hCm);
  })();

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>WHR Calculator</span>
          </div>
          <h1>Waist-to-Hip Ratio (WHR) Calculator</h1>
          <p className="subtitle">
            Calculate your waist-to-hip ratio, assess cardiovascular risk, identify body shape, and find your ideal waist measurement — based on WHO guidelines.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Unit + gender */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Units</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['cm', 'in'].map(u => (
                  <button key={u} className={`tag${unit === u ? ' active' : ''}`}
                    onClick={() => { setUnit(u); setResult(null); setError(''); }}
                    style={{ fontFamily: 'var(--mono)', fontWeight: 700, minWidth: '50px', textAlign: 'center' }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Sex</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }].map(g => (
                  <button key={g.id} className={`tag${gender === g.id ? ' active' : ''}`}
                    onClick={() => { setGender(g.id); setResult(null); setError(''); }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>Waist circumference ({unit})</label>
              <input type="number" value={waist} min="0" step="0.1"
                onChange={e => { setWaist(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder={unit === 'cm' ? 'e.g. 80' : 'e.g. 31.5'}
                style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }}
                autoFocus
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
                Measure at the narrowest point of the abdomen, above the navel.
              </p>
            </div>
            <div className="form-group">
              <label>Hip circumference ({unit})</label>
              <input type="number" value={hip} min="0" step="0.1"
                onChange={e => { setHip(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder={unit === 'cm' ? 'e.g. 95' : 'e.g. 37.5'}
                style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
                Measure at the widest point of the hips and buttocks.
              </p>
            </div>
            <div className="form-group">
              <label>Height <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional — for WHtR</span></label>
              {/* Height unit toggle */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {['cm', 'ft'].map(hu => (
                  <button key={hu} className={`tag${heightUnit === hu ? ' active' : ''}`}
                    onClick={() => { setHeightUnit(hu); setHeight(''); setHeightFt(''); setHeightIn(''); setResult(null); }}
                    style={{ fontFamily: 'var(--mono)', fontWeight: 700, minWidth: '44px', textAlign: 'center' }}>
                    {hu === 'ft' ? 'ft/in' : 'cm'}
                  </button>
                ))}
              </div>
              {heightUnit === 'cm' ? (
                <input type="number" value={height} min="0" step="0.1"
                  onChange={e => { setHeight(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="e.g. 165"
                  style={{ fontFamily: 'var(--mono)' }} />
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" value={heightFt} min="3" max="8"
                    onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && calculate()}
                    placeholder="ft" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
                  <input type="number" value={heightIn} min="0" max="11"
                    onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && calculate()}
                    placeholder="in" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          {liveWHR !== null && !result && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '8px', fontWeight: 600 }}>
              WHR preview: <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{fmt(liveWHR, 3)}</span>
            </div>
          )}

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate}>Calculate WHR</button>
            <button className="btn btn-ghost" onClick={() => { setWaist(''); setHip(''); setHeight(''); setHeightFt(''); setHeightIn(''); setResult(null); setError(''); }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* Results */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Main result banner */}
              <div style={{
                background: `${result.category.color}15`,
                border: `2px solid ${result.category.color}`,
                borderRadius: 'var(--radius)', padding: '18px 22px',
                textAlign: 'center', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: result.category.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Waist-to-Hip Ratio
                </div>
                <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: result.category.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(result.whr, 3)}
                </div>
                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: `${result.category.color}20`, border: `1px solid ${result.category.color}` }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: result.category.color }}>{result.category.label}</span>
                </div>
              </div>

              {/* Risk gauge */}
              <RiskGauge whr={result.whr} gender={result.gender} category={result.category} />

              {/* Stats */}
              <SectionTitle>Measurements</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="WHR"            value={fmt(result.whr, 3)}                  sub={result.category.label} color={result.category.color} />
                <StatCard label="Waist"          value={`${fmt(result.waistCm, 1)} cm`}      sub={`${fmt(cmToIn(result.waistCm), 1)} in`} />
                <StatCard label="Hip"            value={`${fmt(result.hipCm, 1)} cm`}        sub={`${fmt(cmToIn(result.hipCm), 1)} in`} />
                {result.whtr && <StatCard label="WHtR" value={fmt(result.whtr, 3)} sub={result.whtrCat?.label} color={result.whtrCat?.color} />}
              </div>

              {/* Body shape */}
              <SectionTitle>Body shape</SectionTitle>
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{result.shape.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '3px' }}>{result.shape.shape} shape</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{result.shape.desc}</div>
                </div>
              </div>

              {/* Ideal waist range */}
              <SectionTitle>Ideal waist range (low-risk)</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Ideal waist (cm)" value={`${fmt(result.ideal.min, 1)}–${fmt(result.ideal.max, 1)}`} sub="for low-risk WHR" />
                <StatCard label="Ideal waist (in)"  value={`${fmt(cmToIn(result.ideal.min), 1)}–${fmt(cmToIn(result.ideal.max), 1)}`} sub="for low-risk WHR" />
                {result.waistDiff > 0.5 && (
                  <StatCard label="Waist to reduce" value={`${fmt(result.waistDiff, 1)} cm`} sub={`to reach low-risk WHR`} color="#f97316" />
                )}
                {result.waistDiff <= 0.5 && (
                  <StatCard accent label="Status" value="✓ Low risk" sub="waist in ideal range" />
                )}
              </div>

              {/* WHtR category detail */}
              {result.whtrCat && (
                <div style={{ marginTop: '14px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: `${result.whtrCat.color}12`, border: `1px solid ${result.whtrCat.color}40`, fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <strong style={{ color: result.whtrCat.color }}>Waist-to-Height Ratio ({fmt(result.whtr, 3)}):</strong>{' '}
                  <span style={{ color: 'var(--text-2)' }}>{result.whtrCat.label} — {result.whtrCat.desc}. The general guideline is to keep your waist circumference to less than half your height (WHtR &lt; 0.5).</span>
                </div>
              )}

              <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ WHR is a screening tool, not a clinical diagnosis. Risk thresholds are based on WHO guidelines. Consult a healthcare professional for personalised health advice.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>What Is Waist-to-Hip Ratio (WHR)?</h2>
          <p>
            Waist-to-hip ratio (WHR) is the ratio of your waist circumference to your hip circumference. It is one of the most widely used measures of body fat distribution and is a stronger predictor of cardiovascular disease risk than BMI alone, because it specifically measures where fat is stored — not just how much total fat you have.
          </p>
          <p>
            The formula is simple: <strong>WHR = waist circumference ÷ hip circumference</strong>. Measure your waist at the narrowest point above the navel, and your hips at the widest point across the buttocks. Both measurements should be taken in a relaxed standing position.
          </p>
          <p>
            According to the <strong>World Health Organization (WHO)</strong>, the risk thresholds differ by sex. For <strong>women</strong>, a WHR below 0.80 is low risk, 0.80–0.85 is moderate, 0.86–0.89 is high, and 0.90 or above is very high. For <strong>men</strong>, the thresholds are 0.90 (low), 0.91–0.95 (moderate), 0.96–0.99 (high), and 1.00+ (very high).
          </p>
          <p>
            People with more fat around the abdomen ("apple-shaped") face higher risks of heart disease, type 2 diabetes, and hypertension than those who carry fat around the hips and thighs ("pear-shaped"). This calculator also computes your <strong>waist-to-height ratio (WHtR)</strong> — another useful metric where a ratio below 0.5 is generally considered healthy.
          </p>
          <p>
            The tool shows your ideal waist circumference range for low-risk WHR and how much reduction (if any) would bring you into the healthy zone — practical targets rather than just a number.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">WHR Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: 'Female: 75cm waist / 95cm hip',  value: '0.789', sub: 'Low risk ✓' },
              { label: 'Female: 85cm waist / 98cm hip',  value: '0.867', sub: 'High risk' },
              { label: 'Male: 88cm waist / 100cm hip',   value: '0.880', sub: 'Low risk ✓' },
              { label: 'Male: 102cm waist / 100cm hip',  value: '1.020', sub: 'Very high risk' },
              { label: '80cm waist / 160cm height',       value: 'WHtR 0.50', sub: 'Borderline healthy' },
              { label: 'Apple vs pear shape',            value: 'WHR > 0.85', sub: 'apple (♀) = higher risk' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHO Reference */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">WHO Risk Classification</h2>
          <div className="form-row" style={{ gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-2)' }}>Female thresholds</p>
              <WHRTable gender="female" />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-2)' }}>Male thresholds</p>
              <WHRTable gender="male" />
            </div>
          </div>
        </div>

        <RelatedTools currentId="whr-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
