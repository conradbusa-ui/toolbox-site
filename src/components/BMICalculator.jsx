import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

const CATEGORIES = [
  { label: 'Underweight',      min: 0,    max: 18.5, color: '#3b82f6' },
  { label: 'Normal weight',    min: 18.5, max: 25,   color: '#16a34a' },
  { label: 'Overweight',       min: 25,   max: 30,   color: '#f59e0b' },
  { label: 'Obese (Class I)',   min: 30,   max: 35,   color: '#f97316' },
  { label: 'Obese (Class II)',  min: 35,   max: 40,   color: '#ef4444' },
  { label: 'Obese (Class III)', min: 40,   max: 999,  color: '#991b1b' },
];

function getCategory(bmi) {
  return CATEGORIES.find(c => bmi >= c.min && bmi < c.max) || CATEGORIES[CATEGORIES.length - 1];
}

// Scale: BMI 10–45 mapped to 0–100%
function bmiToPercent(bmi) {
  return Math.min(Math.max(((bmi - 10) / 35) * 100, 0), 100);
}

export default function BMICalculator() {
  const [unit, setUnit]       = useState('metric');   // 'metric' | 'imperial'
  const [weight, setWeight]   = useState('');
  const [height, setHeight]   = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [result, setResult]   = useState(null);

  const calculate = () => {
    let bmi;
    if (unit === 'metric') {
      const w = parseFloat(weight);   // kg
      const h = parseFloat(height) / 100; // cm → m
      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
      bmi = w / (h * h);
    } else {
      const w  = parseFloat(weightLb);  // lbs
      const ft = parseFloat(heightFt) || 0;
      const i  = parseFloat(heightIn)  || 0;
      const totalInches = ft * 12 + i;
      if (isNaN(w) || w <= 0 || totalInches <= 0) return;
      bmi = (w / (totalInches * totalInches)) * 703;
    }
    setResult(parseFloat(bmi.toFixed(1)));
  };

  const reset = () => {
    setWeight(''); setHeight('');
    setHeightFt(''); setHeightIn(''); setWeightLb('');
    setResult(null);
  };

  const switchUnit = (u) => { setUnit(u); reset(); };

  const category = result !== null ? getCategory(result) : null;
  const pct      = result !== null ? bmiToPercent(result) : null;

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>BMI Calculator</span>
          </div>
          <h1>BMI Calculator</h1>
          <p className="subtitle">Calculate your Body Mass Index in metric or imperial units and see your weight category instantly.</p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Your BMI</h2>

          {/* Unit toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label>Unit System</label>
            <div className="tag-row">
              <button className={`tag${unit === 'metric' ? ' active' : ''}`} onClick={() => switchUnit('metric')}>
                Metric (kg / cm)
              </button>
              <button className={`tag${unit === 'imperial' ? ' active' : ''}`} onClick={() => switchUnit('imperial')}>
                Imperial (lb / ft)
              </button>
            </div>
          </div>

          {/* Metric inputs */}
          {unit === 'metric' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weight-kg">Weight (kg)</label>
                <input id="weight-kg" type="number" min="0" placeholder="e.g. 70"
                  value={weight} onChange={e => { setWeight(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()} />
              </div>
              <div className="form-group">
                <label htmlFor="height-cm">Height (cm)</label>
                <input id="height-cm" type="number" min="0" placeholder="e.g. 175"
                  value={height} onChange={e => { setHeight(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()} />
              </div>
            </div>
          )}

          {/* Imperial inputs */}
          {unit === 'imperial' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weight-lb">Weight (lbs)</label>
                <input id="weight-lb" type="number" min="0" placeholder="e.g. 154"
                  value={weightLb} onChange={e => { setWeightLb(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()} />
              </div>
              <div className="form-group">
                <label htmlFor="height-ft">Height (ft)</label>
                <input id="height-ft" type="number" min="0" placeholder="e.g. 5"
                  value={heightFt} onChange={e => { setHeightFt(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()} />
              </div>
              <div className="form-group">
                <label htmlFor="height-in">Height (in)</label>
                <input id="height-in" type="number" min="0" max="11" placeholder="e.g. 9"
                  value={heightIn} onChange={e => { setHeightIn(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && calculate()} />
              </div>
            </div>
          )}

          <div className="btn-group" style={{ marginBottom: result !== null ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={unit === 'metric' ? (!weight || !height) : (!weightLb || (!heightFt && !heightIn))}>
              Calculate BMI
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result !== null && category && (
            <div>
              {/* Big BMI number */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  fontSize: 'clamp(3rem, 10vw, 5rem)',
                  fontWeight: 700,
                  color: category.color,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {result}
                </div>
                <div style={{
                  marginTop: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: category.color,
                }}>
                  {category.label}
                </div>
              </div>

              {/* Visual scale */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  height: '12px',
                  borderRadius: '99px',
                  background: 'linear-gradient(to right, #3b82f6 0%, #16a34a 30%, #f59e0b 55%, #f97316 70%, #ef4444 85%, #991b1b 100%)',
                  position: 'relative',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    border: `3px solid ${category.color}`,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)' }}>
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>

              {/* Category table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left',  color: 'var(--text-2)', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600 }}>BMI Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map(c => (
                      <tr key={c.label} style={{
                        borderBottom: '1px solid var(--border)',
                        background: category.label === c.label ? `${c.color}15` : 'transparent',
                        fontWeight: category.label === c.label ? 700 : 400,
                      }}>
                        <td style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, flexShrink: 0, display: 'inline-block' }} />
                          {c.label}
                          {category.label === c.label && (
                            <span style={{ fontSize: '0.7rem', background: c.color, color: 'white', borderRadius: '99px', padding: '1px 7px', marginLeft: '4px' }}>You</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)' }}>
                          {c.max === 999 ? '≥ 40' : `${c.min} – ${c.max}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '12px', lineHeight: 1.5 }}>
                ⚠ BMI is a screening tool, not a diagnostic measure. It does not account for muscle mass, bone density, age, or sex. Consult a healthcare professional for a complete health assessment.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>What Is BMI and How Is It Calculated?</h2>
          <p>
            Body Mass Index (BMI) is a simple numerical value derived from a person's weight and height. The
            metric formula is weight in kilograms divided by height in metres squared (kg/m²). The imperial
            formula uses the same relationship but with pounds and inches, multiplied by a conversion factor
            of 703. The result places you in one of six standard categories ranging from underweight to
            severely obese.
          </p>
          <p>
            BMI is widely used by healthcare providers as a quick screening tool because it requires only two
            measurements and no specialist equipment. A BMI between 18.5 and 24.9 is generally considered a
            healthy range for most adults. Values below 18.5 may indicate undernutrition, while values above
            25 are associated with increased risk of conditions like type 2 diabetes, high blood pressure,
            and cardiovascular disease.
          </p>
          <p>
            It's important to remember that BMI has limitations. It doesn't distinguish between fat and
            muscle — a very muscular person may have a high BMI without excess body fat. It also doesn't
            account for age, sex, ethnicity, or where fat is distributed on the body. Use this calculator
            as a starting point, and speak to a doctor for a full picture of your health.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>BMI Calculation Examples</h2>
          <p>
            <strong>Example 1 — Metric:</strong> A person weighs 70 kg and is 175 cm tall.
            BMI = 70 ÷ (1.75 × 1.75) = 70 ÷ 3.0625 ≈ 22.9 — Normal weight.
          </p>
          <p>
            <strong>Example 2 — Imperial:</strong> A person weighs 180 lbs and is 5 ft 10 in tall (70 inches).
            BMI = (180 ÷ 70²) × 703 = (180 ÷ 4900) × 703 ≈ 25.8 — Overweight.
          </p>
          <p>
            <strong>Example 3 — Underweight:</strong> A person weighs 50 kg and is 175 cm tall.
            BMI = 50 ÷ 3.0625 ≈ 16.3 — Underweight. This may warrant a conversation with a doctor about
            nutrition and overall health.
          </p>
        </div>

        <RelatedTools currentId="bmi-calculator" />
      </div>
    </div>
  );
}
