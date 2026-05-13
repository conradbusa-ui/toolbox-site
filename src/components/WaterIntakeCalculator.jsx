import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculation ──────────────────────────────────────────

// Base recommendations
// Holliday-Segar (clinical) + activity + climate adjustments
function calcWaterMl(weightKg, activityLevel, climate, sex) {
  // Base: 35 ml/kg for adults (European Food Safety Authority baseline)
  let base = weightKg * 35;

  // Sex adjustment: males need slightly more
  if (sex === 'male') base *= 1.05;

  // Activity adjustment
  const activityAdd = {
    sedentary: 0,
    light:     350,
    moderate:  600,
    active:    900,
    very:      1200,
  };
  base += activityAdd[activityLevel] || 0;

  // Climate adjustment
  const climateAdd = {
    temperate: 0,
    warm:      300,
    hot:       600,
    humid:     400,
  };
  base += climateAdd[climate] || 0;

  return Math.round(base);
}

// Conversion helpers
function lbsToKg(lbs)    { return lbs * 0.453592; }
function mlToOz(ml)      { return ml / 29.5735; }
function mlToLitres(ml)  { return ml / 1000; }
function mlToCups(ml)    { return ml / 236.588; }
function fmt(n, dp = 1)  { return isFinite(n) ? parseFloat(n.toFixed(dp)) : 0; }

