import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Constants & helpers ───────────────────────────────────────

// Average step lengths by height range (in inches → cm)
// Based on research: avg step length ≈ 41–45% of height
const STEP_LENGTH_FACTOR = 0.415; // step length as fraction of height

// Standard conversions
const INCHES_PER_MILE = 63360;
const CM_PER_KM       = 100000;
const INCHES_TO_CM    = 2.54;
const CM_TO_INCHES    = 1 / 2.54;
const MILES_TO_KM     = 1.60934;
const KM_TO_MILES     = 0.621371;

// Stride length ≈ 2 × step length
function calcStepLength(heightCm, gender) {
  // Research-based average: male step ~2.5 ft (76cm), female ~2.2 ft (67cm) at average heights
  // More precise: step ≈ 0.415 × height
  const base = heightCm * STEP_LENGTH_FACTOR;
  // Small gender adjustment (males average ~5% longer stride)
  return gender === 'male' ? base * 1.025 : base * 0.975;
}

function calcStridLength(stepLengthCm) {
  return stepLengthCm * 2;
}

// Distance → steps
function milesToSteps(miles, stepLengthCm) {
  const distanceCm = miles * INCHES_PER_MILE * INCHES_TO_CM;
  return Math.round(distanceCm / stepLengthCm);
}

function kmToSteps(km, stepLengthCm) {
  const distanceCm = km * CM_PER_KM;
  return Math.round(distanceCm / stepLengthCm);
}

// Steps → distance
function stepsToMiles(steps, stepLengthCm) {
  const distanceCm = steps * stepLengthCm;
  return distanceCm / (INCHES_PER_MILE * INCHES_TO_CM);
}

function stepsToKm(steps, stepLengthCm) {
  const distanceCm = steps * stepLengthCm;
  return distanceCm / CM_PER_KM;
}

// Calories burned estimate (MET-based)
// Walking MET ≈ 3.5, running MET ≈ 7
function calcCalories(steps, weightKg, stepLengthCm, activity = 'walking') {
  const distKm  = stepsToKm(steps, stepLengthCm);
  const MET     = activity === 'running' ? 7.0 : 3.5;
  const timeHrs = distKm / (activity === 'running' ? 9.0 : 5.0);
  return MET * weightKg * timeHrs;
}

// Activity time estimate
function calcTime(steps, stepLengthCm, activity = 'walking') {
  const distKm    = stepsToKm(steps, stepLengthCm);
  const speedKmh  = activity === 'running' ? 9.0 : activity === 'brisk' ? 6.0 : 5.0;
  return (distKm / speedKmh) * 60; // minutes
}

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

function fmtNum(n) {
  return isFinite(n) && !isNaN(n) ? Math.round(n).toLocaleString() : '—';
}

// Height presets (feet/inches → cm)
function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }

const HEIGHT_PRESETS = [
  { label: "5'0\"",  cm: ftInToCm(5, 0)  },
  { label: "5'4\"",  cm: ftInToCm(5, 4)  },
  { label: "5'6\"",  cm: ftInToCm(5, 6)  },
  { label: "5'8\"",  cm: ftInToCm(5, 8)  },
  { label: "5'10\"", cm: ftInToCm(5, 10) },
  { label: "6'0\"",  cm: ftInToCm(6, 0)  },
  { label: "6'2\"",  cm: ftInToCm(6, 2)  },
];

// Common step goals
const STEP_GOALS = [5000, 7500, 8000, 10000, 12000, 15000];

// Common distances
const DISTANCE_PRESETS = [
  { label: '1 mile',        miles: 1,      km: 1.609  },
  { label: '5K',            miles: 3.107,  km: 5      },
  { label: '10K',           miles: 6.214,  km: 10     },
  { label: 'Half marathon', miles: 13.109, km: 21.097 },
  { label: 'Marathon',      miles: 26.219, km: 42.195 },
];

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

// ── Mode 1: Distance → Steps ──────────────────────────────────

