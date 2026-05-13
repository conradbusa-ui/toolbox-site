import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

const CURRENCIES = ['$', '€', '£', 'R', '¥'];

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

// ── Simple Interest ───────────────────────────────────────────
function SimpleInterest({ currency }) {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate]           = useState('');
  const [years, setYears]         = useState('');
  const [result, setResult]       = useState(null);

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(years);
    if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0 || r <= 0 || t <= 0) return;

    const interest = p * (r / 100) * t;
    const total    = p + interest;
    setResult({ p, r, t, interest, total });
  };

  const reset = () => { setPrincipal(''); setRate(''); setYears(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Simple Interest</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="si-principal">Principal Amount</label>
          <input id="si-principal" type="number" min="0" placeholder="e.g. 5000"
            value={principal} onChange={e => { setPrincipal(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group">
          <label htmlFor="si-rate">Annual Rate %</label>
          <input id="si-rate" type="number" min="0" placeholder="e.g. 8"
            value={rate} onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group">
          <label htmlFor="si-years">Time (Years)</label>
          <input id="si-years" type="number" min="0" placeholder="e.g. 3"
            value={years} onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!principal || !rate || !years}>Calculate</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Principal"        value={fmt(result.p, currency)} />
          <ResultRow label={`Interest (${result.r}% × ${result.t} yr${result.t !== 1 ? 's' : ''})`} value={fmt(result.interest, currency)} />
          <ResultRow label="Total Amount"     value={fmt(result.total, currency)} highlight />
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>Interest Earned</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmt(result.interest, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compound Interest ─────────────────────────────────────────
function CompoundInterest({ currency }) {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate]           = useState('');
  const [years, setYears]         = useState('');
  const [compounds, setCompounds] = useState('12');
  const [result, setResult]       = useState(null);

  const freqOptions = [
    { label: 'Daily',     value: '365' },
    { label: 'Monthly',   value: '12'  },
    { label: 'Quarterly', value: '4'   },
    { label: 'Annually',  value: '1'   },
  ];

  const calculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(years);
    const n = parseFloat(compounds);
    if (isNaN(p) || isNaN(r) || isNaN(t) || isNaN(n) || p <= 0 || t <= 0) return;

    const total    = p * Math.pow(1 + r / n, n * t);
    const interest = total - p;

    // Year-by-year breakdown (up to 30 years)
    const breakdown = [];
    const maxRows = Math.min(Math.ceil(t), 30);
    for (let y = 1; y <= maxRows; y++) {
      const val = p * Math.pow(1 + r / n, n * y);
      breakdown.push({ year: y, total: val, interest: val - p });
    }

    setResult({ p, r: parseFloat(rate), t, n, total, interest, breakdown });
  };

  const reset = () => { setPrincipal(''); setRate(''); setYears(''); setCompounds('12'); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Compound Interest</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="ci-principal">Principal Amount</label>
          <input id="ci-principal" type="number" min="0" placeholder="e.g. 10000"
            value={principal} onChange={e => { setPrincipal(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group">
          <label htmlFor="ci-rate">Annual Rate %</label>
          <input id="ci-rate" type="number" min="0" placeholder="e.g. 7"
            value={rate} onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group">
          <label htmlFor="ci-years">Time (Years)</label>
          <input id="ci-years" type="number" min="0" placeholder="e.g. 10"
            value={years} onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Compounding Frequency</label>
        <div className="tag-row">
          {freqOptions.map(f => (
            <button
              key={f.value}
              className={`tag${compounds === f.value ? ' active' : ''}`}
              onClick={() => { setCompounds(f.value); setResult(null); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!principal || !rate || !years}>Calculate</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
            <ResultRow label="Principal"              value={fmt(result.p, currency)} />
            <ResultRow label="Total Interest Earned"  value={fmt(result.interest, currency)} />
            <ResultRow label="Final Balance"          value={fmt(result.total, currency)} highlight />
          </div>

          <div style={{
            marginTop: '12px',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>
              Your money grew by
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>
              {((result.interest / result.p) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Year-by-year table */}
          {result.breakdown.length > 1 && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', marginBottom: '8px' }}>
                Year-by-Year Breakdown
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Year', 'Balance', 'Interest Earned'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map(row => (
                      <tr key={row.year} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)' }}>Year {row.year}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.total, currency)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmt(row.interest, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function InterestCalculator() {
  const [currency, setCurrency] = useState('$');

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Interest Calculator</span>
          </div>
          <h1>Interest Calculator</h1>
          <p className="subtitle">Calculate simple and compound interest with a year-by-year breakdown.</p>
        </div>

        {/* Currency picker — shared across both tools */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Currency</label>
          <div className="tag-row" style={{ margin: 0 }}>
            {CURRENCIES.map(c => (
              <button key={c} className={`tag${currency === c ? ' active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <SimpleInterest currency={currency} />
        <CompoundInterest currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>Simple Interest vs Compound Interest — What's the Difference?</h2>
          <p>
            Simple interest is calculated only on the original principal. If you deposit $5,000 at 8% per year
            for 3 years, you earn $400 every year — $1,200 total. It's straightforward and commonly used for
            short-term loans and some savings accounts.
          </p>
          <p>
            Compound interest is calculated on both the principal and the interest already earned. That means
            your interest earns interest, and the balance grows faster over time. The more frequently interest
            compounds — daily, monthly, or quarterly — the more you earn. This is the principle behind long-term
            investing and why starting early makes such a large difference.
          </p>
          <p>
            Use the simple interest calculator for straightforward loans or short-term deposits. Use the compound
            interest calculator for savings accounts, investments, or any situation where interest is reinvested.
            The year-by-year table shows exactly how your balance grows each year so you can see compounding in
            action. All calculations run entirely in your browser.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Interest Calculation Examples</h2>
          <p>
            <strong>Example 1 — Simple interest:</strong> You lend $3,000 at 6% per year for 2 years.
            Interest = $3,000 × 0.06 × 2 = $360. Total repayment = $3,360.
          </p>
          <p>
            <strong>Example 2 — Compound interest (monthly):</strong> You invest $10,000 at 7% compounded
            monthly for 10 years. Final balance ≈ $20,097. Interest earned ≈ $10,097 — your money nearly doubled.
          </p>
          <p>
            <strong>Example 3 — Why frequency matters:</strong> $5,000 at 5% for 5 years.
            Compounded annually: ≈ $6,381. Compounded daily: ≈ $6,436. The difference is $55 — small here,
            but significant on larger amounts over longer periods.
          </p>
        </div>

        <RelatedTools currentId="interest-calculator" />
      </div>
    </div>
  );
}