// How many glasses/bottles to reach goal
function containersNeeded(totalMl, containerMl) {
  return Math.ceil(totalMl / containerMl);
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
      borderRadius: 'var(--radius)',
      padding: '14px 18px',
      textAlign: 'center',
      flex: '1 1 120px',
      minWidth: '110px',
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

// ── Hydration bar ─────────────────────────────────────────────

function HydrationBar({ totalMl }) {
  // Show 8-glass (250ml) schedule across the day
  const glassSize = 250;
  const needed = Math.ceil(totalMl / glassSize);
  const capped = Math.min(needed, 16); // max display

  const timeSlots = [
    { time: '7 AM',  label: 'Wake up' },
    { time: '9 AM',  label: 'Mid morning' },
    { time: '11 AM', label: 'Late morning' },
    { time: '1 PM',  label: 'Lunch' },
    { time: '3 PM',  label: 'Afternoon' },
    { time: '5 PM',  label: 'Late afternoon' },
    { time: '7 PM',  label: 'Dinner' },
    { time: '9 PM',  label: 'Evening' },
  ];

  const perSlot = Math.ceil(capped / timeSlots.length);

  return (
    <div style={{ marginTop: '10px' }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '12px' }}>
        Suggested schedule — {needed} × {glassSize}ml glasses spread throughout the day:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {timeSlots.map((slot, i) => {
          const glassesThisSlot = Math.min(perSlot, Math.max(0, capped - i * perSlot));
          return (
            <div key={slot.time} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
            }}>
              <div style={{ flex: '0 0 55px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{slot.time}</div>
              <div style={{ flex: '0 0 100px', fontSize: '0.72rem', color: 'var(--text-3)' }}>{slot.label}</div>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                {Array.from({ length: glassesThisSlot }).map((_, j) => (
                  <span key={j} style={{ fontSize: '1rem' }}>💧</span>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--mono)', color: 'var(--text-2)', flexShrink: 0 }}>
                {glassesThisSlot * glassSize} ml
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Container breakdown ───────────────────────────────────────

function ContainerBreakdown({ totalMl }) {
  const containers = [
    { label: 'Small glass',   ml: 200,  icon: '🥛' },
    { label: 'Standard glass',ml: 250,  icon: '🥤' },
    { label: 'Tall glass',    ml: 350,  icon: '🥤' },
    { label: '500ml bottle',  ml: 500,  icon: '🍶' },
    { label: '750ml bottle',  ml: 750,  icon: '🍶' },
    { label: '1L bottle',     ml: 1000, icon: '🫙' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginTop: '10px' }}>
      {containers.map(c => (
        <div key={c.label} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{c.icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-hover)' }}>
              {containersNeeded(totalMl, c.ml)}×
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.3 }}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Adjustment factors display ────────────────────────────────

function AdjustmentFactors({ activityLevel, climate, sex, weightKg, unit }) {
  const basePerKg = sex === 'male' ? 35 * 1.05 : 35;
  const base = Math.round(weightKg * basePerKg);
  const actAdd = { sedentary: 0, light: 350, moderate: 600, active: 900, very: 1200 };
  const climAdd = { temperate: 0, warm: 300, hot: 600, humid: 400 };

  const rows = [
    { label: 'Base (35ml/kg × weight)',        add: base,                     note: `${unit === 'imperial' ? fmt(weightKg * 2.20462, 0) + ' lbs' : weightKg + ' kg'} bodyweight` },
    { label: 'Sex adjustment',                  add: Math.round((basePerKg - 35) * weightKg), note: sex === 'male' ? '+5% for males' : 'no adjustment' },
    { label: 'Activity level',                  add: actAdd[activityLevel],    note: activityLevel },
    { label: 'Climate',                          add: climAdd[climate],         note: climate },
  ].filter(r => r.add !== 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px',
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>{r.note}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', fontSize: '0.9rem' }}>
            +{r.add} ml
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary',        desc: 'Desk job, little movement',        icon: '🪑' },
  { id: 'light',     label: 'Lightly active',    desc: 'Light exercise 1–3 days/week',     icon: '🚶' },
  { id: 'moderate',  label: 'Moderately active', desc: 'Exercise 3–5 days/week',           icon: '🚴' },
  { id: 'active',    label: 'Active',            desc: 'Hard exercise 5–6 days/week',      icon: '🏃' },
  { id: 'very',      label: 'Very active',        desc: 'Physical job + daily exercise',    icon: '⚡' },
];

const CLIMATES = [
  { id: 'temperate', label: 'Temperate',  desc: 'Cool to mild (< 20°C)', icon: '🌤' },
  { id: 'warm',      label: 'Warm',       desc: 'Warm climate (~20–28°C)', icon: '☀️' },
  { id: 'hot',       label: 'Hot',        desc: 'Hot / dry (> 28°C)',    icon: '🌡' },
  { id: 'humid',     label: 'Hot & humid', desc: 'Tropical / summer',    icon: '💦' },
];

export default function WaterIntakeCalculator() {
  const [unit, setUnit]         = useState('metric');
  const [sex, setSex]           = useState('male');
  const [weight, setWeight]     = useState('');
  const [activity, setActivity] = useState('moderate');
  const [climate, setClimate]   = useState('temperate');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');

  const isMetric = unit === 'metric';

  function calculate() {
    const raw = parseFloat(weight);
    if (isNaN(raw) || raw <= 0) { setError('Enter a valid weight.'); setResult(null); return; }

    const wKg = isMetric ? raw : lbsToKg(raw);
    if (wKg < 20 || wKg > 300) { setError('Weight must be between 20–300 kg (44–660 lbs).'); setResult(null); return; }

    const totalMl = calcWaterMl(wKg, activity, climate, sex);
    setResult({ totalMl, wKg });
    setError('');
  }

  function copy() {
    if (!result) return;
    const { totalMl } = result;
    const lines = [
      `Daily water intake: ${fmt(mlToLitres(totalMl), 2)} litres (${fmt(totalMl, 0)} ml)`,
      `In fluid ounces: ${fmt(mlToOz(totalMl), 1)} fl oz`,
      `In cups: ${fmt(mlToCups(totalMl), 1)} cups`,
      `250ml glasses: ${containersNeeded(totalMl, 250)}`,
      `500ml bottles: ${containersNeeded(totalMl, 500)}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const wKg = result?.wKg || 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Water Intake Calculator</span>
          </div>
          <h1>Water Intake Calculator</h1>
          <p className="subtitle">
            Find out exactly how much water you should drink each day based on your weight, activity level, and climate — with a glass-by-glass daily schedule.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Unit + sex */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['metric', 'imperial'].map(u => (
              <button key={u} onClick={() => { setUnit(u); setResult(null); setError(''); }}
                style={{
                  flex: 1, minWidth: '130px', padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${unit === u ? 'var(--accent)' : 'var(--border)'}`,
                  background: unit === u ? 'var(--accent-light)' : 'var(--surface2)',
                  color: unit === u ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {u === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}
              </button>
            ))}
            {['male', 'female'].map(s => (
              <button key={s} onClick={() => { setSex(s); setResult(null); }}
                style={{
                  flex: 1, minWidth: '90px', padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
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

          {/* Weight */}
          <div className="form-group" style={{ maxWidth: '220px' }}>
            <label>Weight ({isMetric ? 'kg' : 'lbs'})</label>
            <input type="number" value={weight}
              onChange={e => { setWeight(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder={isMetric ? 'e.g. 70' : 'e.g. 154'} />
          </div>

          {/* Activity level */}
          <div className="form-group">
            <label>Activity level</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ACTIVITY_LEVELS.map(al => (
                <button key={al.id} onClick={() => { setActivity(al.id); setResult(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${activity === al.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: activity === al.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{al.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activity === al.id ? 'var(--accent-hover)' : 'var(--text)' }}>{al.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px' }}>{al.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Climate */}
          <div className="form-group">
            <label>Climate / environment</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '6px' }}>
              {CLIMATES.map(c => (
                <button key={c.id} onClick={() => { setClimate(c.id); setResult(null); }}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1.5px solid ${climate === c.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: climate === c.id ? 'var(--accent-light)' : 'var(--surface2)',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: climate === c.id ? 'var(--accent-hover)' : 'var(--text)' }}>{c.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '1px' }}>{c.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: '4px' }}>
            <button className="btn btn-primary" onClick={calculate}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => { setWeight(''); setResult(null); setError(''); }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Primary result */}
              <SectionTitle>Your daily water target</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard
                  accent
                  label="Daily water"
                  value={`${fmt(mlToLitres(result.totalMl), 2)} L`}
                  sub={`${result.totalMl} ml per day`}
                />
                <StatCard
                  accent
                  label="Fluid ounces"
                  value={`${fmt(mlToOz(result.totalMl), 0)} fl oz`}
                  sub="per day"
                />
                <StatCard
                  label="250ml glasses"
                  value={`${containersNeeded(result.totalMl, 250)}`}
                  sub="glasses per day"
                />
                <StatCard
                  label="500ml bottles"
                  value={`${containersNeeded(result.totalMl, 500)}`}
                  sub="bottles per day"
                />
              </div>

              {/* Visual water fill */}
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  position: 'relative',
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                  height: '10px',
                  overflow: 'hidden',
                }}>
                  {/* Reference markers at 1.5L and 2.5L */}
                  {[1500, 2000, 2500, 3000].map(mark => {
                    const max = Math.max(result.totalMl * 1.2, 3500);
                    const pct = (mark / max) * 100;
                    return pct <= 100 ? (
                      <div key={mark} style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${pct}%`, width: '1px',
                        background: 'var(--border-strong)', opacity: 0.6,
                      }} />
                    ) : null;
                  })}
                  {/* Fill */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${Math.min((result.totalMl / Math.max(result.totalMl * 1.2, 3500)) * 100, 100)}%`,
                    background: 'linear-gradient(to right, #0891b2, var(--accent))',
                    borderRadius: '99px',
                    transition: 'width 0.4s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '4px' }}>
                  <span>0 L</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>Your target: {fmt(mlToLitres(result.totalMl), 2)} L</span>
                  <span>{fmt(mlToLitres(Math.max(result.totalMl * 1.2, 3500)), 1)} L</span>
                </div>
              </div>

              {/* Unit conversions */}
              <SectionTitle>All units</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Litres"       value={`${fmt(mlToLitres(result.totalMl), 2)} L`} />
                <StatCard label="Millilitres"  value={`${result.totalMl} ml`} />
                <StatCard label="Fluid oz"     value={`${fmt(mlToOz(result.totalMl), 1)} fl oz`} />
                <StatCard label="Cups (240ml)" value={fmt(result.totalMl / 240, 1)} />
                <StatCard label="Pints"        value={fmt(result.totalMl / 473.2, 1)} />
              </div>

              {/* How it was calculated */}
              <SectionTitle>How your target was calculated</SectionTitle>
              <AdjustmentFactors
                activityLevel={activity}
                climate={climate}
                sex={sex}
                weightKg={wKg}
                unit={unit}
              />

              {/* Container breakdown */}
              <SectionTitle>How many containers to reach your goal</SectionTitle>
              <ContainerBreakdown totalMl={result.totalMl} />

              {/* Daily schedule */}
              <SectionTitle>Suggested daily drinking schedule</SectionTitle>
              <HydrationBar totalMl={result.totalMl} />

              {/* Tips */}
              <div style={{ marginTop: '20px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>💡 Hydration tips</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    'Start your day with a full glass of water before coffee or food.',
                    'Drink a glass 30 minutes before each meal.',
                    'Keep a water bottle visible at your desk as a visual cue.',
                    'Urine should be pale yellow — dark yellow means you need more water.',
                    'Fruits and vegetables contribute 20–30% of total daily fluid intake.',
                    'Increase your intake during illness, breastfeeding, or intense exercise.',
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ These are estimates based on general guidelines (EFSA, WHO). Individual needs vary based on health conditions, medications, pregnancy, and altitude. Consult a healthcare provider for personalised advice.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How Much Water Should You Drink Per Day?</h2>
          <p>
            The commonly cited "8 glasses a day" rule is a rough guideline — but your actual water needs depend on your body weight, how active you are, and where you live. This calculator gives you a personalised daily target based on evidence-based guidelines from the European Food Safety Authority (EFSA) and World Health Organisation (WHO).
          </p>
          <p>
            The baseline calculation uses <strong>35 ml per kg of body weight</strong> — the EFSA's recommended adequate intake for adults. This is then adjusted upward for activity level and climate. A lightly active person needs an extra 350 ml per day; someone doing hard daily exercise needs up to 1,200 ml more. Living in a hot climate adds another 300–600 ml, and humid tropical conditions add 400 ml due to increased sweat losses.
          </p>
          <p>
            <strong>Males</strong> generally need slightly more water than females of the same weight due to higher average muscle mass (which holds more water) and typically higher metabolic rates. The EFSA recommends 2.5 L/day for adult men and 2.0 L/day for adult women as adequate intake under sedentary, temperate conditions.
          </p>
          <p>
            It's important to note that <strong>about 20–30% of daily fluid intake</strong> comes from food — particularly fruits, vegetables, and soups. So your drinking target is slightly lower than your total fluid requirement. The calculator shows drinking water targets only, not total fluid from food.
          </p>
          <p>
            The daily schedule breaks your target into eight time slots from morning to evening so you can spread your intake evenly rather than trying to catch up late in the day. The container breakdown shows exactly how many glasses or bottles of different sizes you need to fill.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Daily Water Intake Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: 'Male, 80kg, sedentary',      water: '2.94 L',  glasses: '12 glasses' },
              { label: 'Female, 60kg, moderate',      water: '2.70 L',  glasses: '11 glasses' },
              { label: 'Male, 90kg, very active',     water: '4.51 L',  glasses: '19 glasses' },
              { label: 'Female, 55kg, light, hot',    water: '2.88 L',  glasses: '12 glasses' },
              { label: 'Male, 70kg, moderate, humid', water: '3.57 L',  glasses: '15 glasses' },
              { label: 'Female, 70kg, active',        water: '3.35 L',  glasses: '14 glasses' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.water}</div>
                <div className="stat-label">{ex.glasses}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="water-intake-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
