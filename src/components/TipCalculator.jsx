import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function fmt(n, currency) {
  return currency + parseFloat(n.toFixed(2)).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ResultRow({ label, value, highlight, muted }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.9rem', color: muted ? 'var(--text-3)' : 'var(--text-2)' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '1.3rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)' : 'var(--text)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
    </div>
  );
}

const QUICK_TIPS = [10, 15, 18, 20, 25];
const CURRENCIES = ['$', '€', '£', 'R', '¥'];

export default function TipCalculator() {
  const [bill, setBill]         = useState('');
  const [tipPct, setTipPct]     = useState('');
  const [people, setPeople]     = useState('1');
  const [currency, setCurrency] = useState('$');
  const [result, setResult]     = useState(null);

  const calculate = (overrideTip) => {
    const b = parseFloat(bill);
    const t = parseFloat(overrideTip !== undefined ? overrideTip : tipPct);
    const p = parseInt(people) || 1;
    if (isNaN(b) || b <= 0 || isNaN(t) || t < 0) return;

    const tipAmount   = b * (t / 100);
    const total       = b + tipAmount;
    const perPerson   = total / p;
    const tipPerPerson = tipAmount / p;

    setResult({ b, t, tipAmount, total, perPerson, tipPerPerson, p });
  };

  const handleQuickTip = (pct) => {
    setTipPct(String(pct));
    calculate(pct);
  };

  const reset = () => {
    setBill('');
    setTipPct('');
    setPeople('1');
    setResult(null);
  };

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Tip Calculator</span>
          </div>
          <h1>Tip Calculator</h1>
          <p className="subtitle">Calculate the tip amount, total bill, and split evenly between any number of people.</p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Your Tip</h2>

          <div className="form-row">
            <div className="form-group" style={{ flex: 'none', minWidth: '90px' }}>
              <label htmlFor="currency-sel">Currency</label>
              <select id="currency-sel" value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="bill-input">Bill Amount</label>
              <input
                id="bill-input"
                type="number"
                min="0"
                placeholder="e.g. 85.00"
                value={bill}
                onChange={e => { setBill(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="tip-input">Tip %</label>
              <input
                id="tip-input"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 15"
                value={tipPct}
                onChange={e => { setTipPct(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="people-input">Split Between</label>
              <input
                id="people-input"
                type="number"
                min="1"
                placeholder="1"
                value={people}
                onChange={e => { setPeople(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>
          </div>

          {/* Quick tip buttons */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Quick Tip</label>
            <div className="tag-row">
              {QUICK_TIPS.map(pct => (
                <button
                  key={pct}
                  className={`tag${tipPct === String(pct) ? ' active' : ''}`}
                  onClick={() => handleQuickTip(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
            <button className="btn btn-primary" onClick={() => calculate()} disabled={!bill || !tipPct}>
              Calculate
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                <ResultRow label="Bill Amount"           value={fmt(result.b, currency)} />
                <ResultRow label={`Tip (${result.t}%)`} value={fmt(result.tipAmount, currency)} />
                <ResultRow label="Total Bill"            value={fmt(result.total, currency)} highlight />
              </div>

              {result.p > 1 && (
                <div style={{
                  marginTop: '16px',
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 18px',
                }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', marginBottom: '12px' }}>
                    Split {result.p} ways
                  </p>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
                      <div className="stat-value">{fmt(result.perPerson, currency)}</div>
                      <div className="stat-label">Per Person (total)</div>
                    </div>
                    <div className="result-stat" style={{ background: 'none', padding: 0, textAlign: 'left' }}>
                      <div className="stat-value">{fmt(result.tipPerPerson, currency)}</div>
                      <div className="stat-label">Tip Per Person</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '12px',
                background: 'var(--accent-light)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>Tip Amount</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>
                  {fmt(result.tipAmount, currency)} ({result.t}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Calculate a Tip</h2>
          <p>
            Tipping customs vary by country and situation, but the calculation is always the same: multiply
            your bill by the tip percentage and add it to the total. For example, a 15% tip on a $60 meal
            works out to $9, making your total $69. This tool handles that instantly — and splits the result
            across any number of diners so nobody has to do the mental arithmetic at the table.
          </p>
          <p>
            Use the quick-tip buttons to jump straight to the most common percentages — 10% for average
            service, 15% for good service, 18–20% for very good service, and 25% for exceptional service.
            Or type any custom percentage directly into the Tip % field for situations like hotel staff,
            taxi drivers, or food delivery where different norms apply.
          </p>
          <p>
            The bill splitter divides the full total (bill plus tip) evenly per person, and also shows the
            tip portion per person separately so each person knows exactly what they owe. All calculations
            run locally in your browser — nothing is sent anywhere.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Tip Calculation Examples</h2>
          <p>
            <strong>Example 1 — Dinner for one:</strong> Bill is $55.00 with a 20% tip.
            Tip = $11.00. Total = $66.00.
          </p>
          <p>
            <strong>Example 2 — Group of 4:</strong> Bill is $200 with an 18% tip split 4 ways.
            Tip = $36.00. Total = $236.00. Each person pays $59.00 ($9.00 tip each).
          </p>
          <p>
            <strong>Example 3 — Taxi ride:</strong> Fare is R180 with a 10% tip.
            Tip = R18.00. Total = R198.00.
          </p>
        </div>

        <RelatedTools currentId="tip-calculator" />
      </div>
    </div>
  );
}