function DistToStepsMode() {
  const [distVal,   setDistVal]   = useState('');
  const [distUnit,  setDistUnit]  = useState('miles');
  const [heightCm,  setHeightCm]  = useState('');
  const [heightUnit,setHeightUnit]= useState('cm');
  const [heightFt,  setHeightFt]  = useState('');
  const [heightIn,  setHeightIn]  = useState('');
  const [gender,    setGender]    = useState('neutral');
  const [weight,    setWeight]    = useState('');
  const [weightUnit,setWeightUnit]= useState('kg');
  const [activity,  setActivity]  = useState('walking');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState('');

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(heightCm);
    return ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
  }

  function getWeightKg() {
    const w = parseFloat(weight);
    if (isNaN(w)) return null;
    return weightUnit === 'kg' ? w : w * 0.453592;
  }

  function calculate() {
    const dist = parseFloat(distVal);
    if (isNaN(dist) || dist <= 0) { setError('Enter a valid distance.'); setResult(null); return; }

    const hCm = getHeightCm();
    if (isNaN(hCm) || hCm <= 0) { setError('Enter a valid height.'); setResult(null); return; }
    if (hCm < 100 || hCm > 250) { setError('Height must be between 100–250 cm.'); setResult(null); return; }

    const distMiles = distUnit === 'miles' ? dist : dist * KM_TO_MILES;
    const distKm    = distUnit === 'km'    ? dist : dist * MILES_TO_KM;

    const stepLenCm  = calcStepLength(hCm, gender);
    const strideLenCm = calcStridLength(stepLenCm);
    const steps      = milesToSteps(distMiles, stepLenCm);
    const strides    = Math.round(steps / 2);

    const wKg     = getWeightKg();
    const calories = wKg ? calcCalories(steps, wKg, stepLenCm, activity) : null;
    const timeMins = calcTime(steps, stepLenCm, activity);

    setResult({ steps, strides, distMiles, distKm, stepLenCm, strideLenCm, calories, timeMins, hCm, gender, activity });
    setError('');
  }

  function loadPreset(p) {
    if (distUnit === 'miles') setDistVal(fmt(p.miles, 3));
    else setDistVal(fmt(p.km, 3));
    setResult(null); setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Distance: ${fmt(result.distMiles, 2)} miles (${fmt(result.distKm, 2)} km)`,
      `Steps: ${fmtNum(result.steps)}`,
      `Strides: ${fmtNum(result.strides)}`,
      `Step length: ${fmt(result.stepLenCm, 1)} cm`,
      result.calories ? `Calories: ~${Math.round(result.calories)} kcal` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter a distance in miles or kilometres to see how many steps it takes based on your height, with optional calorie and time estimates.
      </p>

      {/* Distance */}
      <div className="form-row">
        <div className="form-group">
          <label>Distance</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={distVal} min="0" step="0.1"
              onChange={e => { setDistVal(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={distUnit === 'miles' ? 'e.g. 3.1' : 'e.g. 5'}
              style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
            <select value={distUnit} onChange={e => { setDistUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '78px', padding: '4px 6px' }}>
              <option value="miles">miles</option>
              <option value="km">km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Distance presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Common distances</p>
        <div className="tag-row">
          {DISTANCE_PRESETS.map(p => (
            <button key={p.label} className="tag" onClick={() => loadPreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="form-row">
        <div className="form-group">
          <label>Height</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={heightUnit} onChange={e => { setHeightUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '90px', padding: '4px 6px' }}>
              <option value="cm">cm</option>
              <option value="ft">ft / in</option>
            </select>
          </div>
          {heightUnit === 'cm' ? (
            <input type="number" value={heightCm} min="100" max="250"
              onChange={e => { setHeightCm(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 175" style={{ fontFamily: 'var(--mono)', marginTop: '6px' }} />
          ) : (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <input type="number" value={heightFt} min="3" max="8"
                onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }}
                placeholder="ft" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
              <input type="number" value={heightIn} min="0" max="11"
                onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                placeholder="in" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
            </div>
          )}
          {/* Height presets */}
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {HEIGHT_PRESETS.map(p => (
              <button key={p.label} className={`tag`}
                onClick={() => { setHeightCm(fmt(p.cm, 0)); setHeightUnit('cm'); setResult(null); }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="form-group">
          <label>Biological sex <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>(affects stride)</span></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['neutral', 'male', 'female'].map(g => (
              <button key={g} className={`tag${gender === g ? ' active' : ''}`}
                onClick={() => { setGender(g); setResult(null); }}
                style={{ textTransform: 'capitalize', flex: 1 }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional: weight + activity for calorie estimate */}
      <div className="form-row">
        <div className="form-group">
          <label>Weight <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional, for calorie estimate</span></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={weight} min="0"
              onChange={e => { setWeight(e.target.value); setResult(null); }}
              placeholder="e.g. 70"
              style={{ flex: 1, fontFamily: 'var(--mono)' }} />
            <select value={weightUnit} onChange={e => { setWeightUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '68px', padding: '4px 6px' }}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Activity type</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'walking', label: '🚶 Walking' },
              { id: 'brisk',   label: '🚶 Brisk walk' },
              { id: 'running', label: '🏃 Running' },
            ].map(a => (
              <button key={a.id} className={`tag${activity === a.id ? ' active' : ''}`}
                onClick={() => { setActivity(a.id); setResult(null); }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate steps</button>
        <button className="btn btn-ghost" onClick={() => { setDistVal(''); setHeightCm(''); setHeightFt(''); setHeightIn(''); setWeight(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Big result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Steps for {fmt(result.distMiles, 2)} miles
            </div>
            <div style={{ fontSize: 'clamp(2.2rem,7vw,3.8rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtNum(result.steps)}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtNum(result.strides)} strides &nbsp;·&nbsp; {fmt(result.distKm, 2)} km
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Steps"         value={fmtNum(result.steps)}           sub="total steps" />
            <StatCard label="Strides"       value={fmtNum(result.strides)}         sub="2 steps each" />
            <StatCard label="Step length"   value={`${fmt(result.stepLenCm, 1)} cm`} sub={`${fmt(result.stepLenCm * CM_TO_INCHES, 1)} in`} />
            <StatCard label="Stride length" value={`${fmt(result.strideLenCm, 1)} cm`} sub={`${fmt(result.strideLenCm * CM_TO_INCHES, 1)} in`} />
            {result.calories && (
              <StatCard accent label="Calories burned" value={`~${Math.round(result.calories)}`} sub="kcal estimate" color="#f97316" />
            )}
            <StatCard label="Est. time" value={`${fmt(result.timeMins, 0)} min`} sub={result.activity} />
          </div>

          {/* Step goal context */}
          <SectionTitle>How this compares to daily step goals</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {STEP_GOALS.map(goal => {
              const pct = Math.min((result.steps / goal) * 100, 100);
              const covers = result.steps >= goal;
              return (
                <div key={goal} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: covers ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1px solid ${covers ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                }}>
                  <div style={{ flex: '0 0 80px', fontSize: '0.82rem', fontWeight: 600, color: covers ? 'var(--accent-hover)' : 'var(--text)', fontFamily: 'var(--mono)' }}>
                    {goal.toLocaleString()} {covers && '✓'}
                  </div>
                  <div style={{ flex: 1, height: '7px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: covers ? 'var(--accent)' : '#94a3b8', borderRadius: '99px', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ flex: '0 0 55px', textAlign: 'right', fontSize: '0.78rem', fontFamily: 'var(--mono)', color: covers ? 'var(--accent-hover)' : 'var(--text-3)' }}>
                    {fmt(pct, 0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Steps → Distance ──────────────────────────────────

function StepsToDistMode() {
  const [steps,      setSteps]      = useState('');
  const [heightCm,   setHeightCm]   = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightFt,   setHeightFt]   = useState('');
  const [heightIn,   setHeightIn]   = useState('');
  const [gender,     setGender]     = useState('neutral');
  const [weight,     setWeight]     = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [activity,   setActivity]   = useState('walking');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(heightCm);
    return ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
  }

  function getWeightKg() {
    const w = parseFloat(weight);
    if (isNaN(w)) return null;
    return weightUnit === 'kg' ? w : w * 0.453592;
  }

  function calculate() {
    const s = parseInt(steps.replace(/,/g, ''));
    if (isNaN(s) || s <= 0) { setError('Enter a valid number of steps.'); setResult(null); return; }

    const hCm = getHeightCm();
    if (isNaN(hCm) || hCm <= 0) { setError('Enter a valid height.'); setResult(null); return; }
    if (hCm < 100 || hCm > 250) { setError('Height must be between 100–250 cm.'); setResult(null); return; }

    const stepLenCm   = calcStepLength(hCm, gender);
    const distMiles   = stepsToMiles(s, stepLenCm);
    const distKm      = stepsToKm(s, stepLenCm);
    const strides     = Math.round(s / 2);
    const wKg         = getWeightKg();
    const calories    = wKg ? calcCalories(s, wKg, stepLenCm, activity) : null;
    const timeMins    = calcTime(s, stepLenCm, activity);

    setResult({ steps: s, strides, distMiles, distKm, stepLenCm, calories, timeMins, activity });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter a step count to find out the equivalent distance in miles and kilometres, plus time and calorie estimates.
      </p>

      {/* Step count */}
      <div className="form-group">
        <label>Number of steps</label>
        <input type="text" value={steps}
          onChange={e => { setSteps(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
          placeholder="e.g. 10000"
          style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem' }} />
      </div>

      {/* Step goal presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Common goals</p>
        <div className="tag-row">
          {STEP_GOALS.map(g => (
            <button key={g} className={`tag${steps === String(g) ? ' active' : ''}`}
              onClick={() => { setSteps(String(g)); setResult(null); setError(''); }}>
              {g.toLocaleString()} steps
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="form-row">
        <div className="form-group">
          <label>Height</label>
          <select value={heightUnit} onChange={e => { setHeightUnit(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '90px', padding: '4px 6px', marginBottom: '6px' }}>
            <option value="cm">cm</option>
            <option value="ft">ft / in</option>
          </select>
          {heightUnit === 'cm' ? (
            <input type="number" value={heightCm} min="100" max="250"
              onChange={e => { setHeightCm(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 175" style={{ fontFamily: 'var(--mono)' }} />
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="number" value={heightFt} min="3" max="8"
                onChange={e => { setHeightFt(e.target.value); setResult(null); setError(''); }}
                placeholder="ft" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
              <input type="number" value={heightIn} min="0" max="11"
                onChange={e => { setHeightIn(e.target.value); setResult(null); setError(''); }}
                placeholder="in" style={{ fontFamily: 'var(--mono)', flex: 1 }} />
            </div>
          )}
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {HEIGHT_PRESETS.map(p => (
              <button key={p.label} className="tag"
                onClick={() => { setHeightCm(fmt(p.cm, 0)); setHeightUnit('cm'); setResult(null); }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Sex</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['neutral', 'male', 'female'].map(g => (
              <button key={g} className={`tag${gender === g ? ' active' : ''}`}
                onClick={() => { setGender(g); setResult(null); }}
                style={{ textTransform: 'capitalize', flex: 1 }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Weight <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional</span></label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={weight} min="0"
              onChange={e => { setWeight(e.target.value); setResult(null); }}
              placeholder="e.g. 70" style={{ flex: 1, fontFamily: 'var(--mono)' }} />
            <select value={weightUnit} onChange={e => { setWeightUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '68px', padding: '4px 6px' }}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Activity</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ id: 'walking', label: '🚶 Walk' }, { id: 'brisk', label: '🚶 Brisk' }, { id: 'running', label: '🏃 Run' }].map(a => (
              <button key={a.id} className={`tag${activity === a.id ? ' active' : ''}`}
                onClick={() => { setActivity(a.id); setResult(null); }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate distance</button>
        <button className="btn btn-ghost" onClick={() => { setSteps(''); setHeightCm(''); setHeightFt(''); setHeightIn(''); setWeight(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              {fmtNum(result.steps)} steps =
            </div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmt(result.distMiles, 2)} miles
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmt(result.distKm, 2)} km &nbsp;·&nbsp; {fmtNum(result.strides)} strides
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Miles"     value={`${fmt(result.distMiles, 2)} mi`} />
            <StatCard accent label="Kilometres" value={`${fmt(result.distKm, 2)} km`} />
            <StatCard label="Step length" value={`${fmt(result.stepLenCm, 1)} cm`} />
            <StatCard label="Time"        value={`${fmt(result.timeMins, 0)} min`} sub={result.activity} />
            {result.calories && (
              <StatCard accent label="Calories" value={`~${Math.round(result.calories)}`} sub="kcal" color="#f97316" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Daily goal planner ────────────────────────────────

function GoalPlannerMode() {
  const [goalSteps,  setGoalSteps]  = useState('10000');
  const [heightCm,   setHeightCm]   = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightFt,   setHeightFt]   = useState('');
  const [heightIn,   setHeightIn]   = useState('');
  const [gender,     setGender]     = useState('neutral');
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  function getHeightCm() {
    if (heightUnit === 'cm') return parseFloat(heightCm);
    return ftInToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
  }

  function calculate() {
    const goal = parseInt(goalSteps);
    const hCm  = getHeightCm();
    if (isNaN(goal) || goal <= 0) { setError('Enter a valid step goal.'); setResult(null); return; }
    if (isNaN(hCm) || hCm < 100 || hCm > 250) { setError('Enter a valid height (100–250 cm).'); setResult(null); return; }

    const stepLenCm = calcStepLength(hCm, gender);
    const miles     = stepsToMiles(goal, stepLenCm);
    const km        = stepsToKm(goal, stepLenCm);
    const timeMins  = calcTime(goal, stepLenCm, 'walking');

    // How to split throughout the day
    const sessions = [1, 2, 3, 4].map(n => ({
      sessions: n,
      stepsEach: Math.round(goal / n),
      distEach: stepsToMiles(Math.round(goal / n), stepLenCm),
      timeEach: calcTime(Math.round(goal / n), stepLenCm, 'walking'),
    }));

    setResult({ goal, miles, km, timeMins, sessions, stepLenCm });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find out how far your daily step goal is and how to split it into manageable sessions throughout the day.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Daily step goal</label>
          <input type="number" value={goalSteps} min="1000"
            onChange={e => { setGoalSteps(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 10000"
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {STEP_GOALS.map(g => (
              <button key={g} className={`tag${goalSteps === String(g) ? ' active' : ''}`}
                onClick={() => { setGoalSteps(String(g)); setResult(null); }}>
                {g.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Height</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <button className={`tag${heightUnit === 'cm' ? ' active' : ''}`}
              onClick={() => { setHeightUnit('cm'); setResult(null); }} style={{ flex: 1 }}>cm</button>
            <button className={`tag${heightUnit === 'ft' ? ' active' : ''}`}
              onClick={() => { setHeightUnit('ft'); setResult(null); }} style={{ flex: 1 }}>ft / in</button>
          </div>
          {heightUnit === 'cm' ? (
            <input type="number" value={heightCm} min="100" max="250"
              onChange={e => { setHeightCm(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 170" style={{ fontFamily: 'var(--mono)' }} />
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
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {HEIGHT_PRESETS.map(p => (
              <button key={p.label} className="tag"
                onClick={() => { setHeightCm(fmt(p.cm, 0)); setHeightUnit('cm'); setResult(null); }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Sex</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['neutral', 'male', 'female'].map(g => (
              <button key={g} className={`tag${gender === g ? ' active' : ''}`}
                onClick={() => { setGender(g); setResult(null); }}
                style={{ textTransform: 'capitalize', flex: 1 }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Plan goal</button>
        <button className="btn btn-ghost" onClick={() => { setGoalSteps('10000'); setHeightCm(''); setHeightFt(''); setHeightIn(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Daily goal"   value={fmtNum(result.goal)} sub="steps" />
            <StatCard accent label="Distance"     value={`${fmt(result.miles, 2)} mi`} sub={`${fmt(result.km, 2)} km`} />
            <StatCard label="Total time"   value={`${fmt(result.timeMins, 0)} min`} sub="at avg walk pace" />
            <StatCard label="Step length"  value={`${fmt(result.stepLenCm, 1)} cm`} />
          </div>

          <SectionTitle>How to split your goal across the day</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '8px' }}>
            {result.sessions.map(s => (
              <div key={s.sessions} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '4px' }}>
                  {s.sessions} session{s.sessions > 1 ? 's' : ''} per day
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-hover)' }}>
                  {fmtNum(s.stepsEach)} steps
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '3px' }}>
                  {fmt(s.distEach, 2)} mi · {fmt(s.timeEach, 0)} min each
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Miles → Steps',  desc: 'distance to step count' },
  { label: 'Steps → Miles',  desc: 'steps to distance'      },
  { label: 'Goal Planner',   desc: 'daily step goal splits'  },
];

export default function MilesToStepsCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Miles to Steps Calculator</span>
          </div>
          <h1>Miles to Steps Calculator</h1>
          <p className="subtitle">
            Convert miles or kilometres to steps (and back) based on your height, with calorie burn estimates, time projections, and a daily step goal planner.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <DistToStepsMode />}
          {mode === 1 && <StepsToDistMode />}
          {mode === 2 && <GoalPlannerMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Convert Miles to Steps</h2>
          <p>
            The number of steps in a mile depends primarily on your height — taller people have longer strides and take fewer steps to cover the same distance. The average step length is approximately 41.5% of a person's height. A stride (two steps) for a person of average height (5'9" / 175 cm) is roughly 150–155 cm, giving approximately 2,000 steps per mile or 1,250 steps per kilometre.
          </p>
          <p>
            The formula used here is: <strong>steps = distance (cm) ÷ step length (cm)</strong>, where step length = height (cm) × 0.415, with a small adjustment for biological sex. A person who is 5'4" (163 cm) takes roughly 2,200 steps per mile, while someone who is 6'2" (188 cm) takes about 1,900 steps per mile — a difference of about 300 steps, or 15%.
          </p>
          <p>
            <strong>Miles → Steps</strong> mode converts any distance — from a short 1-mile walk to a full marathon — into the equivalent step count for your height. Common race presets (5K, 10K, half marathon, marathon) load with one click. An optional calorie estimate uses the MET (Metabolic Equivalent of Task) formula with your body weight.
          </p>
          <p>
            <strong>Steps → Miles</strong> mode works in reverse: enter a step count (like your fitness tracker's daily total) and see the equivalent distance in miles and kilometres. It includes the same time and calorie estimates across walking, brisk walking, and running.
          </p>
          <p>
            <strong>Goal Planner</strong> takes your daily step target and shows you exactly how far it is and how to break it into 1, 2, 3, or 4 sessions throughout the day — making it easier to hit targets like the commonly cited 10,000 steps per day.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Miles to Steps Examples (5'9" / 175 cm, neutral stride)</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '1 mile',         value: '~2,216 steps',  sub: '175 cm / neutral' },
              { label: '5K (3.1 miles)', value: '~6,885 steps',  sub: '≈ 69% of 10K goal' },
              { label: '10K (6.2 miles)',value: '~13,769 steps', sub: 'exceeds 10K goal' },
              { label: '10,000 steps',   value: '~4.5 miles',     sub: 'the daily goal standard' },
              { label: 'Half marathon',  value: '~29,049 steps',  sub: '13.1 miles / 21.1 km' },
              { label: 'Marathon',       value: '~58,100 steps',  sub: '26.2 miles / 42.2 km' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="miles-to-steps-calculator" />
      </div>
    </div>
  );
}
