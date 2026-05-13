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
        fontSize: highlight ? '1.25rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)' : muted ? 'var(--text-3)' : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

const FREQ_OPTIONS = [
  { label: 'Daily',     value: 365  },
  { label: 'Weekly',    value: 52   },
  { label: 'Monthly',   value: 12   },
  { label: 'Quarterly', value: 4    },
  { label: 'Annually',  value: 1    },
];

export default function CompoundInterestCalculator() {
  const [currency, setCurrency]         = useState('$');
  const [principal, setPrincipal]       = useState('');
  const [rate, setRate]                 = useState('');
  const [years, setYears]               = useState('');
  const [compoundFreq, setCompoundFreq] = useState(12);
  const [contribution, setContribution] = useState('');
  const [contribFreq, setContribFreq]   = useState('monthly'); // monthly | yearly
  const [result, setResult]             = useState(null);
  const [showTable, setShowTable]       = useState(false);

  const calculate = () => {
    const P  = parseFloat(principal) || 0;
    const r  = parseFloat(rate) / 100;
    const t  = parseFloat(years);
    const n  = compoundFreq;
    const c  = parseFloat(contribution) || 0;
    const cp = contribFreq === 'monthly' ? 12 : 1; // contributions per year

    if ((P <= 0 && c <= 0) || isNaN(r) || isNaN(t) || t <= 0) return;

    // Year-by-year breakdown
    const breakdown = [];
    let balance      = P;
    let totalContrib = P;

    for (let y = 1; y <= Math.ceil(t); y++) {
      const isPartial  = y > t; // shouldn't happen with ceil but safety
      const yearFrac   = Math.min(y, t) - (y - 1);

      // Compound the balance for this year
      const startBalance = balance;
      balance = balance * Math.pow(1 + r / n, n * yearFrac);

      // Add contributions (simplified: add at each contribution period)
      const contribsThisYear = cp * yearFrac;
      const contribAmount    = c * contribsThisYear;

      // For contributions, use future value of annuity formula per year
      if (c > 0) {
        const rPer  = r / n;
        const nPer  = n * yearFrac;
        const fvContrib = c * (cp / n) * ((Math.pow(1 + rPer, nPer) - 1) / rPer);
        balance = startBalance * Math.pow(1 + r / n, n * yearFrac) + fvContrib;
        totalContrib += contribAmount;
      }

      const interestEarned = balance - totalContrib;
      breakdown.push({
        year: y,
        balance,
        totalContrib,
        interestEarned: Math.max(interestEarned, 0),
      });
    }

    // Final precise calculation
    let finalBalance;
    if (c === 0) {
      finalBalance = P * Math.pow(1 + r / n, n * t);
    } else {
      const rPer       = r / n;
      const totalPer   = n * t;
      const fvPrincipal = P * Math.pow(1 + rPer, totalPer);
      const contribPerPeriod = c / (n / cp);
      const fvContribs  = contribPerPeriod * ((Math.pow(1 + rPer, totalPer) - 1) / rPer);
      finalBalance = fvPrincipal + fvContribs;
    }

    const totalDeposited  = P + c * cp * t;
    const totalInterest   = finalBalance - totalDeposited;
    const growthPct       = P > 0 ? ((finalBalance - P) / P) * 100 : 0;
    const effectiveRate   = (Math.pow(1 + r / n, n) - 1) * 100;

    setResult({
      finalBalance, totalDeposited, totalInterest,
      growthPct, effectiveRate, P, r, t, n, c, cp,
      breakdown,
    });
    setShowTable(false);
  };

  const reset = () => {
    setPrincipal(''); setRate(''); setYears('');
    setContribution(''); setCompoundFreq(12);
    setResult(null); setShowTable(false);
  };

  const principalPct   = result && result.finalBalance > 0
    ? ((result.P / result.finalBalance) * 100).toFixed(1) : 0;
  const contribPct     = result && result.finalBalance > 0
    ? (((result.totalDeposited - result.P) / result.finalBalance) * 100).toFixed(1) : 0;
  const interestPct    = result && result.finalBalance > 0
    ? ((result.totalInterest / result.finalBalance) * 100).toFixed(1) : 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Compound Interest Calculator</span>
          </div>
          <h1>Compound Interest Calculator</h1>
          <p className="subtitle">
            See how your money grows over time with compound interest — including regular contributions and a year-by-year breakdown.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Compound Growth</h2>

          {/* Currency */}
          <div style={{ marginBottom: '18px' }}>
            <label>Currency</label>
            <div className="tag-row">
              {CURRENCIES.map(c => (
                <button key={c} className={`tag${currency === c ? ' active' : ''}`}
                  onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Core inputs */}
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="ci-principal">Initial Principal</label>
              <input id="ci-principal" type="number" min="0" placeholder="e.g. 10000"
                value={principal}
                onChange={e => { setPrincipal(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="ci-rate">Annual Interest Rate %</label>
              <input id="ci-rate" type="number" min="0" step="0.01" placeholder="e.g. 8"
                value={rate}
                onChange={e => { setRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="ci-years">Time Period (Years)</label>
              <input id="ci-years" type="number" min="1" placeholder="e.g. 10"
                value={years}
                onChange={e => { setYears(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
          </div>

          {/* Compound frequency */}
          <div style={{ marginBottom: '18px' }}>
            <label>Compounding Frequency</label>
            <div className="tag-row">
              {FREQ_OPTIONS.map(f => (
                <button key={f.value}
                  className={`tag${compoundFreq === f.value ? ' active' : ''}`}
                  onClick={() => { setCompoundFreq(f.value); setResult(null); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional contributions */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
            Regular Contributions (optional)
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="ci-contrib">Contribution Amount</label>
              <input id="ci-contrib" type="number" min="0" placeholder="e.g. 500"
                value={contribution}
                onChange={e => { setContribution(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 'none', minWidth: '160px' }}>
              <label>Frequency</label>
              <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
                <button className={`tag${contribFreq === 'monthly' ? ' active' : ''}`}
                  onClick={() => { setContribFreq('monthly'); setResult(null); }}>Monthly</button>
                <button className={`tag${contribFreq === 'yearly' ? ' active' : ''}`}
                  onClick={() => { setContribFreq('yearly'); setResult(null); }}>Yearly</button>
              </div>
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={(!principal && !contribution) || !rate || !years}>
              Calculate
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Hero final balance */}
              <div style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0f172a, #134e4a)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                  Future Value after {result.t} {result.t === 1 ? 'Year' : 'Years'}
                </div>
                <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {fmt(result.finalBalance, currency)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                  Effective annual rate: {result.effectiveRate.toFixed(3)}%
                </div>
              </div>

              {/* Key figures */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
                <ResultRow label="Initial Principal"      value={fmt(result.P, currency)} />
                {result.c > 0 && (
                  <ResultRow
                    label={`Total Contributions (${result.cp === 12 ? 'monthly' : 'yearly'})`}
                    value={fmt(result.totalDeposited - result.P, currency)}
                  />
                )}
                <ResultRow label="Total Amount Deposited" value={fmt(result.totalDeposited, currency)} />
                <ResultRow label="Total Interest Earned"  value={fmt(result.totalInterest, currency)} />
                <ResultRow label="Final Balance"          value={fmt(result.finalBalance, currency)} highlight />
              </div>

              {/* Stats */}
              <div className="result-grid" style={{ marginBottom: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.growthPct.toFixed(1)}%</div>
                  <div className="stat-label">Total Growth</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.effectiveRate.toFixed(2)}%</div>
                  <div className="stat-label">Effective Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.totalInterest, currency)}</div>
                  <div className="stat-label">Interest Earned</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.finalBalance - result.totalDeposited, currency)}</div>
                  <div className="stat-label">Profit on Deposits</div>
                </div>
              </div>

              {/* Stacked bar */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  What makes up your final balance
                </p>
                <div style={{ height: '16px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: `${principalPct}%`, background: 'var(--accent)' }} title={`Principal: ${principalPct}%`} />
                  {parseFloat(contribPct) > 0 && (
                    <div style={{ width: `${contribPct}%`, background: '#7c3aed' }} title={`Contributions: ${contribPct}%`} />
                  )}
                  <div style={{ flex: 1, background: '#f97316' }} title={`Interest: ${interestPct}%`} />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)', flexWrap: 'wrap' }}>
                  <span>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                    Principal {principalPct}%
                  </span>
                  {parseFloat(contribPct) > 0 && (
                    <span>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#7c3aed', marginRight: '5px', verticalAlign: 'middle' }} />
                      Contributions {contribPct}%
                    </span>
                  )}
                  <span>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                    Interest {interestPct}%
                  </span>
                </div>
              </div>

              {/* Year-by-year table */}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
                {showTable ? 'Hide year-by-year breakdown ▲' : 'Show year-by-year breakdown ▼'}
              </button>

              {showTable && (
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Year', 'Balance', 'Total Deposited', 'Interest Earned'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map(row => (
                        <tr key={row.year} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>Year {row.year}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.balance, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)' }}>{fmt(row.totalContrib, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmt(row.interestEarned, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How Compound Interest Works and Why It Matters</h2>
          <p>
            Compound interest is often called the most powerful force in personal finance. Unlike simple
            interest, which is calculated only on your original principal, compound interest is calculated
            on both the principal and the interest already earned. This means your interest earns interest,
            and your balance accelerates over time rather than growing in a straight line.
          </p>
          <p>
            The frequency of compounding makes a real difference. Daily compounding yields slightly more
            than monthly, which yields more than annual compounding, because interest is added to the
            balance more often and begins earning returns sooner. The effective annual rate — shown in the
            results — reflects the true yearly growth after compounding is applied, making it easy to
            compare products that compound at different intervals.
          </p>
          <p>
            Adding regular contributions dramatically accelerates growth. Even modest monthly deposits
            added to a compounding account can outperform a large lump-sum investment over long periods.
            The stacked bar shows exactly how much of your final balance comes from your original
            principal, additional contributions, and interest — a clear picture of how compounding
            rewards patience. Use the year-by-year breakdown to see the balance at any point in your
            investment horizon. All calculations run instantly in your browser.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Compound Interest Examples</h2>
          <p>
            <strong>Example 1 — Lump sum, no contributions:</strong> $10,000 invested at 8% compounded
            monthly for 10 years. Final balance ≈ $22,196. Interest earned ≈ $12,196. Your money more
            than doubled without adding a single dollar.
          </p>
          <p>
            <strong>Example 2 — Monthly contributions:</strong> $5,000 initial deposit at 7% compounded
            monthly for 20 years, adding $300/month. Final balance ≈ $195,817. Total deposited ≈ $77,000.
            Interest earned ≈ $118,817 — more than the total amount ever deposited.
          </p>
          <p>
            <strong>Example 3 — Compounding frequency comparison:</strong> $20,000 at 6% for 15 years.
            Annually: ≈ $47,932. Monthly: ≈ $49,026. Daily: ≈ $49,137. More frequent compounding adds
            over $1,200 on the same rate and principal.
          </p>
          <p>
            <strong>Example 4 — The cost of waiting:</strong> Investor A starts at 25 with $200/month at
            8%. Investor B starts at 35 with $200/month at 8%. Both retire at 65. A ends with ≈ $702,000.
            B ends with ≈ $298,000. A 10-year head start more than doubles the outcome.
          </p>
        </div>

        <RelatedTools currentId="compound-interest-calculator" />
      </div>
    </div>
  );
}
