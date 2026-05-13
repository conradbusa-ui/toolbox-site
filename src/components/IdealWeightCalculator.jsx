import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Ideal Weight Formulas ─────────────────────────────────────
// All return weight in kg, input height in cm

// Robinson (1983)
function robinson(heightCm, sex) {
  const inchesOver5ft = (heightCm / 2.54) - 60;
  if (sex === 'male') return 52 + 1.9 * inchesOver5ft;
  return 49 + 1.7 * inchesOver5ft;
}

// Miller (1983)
function miller(heightCm, sex) {
  const inchesOver5ft = (heightCm / 2.54) - 60;
  if (sex === 'male') return 56.2 + 1.41 * inchesOver5ft;
  return 53.1 + 1.36 * inchesOver5ft;
}

// Devine (1974) — most used clinically
function devine(heightCm, sex) {
  const inchesOver5ft = (heightCm / 2.54) - 60;
  if (sex === 'male') return 50 + 2.3 * inchesOver5ft;
  return 45.5 + 2.3 * inchesOver5ft;
}

// Hamwi (1964)
function hamwi(heightCm, sex) {
  const inchesOver5ft = (heightCm / 2.54) - 60;
  if (sex === 'male') return 48 + 2.7 * inchesOver5ft;
  return 45.4 + 2.27 * inchesOver5ft;
}

// BMI range method (18.5–24.9 is healthy range)
function bmiRange(heightCm) {
  const hM = heightCm / 100;
  return {
    low:  18.5 * hM * hM,
    high: 24.9 * hM * hM,
    mid:  21.7 * hM * hM,
  };
}

// Peterson (2016) — modified for body frame / newer
function peterson(heightCm, sex) {
  const hM = heightCm / 100;
  if (sex === 'male') return 2.2 * 22 + 3.5 * 22 * (hM - 1.5);
  return 2.2 * 22 + 3.5 * 22 * (hM - 1.5) - 0.5 * 22;
}

// Helpers
function lbsToKg(lbs)         { return lbs * 0.453592; }
function kgToLbs(kg)           { return kg / 0.453592; }
function ftInToCm(ft, inches)  { return ft * 30.48 + inches * 2.54; }
function bmi(wKg, hCm)         { return wKg / Math.pow(hCm / 100, 2); }
function fmt(n, dp = 1)        { return isFinite(n) ? parseFloat(n.toFixed(dp)) : null; }

