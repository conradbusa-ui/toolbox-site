import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

const CURRENCIES = ['$', '€', '£', 'R', '₹', '¥'];

function fmt(n, currency) {
  return currency + parseFloat(n.toFixed(2)).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ResultRow({ label, value, highlight, muted, positive, negative }) {
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
        fontSize: highlight ? '1.25rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)'
          : positive ? '#16a34a'
          : negative ? '#dc2626'
          : muted ? 'var(--text-3)'
          : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Section 1: Future value of today's amount ─────────────────
function FutureValue({ currency }) {
  const [amount, setAmount]   = useState('');
  const [rate, setRate]       = useState('');
  const [years, setYears]     = useState('');
  const [result, setResult]   = useState(null);
  const [showTable, setShowTable] = useState(false);

  const QUICK_RATES = ['2', '3', '4', '5', '6', '8'];

  const calculate = () => {
    const a = parseFloat(amount);
    const r = parseFloat(rate) / 100;
    const y = parseFloat(years);
    if (isNaN(a) || isNaN(r) || isNaN(y) || a <= 0 || y <= 0) return;

    const futureValue   = a * Math.pow(1 + r, y);
    const totalIncrease = futureValue - a;
    const pctIncrease   = (totalIncrease / a) * 100;
    const purchasingPowerLost = a - (a / Math.pow(1 + r, y));
    const realValueToday      = a / Math.pow(1 + r, y);

    // Year-by-year
    const breakdown = [];
    for (let i = 1; i <= Math.min(y, 50); i++) {
      breakdown.push({
        year: i,
        value: a * Math.pow(1 + r, i),
        realValue: a / Math.pow(1 + r, i),
      });
    }

    setResult({ a, r, y, futureValue, totalIncrease, pctIncrease, purchasingPowerLost, realValueToday, breakdown });
    setShowTable(false);
  };

  const reset = () => { setAmount(''); setRate(''); setYears(''); setResult(null); setShowTable(false); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">What Will Today's Amount Cost in the Future?</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fv-amount">Current Amount</label>
          <input id="fv-amount" type="number" min="0" placeholder="e.g. 1000"
            value={amount}
            onChange={e => { setAmount(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fv-rate">Annual Inflation Rate %</label>
          <input id="fv-rate" type="number" min="0" step="0.1" placeholder="e.g. 3"
            value={rate}
            onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fv-years">Number of Years</label>
          <input id="fv-years" type="number" min="1" placeholder="e.g. 10"
            value={years}
            onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Quick Inflation Rates</label>
        <div className="tag-row">
          {QUICK_RATES.map(r => (
            <button key={r}
              className={`tag${rate === r ? ' active' : ''}`}
              onClick={() => { setRate(r); setResult(null); }}>
              {r}%
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={!amount || !rate || !years}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          {/* Hero */}
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: 'var(--radius)',
            padding: '22px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
              {fmt(result.a, '')} today will cost in {result.y} years
            </div>
            <div style={{ fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', fontWeight: 700, color: '#fca5a5', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmt(result.futureValue, currency)}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
              at {(result.r * 100).toFixed(1)}% annual inflation
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '16px' }}>
            <ResultRow label="Current Amount"              value={fmt(result.a, currency)} />
            <ResultRow label={`Future Cost (after ${result.y} yrs)`} value={fmt(result.futureValue, currency)} highlight />
            <ResultRow label="Total Price Increase"        value={fmt(result.totalIncrease, currency)} negative />
            <ResultRow label="Percentage Increase"         value={`${result.pctIncrease.toFixed(2)}%`} negative />
            <ResultRow label="Purchasing Power Lost"       value={fmt(result.purchasingPowerLost, currency)} muted />
            <ResultRow
              label={`What ${fmt(result.a, currency)} today is worth in ${result.y} yrs`}
              value={fmt(result.realValueToday, currency)}
              muted
            />
          </div>

          <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
            {showTable ? 'Hide year-by-year ▲' : 'Show year-by-year breakdown ▼'}
          </button>

          {showTable && (
            <div style={{ marginTop: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Year', 'Future Cost', 'Real Value Today'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map(row => (
                    <tr key={row.year} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>Year {row.year}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#fca5a5', fontWeight: 600 }}>{fmt(row.value, currency)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmt(row.realValue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section 2: Past value — what did it cost before? ──────────
function PastValue({ currency }) {
  const [amount, setAmount]   = useState('');
  const [rate, setRate]       = useState('');
  const [years, setYears]     = useState('');
  const [result, setResult]   = useState(null);

  const calculate = () => {
    const a = parseFloat(amount);
    const r = parseFloat(rate) / 100;
    const y = parseFloat(years);
    if (isNaN(a) || isNaN(r) || isNaN(y) || a <= 0 || y <= 0) return;

    const pastValue      = a / Math.pow(1 + r, y);
    const amountIncrease = a - pastValue;
    const pctChange      = (amountIncrease / pastValue) * 100;

    setResult({ a, r, y, pastValue, amountIncrease, pctChange });
  };

  const reset = () => { setAmount(''); setRate(''); setYears(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">What Did It Cost in the Past?</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="pv-amount">Current Amount</label>
          <input id="pv-amount" type="number" min="0" placeholder="e.g. 5000"
            value={amount}
            onChange={e => { setAmount(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="pv-rate">Annual Inflation Rate %</label>
          <input id="pv-rate" type="number" min="0" step="0.1" placeholder="e.g. 3"
            value={rate}
            onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="pv-years">Years Ago</label>
          <input id="pv-years" type="number" min="1" placeholder="e.g. 20"
            value={years}
            onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={!amount || !rate || !years}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Current Amount"                  value={fmt(result.a, currency)} />
          <ResultRow label={`What it cost ${result.y} years ago`} value={fmt(result.pastValue, currency)} highlight />
          <ResultRow label="Price Increase Since Then"       value={fmt(result.amountIncrease, currency)} negative />
          <ResultRow label="Total Inflation Over Period"     value={`${result.pctChange.toFixed(2)}%`} negative />

          <div style={{
            marginTop: '12px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: 'var(--text-2)',
          }}>
            {fmt(result.pastValue, currency)} then has the same purchasing power as{' '}
            <strong style={{ color: 'var(--text)' }}>{fmt(result.a, currency)} today</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 3: Implied inflation rate ────────────────────────
function ImpliedRate({ currency }) {
  const [past, setPast]       = useState('');
  const [current, setCurrent] = useState('');
  const [years, setYears]     = useState('');
  const [result, setResult]   = useState(null);

  const calculate = () => {
    const p = parseFloat(past);
    const c = parseFloat(current);
    const y = parseFloat(years);
    if (isNaN(p) || isNaN(c) || isNaN(y) || p <= 0 || c <= 0 || y <= 0) return;

    const impliedRate  = (Math.pow(c / p, 1 / y) - 1) * 100;
    const totalChange  = ((c - p) / p) * 100;
    setResult({ p, c, y, impliedRate, totalChange });
  };

  const reset = () => { setPast(''); setCurrent(''); setYears(''); setResult(null); };

  return (
    <div className="tool-box">
      <h2 className="tool-box-title">What Was the Inflation Rate Between Two Prices?</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="ir-past">Past Price / Amount</label>
          <input id="ir-past" type="number" min="0" placeholder="e.g. 1000"
            value={past}
            onChange={e => { setPast(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="ir-current">Current Price / Amount</label>
          <input id="ir-current" type="number" min="0" placeholder="e.g. 1800"
            value={current}
            onChange={e => { setCurrent(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="ir-years">Number of Years</label>
          <input id="ir-years" type="number" min="1" placeholder="e.g. 10"
            value={years}
            onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={!past || !current || !years}>
          Calculate Rate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Past Amount"              value={fmt(result.p, currency)} />
          <ResultRow label="Current Amount"           value={fmt(result.c, currency)} />
          <ResultRow label="Years Between"            value={`${result.y} years`} />
          <ResultRow label="Total Price Change"       value={`${result.totalChange.toFixed(2)}%`} />
          <ResultRow label="Implied Annual Inflation Rate" value={`${result.impliedRate.toFixed(3)}%`} highlight />
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function InflationCalculator() {
  const [currency, setCurrency] = useState('$');

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Inflation Calculator</span>
          </div>
          <h1>Inflation Calculator</h1>
          <p className="subtitle">
            Calculate how inflation erodes purchasing power — find future costs, past prices, and implied inflation rates between any two amounts.
          </p>
        </div>

        {/* Currency */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Currency</label>
          <div className="tag-row" style={{ margin: 0 }}>
            {CURRENCIES.map(c => (
              <button key={c} className={`tag${currency === c ? ' active' : ''}`}
                onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <FutureValue currency={currency} />
        <PastValue currency={currency} />
        <ImpliedRate currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How Inflation Erodes Purchasing Power Over Time</h2>
          <p>
            Inflation is the rate at which the general level of prices for goods and services rises over
            time, which means the purchasing power of money falls. Even a modest 3% annual inflation rate
            cuts the value of money roughly in half over 24 years. Understanding inflation is essential
            for financial planning, salary negotiations, retirement projections, and evaluating long-term
            investment returns.
          </p>
          <p>
            This calculator offers three tools. The first answers the question most people ask: if
            something costs $1,000 today and inflation runs at 3% per year, what will it cost in 10 or
            20 years? The year-by-year breakdown shows how the cost grows each year and how the real
            value of today's money shrinks. The second tool works in reverse — if you know today's price
            and want to understand what it would have cost years ago, enter the current price and the
            average inflation rate to find the historical equivalent.
          </p>
          <p>
            The third tool finds the implied inflation rate between two known prices over a known time
            period. This is useful for comparing historical price data, understanding how much a specific
            good or service has inflated, or checking whether a wage increase has kept up with actual
            cost-of-living changes. All three calculators run instantly in your browser with no data
            stored or transmitted.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Inflation Calculation Examples</h2>
          <p>
            <strong>Example 1 — Future cost of living:</strong> Monthly expenses of $3,500 today
            at 3% annual inflation over 20 years will cost $6,317/month. You'll need 80% more
            income just to maintain the same lifestyle.
          </p>
          <p>
            <strong>Example 2 — Retirement planning:</strong> You plan to retire in 25 years and
            estimate you'll need $4,000/month in today's money. At 3% inflation, you'll actually
            need $8,375/month at retirement to have equivalent purchasing power.
          </p>
          <p>
            <strong>Example 3 — Past price:</strong> A car costs R450,000 today. With an average
            6% inflation rate over 15 years, it would have cost approximately R187,850 fifteen
            years ago. Prices have more than doubled.
          </p>
          <p>
            <strong>Example 4 — Implied inflation rate:</strong> A grocery basket cost $200 in
            2010 and costs $320 today (14 years). Implied annual inflation rate = (320/200)^(1/14)
            − 1 ≈ 3.43% per year — useful for comparing to official CPI figures.
          </p>
        </div>

        <RelatedTools currentId="inflation-calculator" />
      </div>
    </div>
  );
}