function getBMICategory(bmiVal) {
  if (bmiVal < 18.5) return { label: 'Underweight', color: '#0891b2' };
  if (bmiVal < 25)   return { label: 'Normal weight', color: '#16a34a' };
  if (bmiVal < 30)   return { label: 'Overweight', color: '#f59e0b' };
  return               { label: 'Obese', color: '#dc2626' };
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
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Weight range gauge ────────────────────────────────────────

function WeightGauge({ currentKg, rangeKg, unit }) {
  if (!currentKg || currentKg <= 0) return null;
  const toDisp = (kg) => unit === 'imperial'
    ? `${fmt(kgToLbs(kg), 0)} lbs`
    : `${fmt(kg, 0)} kg`;

  const lo = rangeKg.low;
  const hi = rangeKg.high;
  const span = hi - lo;

  // Extend gauge 20% on each side
  const gaugeMin = lo - span * 0.5;
  const gaugeMax = hi + span * 0.5;
  const gaugeSpan = gaugeMax - gaugeMin;

  const toGaugePct = (v) => Math.max(0, Math.min(100, ((v - gaugeMin) / gaugeSpan) * 100));

  const loPct  = toGaugePct(lo);
  const hiPct  = toGaugePct(hi);
  const curPct = toGaugePct(currentKg);

  const isInRange = currentKg >= lo && currentKg <= hi;
  const curColor  = isInRange ? '#16a34a' : currentKg < lo ? '#0891b2' : '#dc2626';

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ position: 'relative', height: '14px', borderRadius: '99px', background: 'var(--surface2)', marginBottom: '8px' }}>
        {/* Healthy zone highlight */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${loPct}%`,
          width: `${hiPct - loPct}%`,
          background: 'rgba(22,163,74,0.25)',
          borderRadius: '4px',
        }} />
        {/* Healthy zone borders */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${loPct}%`, width: '2px', background: '#16a34a', borderRadius: '1px' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${hiPct}%`, width: '2px', background: '#16a34a', borderRadius: '1px' }} />
        {/* Current weight marker */}
        <div style={{
          position: 'absolute', top: '-3px', bottom: '-3px',
          left: `${curPct}%`,
          width: '4px',
          background: curColor,
          borderRadius: '2px',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 4px rgba(0,0,0,0.2)',
        }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)' }}>
        <span>Underweight</span>
        <span style={{ color: '#16a34a', fontWeight: 700 }}>Healthy range: {toDisp(lo)} – {toDisp(hi)}</span>
        <span>Overweight</span>
      </div>

      {/* Current weight annotation */}
      <div style={{
        marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '7px 14px', borderRadius: 'var(--radius-sm)',
        background: isInRange ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${isInRange ? '#86efac' : '#fca5a5'}`,
        fontSize: '0.82rem', fontWeight: 600,
        color: curColor,
      }}>
        {isInRange ? '✓' : '→'}
        {' '}Your weight ({toDisp(currentKg)}) is {isInRange ? 'within' : currentKg < lo ? 'below' : 'above'} the healthy range.
        {!isInRange && (
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {currentKg < lo
              ? `Gain ${toDisp(lo - currentKg)} to reach lower bound`
              : `Lose ${toDisp(currentKg - hi)} to reach upper bound`}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Formula comparison table ──────────────────────────────────

function FormulaTable({ results, unit, currentKg }) {
  const toDisp = (kg) => unit === 'imperial'
    ? `${fmt(kgToLbs(kg), 1)} lbs`
    : `${fmt(kg, 1)} kg`;

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Formula', 'Ideal Weight', currentKg ? 'Difference' : null, 'Notes'].filter(Boolean).map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const diff = currentKg ? currentKg - r.weight : null;
            return (
              <tr key={r.name} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>
                  {r.range ? `${toDisp(r.weight.low)} – ${toDisp(r.weight.high)}` : toDisp(r.weight)}
                </td>
                {currentKg && (
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600, color: !r.range ? (Math.abs(diff) < 0.5 ? '#16a34a' : diff > 0 ? '#dc2626' : '#0891b2') : 'var(--text-3)', fontSize: '0.8rem' }}>
                    {r.range
                      ? (currentKg >= r.weight.low && currentKg <= r.weight.high ? '✓ In range' : currentKg < r.weight.low ? `↑ +${toDisp(r.weight.low - currentKg)}` : `↓ −${toDisp(currentKg - r.weight.high)}`)
                      : (Math.abs(diff) < 0.5 ? '✓ At ideal' : diff > 0 ? `↓ −${toDisp(Math.abs(diff))}` : `↑ +${toDisp(Math.abs(diff))}`)}
                  </td>
                )}
                <td style={{ padding: '8px 12px', color: 'var(--text-3)', fontSize: '0.76rem' }}>{r.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function IdealWeightCalculator() {
  const [unit, setUnit]           = useState('metric');
  const [sex, setSex]             = useState('male');
  const [heightCm, setHeightCm]   = useState('');
  const [heightFt, setHeightFt]   = useState('');
  const [heightIn, setHeightIn]   = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  const isMetric = unit === 'metric';

  function calculate() {
    let hCm;
    if (isMetric) {
      hCm = parseFloat(heightCm);
    } else {
      hCm = ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
    }

    if (!isFinite(hCm) || hCm <= 0) { setError('Enter a valid height.'); setResult(null); return; }
    if (hCm < 100 || hCm > 250)      { setError('Height must be between 100–250 cm (about 3\'3\" – 8\'2\").'); setResult(null); return; }

    const cw = parseFloat(currentWeight);
    const currentKg = currentWeight
      ? isMetric ? cw : lbsToKg(cw)
      : null;

    if (currentWeight && (!isFinite(currentKg) || currentKg <= 0)) {
      setError('Enter a valid current weight, or leave it blank.'); setResult(null); return;
    }

    const inchesOver5ft = (hCm / 2.54) - 60;

    // All formula weights
    const divineW    = devine(hCm, sex);
    const robinsonW  = robinson(hCm, sex);
    const millerW    = miller(hCm, sex);
    const hamwiW     = hamwi(hCm, sex);
    const bmiRangeW  = bmiRange(hCm);

    // Average of the four single-value formulas
    const average = (divineW + robinsonW + millerW + hamwiW) / 4;

    // BMI if current weight supplied
    const bmiVal  = currentKg ? bmi(currentKg, hCm) : null;
    const bmiCat  = bmiVal ? getBMICategory(bmiVal) : null;

    // Weight to lose/gain to reach midpoint of healthy BMI range
    const targetMidKg = bmiRangeW.mid;
    const toGoKg = currentKg ? currentKg - targetMidKg : null;

    setResult({
      hCm, sex, currentKg, bmiVal, bmiCat,
      divineW, robinsonW, millerW, hamwiW,
      bmiRangeW, average, targetMidKg,
      toGoKg, inchesOver5ft,
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const toDisp = (kg) => isMetric ? `${fmt(kg, 1)} kg` : `${fmt(kgToLbs(kg), 1)} lbs`;
    const lines = [
      `Ideal weight (Devine): ${toDisp(result.divineW)}`,
      `Ideal weight (Robinson): ${toDisp(result.robinsonW)}`,
      `Ideal weight (Miller): ${toDisp(result.millerW)}`,
      `Ideal weight (Hamwi): ${toDisp(result.hamwiW)}`,
      `Average ideal weight: ${toDisp(result.average)}`,
      `Healthy BMI range: ${toDisp(result.bmiRangeW.low)} – ${toDisp(result.bmiRangeW.high)}`,
      result.bmiVal ? `Your BMI: ${fmt(result.bmiVal)} (${result.bmiCat.label})` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const toDisp = (kg) => isMetric
    ? `${fmt(kg, 1)} kg`
    : `${fmt(kgToLbs(kg), 1)} lbs`;

  const formulaResults = result ? [
    { name: 'Devine (1974)',   weight: result.divineW,   note: 'Most widely used in clinical settings' },
    { name: 'Robinson (1983)', weight: result.robinsonW, note: 'Revised Devine for general population' },
    { name: 'Miller (1983)',   weight: result.millerW,   note: 'Lower estimates, suited for smaller frames' },
    { name: 'Hamwi (1964)',    weight: result.hamwiW,    note: 'Oldest formula, still widely referenced' },
    { name: 'Healthy BMI range (18.5–24.9)', weight: result.bmiRangeW, range: true, note: 'WHO healthy weight range for your height' },
  ] : [];

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Ideal Weight Calculator</span>
          </div>
          <h1>Ideal Weight Calculator</h1>
          <p className="subtitle">
            Calculate your ideal body weight using four clinically referenced formulas — Devine, Robinson, Miller, and Hamwi — plus the healthy BMI weight range for your height.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Unit + sex toggles */}
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

          {/* Height */}
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
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="5" />
              </div>
              <div className="form-group">
                <label>Height (inches)</label>
                <input type="number" value={heightIn}
                  onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                  placeholder="9" />
              </div>
            </div>
          )}

          {/* Current weight (optional) */}
          <div className="form-group">
            <label>
              Current weight {isMetric ? '(kg)' : '(lbs)'}
              <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-3)' }}> — optional, to compare against ideal</span>
            </label>
            <input
              type="number"
              value={currentWeight}
              onChange={e => { setCurrentWeight(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={isMetric ? 'e.g. 75' : 'e.g. 165'}
              style={{ maxWidth: '200px' }}
            />
          </div>

          <div className="btn-group" style={{ marginTop: '4px' }}>
            <button className="btn btn-primary" onClick={calculate}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => { setHeightCm(''); setHeightFt(''); setHeightIn(''); setCurrentWeight(''); setResult(null); setError(''); }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Primary result */}
              <SectionTitle>Ideal weight for your height</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard
                  accent
                  label="Average ideal weight"
                  value={toDisp(result.average)}
                  sub="mean of 4 formulas"
                />
                <StatCard
                  accent
                  label="Healthy BMI range"
                  value={`${toDisp(result.bmiRangeW.low)} – ${toDisp(result.bmiRangeW.high)}`}
                  sub="BMI 18.5 – 24.9"
                />
                <StatCard
                  label="Devine formula"
                  value={toDisp(result.divineW)}
                  sub="clinical standard"
                />
              </div>

              {/* If current weight provided */}
              {result.currentKg && result.bmiVal && (
                <>
                  <SectionTitle>Your current weight vs ideal</SectionTitle>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <StatCard
                      label="Your BMI"
                      value={fmt(result.bmiVal)}
                      sub={result.bmiCat.label}
                      color={result.bmiCat.color}
                    />
                    <StatCard
                      label="Current weight"
                      value={toDisp(result.currentKg)}
                      sub={isMetric ? `${fmt(kgToLbs(result.currentKg), 0)} lbs` : `${fmt(result.currentKg * 1, 1)} kg`}
                    />
                    {result.toGoKg !== null && Math.abs(result.toGoKg) > 0.5 && (
                      <StatCard
                        label={result.toGoKg > 0 ? 'To lose (to BMI midpoint)' : 'To gain (to BMI midpoint)'}
                        value={toDisp(Math.abs(result.toGoKg))}
                        color={result.toGoKg > 0 ? '#dc2626' : '#0891b2'}
                        sub={`target: ${toDisp(result.targetMidKg)}`}
                      />
                    )}
                    {Math.abs(result.toGoKg || 0) <= 0.5 && (
                      <StatCard
                        label="Status"
                        value="At ideal weight"
                        color="#16a34a"
                        sub="within 0.5 kg of BMI midpoint"
                      />
                    )}
                  </div>
                  <WeightGauge
                    currentKg={result.currentKg}
                    rangeKg={result.bmiRangeW}
                    unit={unit}
                  />
                </>
              )}

              {/* Formula comparison */}
              <SectionTitle>All formulas compared</SectionTitle>
              <FormulaTable
                results={formulaResults}
                unit={unit}
                currentKg={result.currentKg}
              />

              {/* Height summary */}
              <SectionTitle>Your height</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Height (cm)" value={`${fmt(result.hCm, 0)} cm`} sub={`${Math.floor(result.hCm / 30.48)}′ ${fmt((result.hCm % 30.48) / 2.54, 0)}″`} />
                <StatCard label="Inches over 5 ft" value={fmt(result.inchesOver5ft, 1)} sub="used in formulas" />
              </div>

              <div style={{ marginTop: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ Ideal weight formulas are population-based estimates that don't account for muscle mass, bone density, age, or body composition. They're most useful as a general reference, not a precise target. Consult a healthcare provider for personalised advice.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How Is Ideal Weight Calculated?</h2>
          <p>
            There is no single universally agreed "ideal weight" — different formulas produce different results based on different populations and methodologies. This calculator runs four of the most clinically referenced formulas simultaneously so you can see the full picture rather than a single number.
          </p>
          <p>
            The <strong>Devine formula</strong> (1974) is the most widely used in clinical and pharmaceutical settings and is the basis for many drug dosing calculations. It gives 50 kg for males and 45.5 kg for females at exactly 5 feet, adding 2.3 kg per additional inch. The <strong>Robinson formula</strong> (1983) is a revision of Devine designed for the general population. The <strong>Miller formula</strong> (1983) tends to give lower estimates and may be better suited for smaller-framed individuals. The <strong>Hamwi formula</strong> (1964) is the oldest of the four and is still widely referenced in dietetics.
          </p>
          <p>
            Alongside the four formulas, the calculator also shows the <strong>healthy BMI weight range</strong> (BMI 18.5–24.9) for your height. This is the most flexible approach — rather than a single target number, it gives you a range to aim for, with BMI 21.7 as the midpoint. The World Health Organisation considers this range associated with the lowest health risks for most adults.
          </p>
          <p>
            If you enter your current weight, the tool calculates your <strong>BMI</strong>, shows where your weight falls relative to the healthy range on a visual gauge, and tells you exactly how much weight you'd need to lose or gain to reach the BMI midpoint target.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Ideal Weight Examples by Height</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Height', 'Sex', 'Devine', 'Robinson', 'BMI Range (18.5–24.9)'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { h: '165 cm (5\'5\")', sex: 'Female', d: '56.9 kg',  r: '57.4 kg',  bmiR: '50.4–67.8 kg' },
                  { h: '170 cm (5\'7\")', sex: 'Male',   d: '65.9 kg',  r: '65.2 kg',  bmiR: '53.5–72.0 kg' },
                  { h: '175 cm (5\'9\")', sex: 'Male',   d: '70.5 kg',  r: '68.9 kg',  bmiR: '56.7–76.3 kg' },
                  { h: '175 cm (5\'9\")', sex: 'Female', d: '66.0 kg',  r: '64.1 kg',  bmiR: '56.7–76.3 kg' },
                  { h: '180 cm (5\'11\")',sex: 'Male',   d: '75.0 kg',  r: '72.6 kg',  bmiR: '59.9–80.7 kg' },
                ].map(ex => (
                  <ExRow key={ex.h + ex.sex} {...ex} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <RelatedTools currentId="ideal-weight-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

function ExRow({ h, sex, d, r, bmiR }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderBottom: '1px solid var(--border)', background: hovered ? 'var(--surface2)' : 'transparent', transition: 'background 0.12s' }}
    >
      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>{h}</td>
      <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: 'var(--text-2)', fontSize: '0.82rem' }}>{sex}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{d}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{r}</td>
      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#16a34a', fontWeight: 600 }}>{bmiR}</td>
    </tr>
  );
}
