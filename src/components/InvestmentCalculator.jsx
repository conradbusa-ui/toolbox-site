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

function fmtShort(n, currency) {
  if (n >= 1_000_000_000) return currency + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return currency + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return currency + (n / 1_000).toFixed(1) + 'K';
  return fmt(n, currency);
}

function ResultRow({ label, value, highlight, muted, positive }) {
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
          : muted ? 'var(--text-3)'
          : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

const COMPOUND_FREQ = [
  { label: 'Daily',     value: 365 },
  { label: 'Monthly',   value: 12  },
  { label: 'Quarterly', value: 4   },
  { label: 'Annually',  value: 1   },
];

const CONTRIB_FREQ = [
  { label: 'Monthly',   value: 12  },
  { label: 'Quarterly', value: 4   },
  { label: 'Annually',  value: 1   },
];

export default function InvestmentCalculator() {
  const [currency, setCurrency]         = useState('$');
  const [principal, setPrincipal]       = useState('');
  const [rate, setRate]                 = useState('');
  const [years, setYears]               = useState('');
  const [compFreq, setCompFreq]         = useState(12);
  const [contribution, setContribution] = useState('');
  const [contribFreq, setContribFreq]   = useState(12);
  const [contribTiming, setContribTiming] = useState('end');   // 'start' | 'end'
  const [inflationRate, setInflationRate] = useState('');
  const [taxRate, setTaxRate]           = useState('');
  const [result, setResult]             = useState(null);
  const [showTable, setShowTable]       = useState(false);

  // ── Presets ───────────────────────────────────────────────
  const PRESETS = [
    { label: 'S&P 500 avg',     rate: '10.5', compFreq: 12 },
    { label: 'Conservative',    rate: '5',    compFreq: 12 },
    { label: 'Moderate',        rate: '7',    compFreq: 12 },
    { label: 'Aggressive',      rate: '12',   compFreq: 12 },
    { label: 'Savings account', rate: '4.5',  compFreq: 12 },
  ];

  const applyPreset = (p) => {
    setRate(p.rate);
    setCompFreq(p.compFreq);
    setResult(null);
  };

  const calculate = () => {
    const P   = parseFloat(principal)    || 0;
    const r   = parseFloat(rate)         / 100;
    const t   = parseFloat(years);
    const n   = compFreq;
    const c   = parseFloat(contribution) || 0;
    const cp  = contribFreq;
    const inf = parseFloat(inflationRate) / 100 || 0;
    const tax = parseFloat(taxRate)       / 100 || 0;

    if ((P <= 0 && c <= 0) || isNaN(r) || isNaN(t) || t <= 0 || r < 0) return;

    const rPerPeriod   = r / n;
    const totalPeriods = n * t;

    // Future value of lump sum
    const fvLump = P * Math.pow(1 + rPerPeriod, totalPeriods);

    // Future value of contributions (annuity)
    let fvContrib = 0;
    if (c > 0 && cp > 0) {
      const cPerPeriod   = c / (n / cp); // contribution per compounding period
      const periodsPerContrib = n / cp;
      if (rPerPeriod === 0) {
        fvContrib = c * cp * t;
      } else if (contribTiming === 'end') {
        // Ordinary annuity
        fvContrib = cPerPeriod * ((Math.pow(1 + rPerPeriod, totalPeriods) - 1) / rPerPeriod);
      } else {
        // Annuity due (beginning of period)
        fvContrib = cPerPeriod * ((Math.pow(1 + rPerPeriod, totalPeriods) - 1) / rPerPeriod) * (1 + rPerPeriod);
      }
    }

    const grossFinalValue  = fvLump + fvContrib;
    const totalDeposited   = P + c * cp * t;
    const grossInterest    = grossFinalValue - totalDeposited;

    // After-tax interest
    const taxOnGains       = grossInterest * tax;
    const netFinalValue    = grossFinalValue - taxOnGains;
    const netInterest      = grossInterest - taxOnGains;

    // Inflation-adjusted
    const realFinalValue   = netFinalValue / Math.pow(1 + inf, t);
    const realInterest     = realFinalValue - totalDeposited;

    // Effective annual rate
    const effectiveRate    = (Math.pow(1 + rPerPeriod, n) - 1) * 100;

    // ROI
    const roi = totalDeposited > 0 ? ((netFinalValue - totalDeposited) / totalDeposited) * 100 : 0;

    // Year-by-year breakdown
    const breakdown = [];
    let balance = P;
    let totalDep = P;

    for (let y = 1; y <= Math.ceil(t); y++) {
      const startBal  = balance;
      const yFrac     = Math.min(y, t) - (y - 1);
      const yPeriods  = n * yFrac;
      const yRPer     = rPerPeriod;

      const fvStart = startBal * Math.pow(1 + yRPer, yPeriods);
      let fvC = 0;
      if (c > 0 && yRPer > 0) {
        const cPer = c / (n / cp);
        fvC = cPer * ((Math.pow(1 + yRPer, yPeriods) - 1) / yRPer);
      } else if (c > 0) {
        fvC = c * cp * yFrac;
      }

      balance = fvStart + fvC;
      totalDep += c * cp * yFrac;
      const interestSoFar = balance - totalDep;

      breakdown.push({
        year: y,
        balance,
        totalDeposited: totalDep,
        interestEarned: Math.max(interestSoFar, 0),
        annualReturn: balance - startBal - c * cp * yFrac,
      });
    }

    setResult({
      P, r, t, n, c, cp,
      grossFinalValue, netFinalValue, realFinalValue,
      totalDeposited, grossInterest, netInterest, realInterest,
      taxOnGains, fvLump, fvContrib,
      effectiveRate, roi,
      breakdown,
      hasTax: tax > 0,
      hasInf: inf > 0,
      tax, inf,
    });
    setShowTable(false);
  };

  const reset = () => {
    setPrincipal(''); setRate(''); setYears('');
    setContribution(''); setInflationRate(''); setTaxRate('');
    setCompFreq(12); setContribFreq(12); setContribTiming('end');
    setResult(null); setShowTable(false);
  };

  const principalPct = result && result.grossFinalValue > 0
    ? ((result.P / result.grossFinalValue) * 100).toFixed(1) : 0;
  const contribPct   = result && result.grossFinalValue > 0
    ? (((result.totalDeposited - result.P) / result.grossFinalValue) * 100).toFixed(1) : 0;
  const interestPct  = result && result.grossFinalValue > 0
    ? ((result.grossInterest / result.grossFinalValue) * 100).toFixed(1) : 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Investment Calculator</span>
          </div>
          <h1>Investment Calculator</h1>
          <p className="subtitle">
            Project the future value of any investment — with contributions, compounding frequency, inflation adjustment, and after-tax returns.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Investment Growth</h2>

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
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
            Investment Details
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="inv-principal">Initial Investment</label>
              <input id="inv-principal" type="number" min="0" placeholder="e.g. 10000"
                value={principal}
                onChange={e => { setPrincipal(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="inv-rate">Annual Return Rate %</label>
              <input id="inv-rate" type="number" min="0" step="0.1" placeholder="e.g. 8"
                value={rate}
                onChange={e => { setRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="inv-years">Investment Period (Years)</label>
              <input id="inv-years" type="number" min="1" placeholder="e.g. 20"
                value={years}
                onChange={e => { setYears(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
          </div>

          {/* Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label>Return Rate Presets</label>
            <div className="tag-row">
              {PRESETS.map(p => (
                <button key={p.label} className={`tag${rate === p.rate ? ' active' : ''}`}
                  onClick={() => applyPreset(p)}>
                  {p.label} ({p.rate}%)
                </button>
              ))}
            </div>
          </div>

          {/* Compounding frequency */}
          <div style={{ marginBottom: '18px' }}>
            <label>Compounding Frequency</label>
            <div className="tag-row">
              {COMPOUND_FREQ.map(f => (
                <button key={f.value}
                  className={`tag${compFreq === f.value ? ' active' : ''}`}
                  onClick={() => { setCompFreq(f.value); setResult(null); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contributions */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
            Regular Contributions (optional)
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="inv-contrib">Contribution Amount</label>
              <input id="inv-contrib" type="number" min="0" placeholder="e.g. 500"
                value={contribution}
                onChange={e => { setContribution(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 'none' }}>
              <label>Frequency</label>
              <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
                {CONTRIB_FREQ.map(f => (
                  <button key={f.value}
                    className={`tag${contribFreq === f.value ? ' active' : ''}`}
                    onClick={() => { setContribFreq(f.value); setResult(null); }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ flex: 'none' }}>
              <label>Timing</label>
              <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
                <button className={`tag${contribTiming === 'end' ? ' active' : ''}`}
                  onClick={() => { setContribTiming('end'); setResult(null); }}>
                  End of period
                </button>
                <button className={`tag${contribTiming === 'start' ? ' active' : ''}`}
                  onClick={() => { setContribTiming('start'); setResult(null); }}>
                  Start of period
                </button>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Adjustments (optional)
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group">
              <label htmlFor="inv-inflation">Inflation Rate %</label>
              <input id="inv-inflation" type="number" min="0" step="0.1" placeholder="e.g. 3"
                value={inflationRate}
                onChange={e => { setInflationRate(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="inv-tax">Tax on Gains %</label>
              <input id="inv-tax" type="number" min="0" max="100" step="0.1" placeholder="e.g. 15"
                value={taxRate}
                onChange={e => { setTaxRate(e.target.value); setResult(null); }} />
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
              {/* Hero */}
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
                  {fmtShort(result.hasTax ? result.netFinalValue : result.grossFinalValue, currency)}
                </div>
                {result.hasTax && (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px' }}>
                    Gross value: {fmtShort(result.grossFinalValue, currency)} · Tax on gains: {fmt(result.taxOnGains, currency)}
                  </div>
                )}
                {result.hasInf && (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                    In today's dollars: {fmtShort(result.realFinalValue, currency)}
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                  Effective annual rate: {result.effectiveRate.toFixed(3)}%
                </div>
              </div>

              {/* Key results */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
                <ResultRow label="Initial Investment"      value={fmt(result.P, currency)} />
                {result.c > 0 && (
                  <ResultRow label="Total Contributions"  value={fmt(result.totalDeposited - result.P, currency)} />
                )}
                <ResultRow label="Total Amount Invested"  value={fmt(result.totalDeposited, currency)} />
                <ResultRow label="Total Interest / Gains" value={fmt(result.grossInterest, currency)} positive />
                {result.hasTax && (
                  <ResultRow label={`Tax on Gains (${(result.tax * 100).toFixed(1)}%)`}
                    value={`− ${fmt(result.taxOnGains, currency)}`} muted />
                )}
                <ResultRow
                  label={result.hasTax ? 'Net Final Value (after tax)' : 'Final Value'}
                  value={fmtShort(result.hasTax ? result.netFinalValue : result.grossFinalValue, currency)}
                  highlight
                />
                {result.hasInf && (
                  <ResultRow
                    label={`Real Value (inflation-adjusted at ${(result.inf * 100).toFixed(1)}%)`}
                    value={fmtShort(result.realFinalValue, currency)}
                    muted
                  />
                )}
              </div>

              {/* Stats */}
              <div className="result-grid" style={{ marginBottom: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.roi.toFixed(1)}%</div>
                  <div className="stat-label">Total ROI</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.effectiveRate.toFixed(2)}%</div>
                  <div className="stat-label">Effective Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>
                    {fmtShort(result.grossInterest, currency)}
                  </div>
                  <div className="stat-label">Total Gains</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>
                    {fmtShort(result.totalDeposited, currency)}
                  </div>
                  <div className="stat-label">Total Invested</div>
                </div>
              </div>

              {/* Stacked bar */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Composition of Final Value
                </p>
                <div style={{ height: '16px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                  {parseFloat(principalPct) > 0 && (
                    <div style={{ width: `${principalPct}%`, background: 'var(--accent)' }} />
                  )}
                  {parseFloat(contribPct) > 0 && (
                    <div style={{ width: `${contribPct}%`, background: '#7c3aed' }} />
                  )}
                  <div style={{ flex: 1, background: '#f97316' }} />
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-2)', flexWrap: 'wrap' }}>
                  {parseFloat(principalPct) > 0 && (
                    <span>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                      Initial investment {principalPct}%
                    </span>
                  )}
                  {parseFloat(contribPct) > 0 && (
                    <span>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#7c3aed', marginRight: '5px', verticalAlign: 'middle' }} />
                      Contributions {contribPct}%
                    </span>
                  )}
                  <span>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                    Gains / Interest {interestPct}%
                  </span>
                </div>
              </div>

              {/* Year-by-year */}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
                {showTable ? 'Hide year-by-year breakdown ▲' : 'Show year-by-year breakdown ▼'}
              </button>

              {showTable && (
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Year', 'Balance', 'Total Invested', 'Interest Earned', 'Annual Return'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map(row => (
                        <tr key={row.year} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>Year {row.year}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtShort(row.balance, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)' }}>{fmtShort(row.totalDeposited, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmtShort(row.interestEarned, currency)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{fmtShort(Math.max(row.annualReturn, 0), currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '16px', lineHeight: 1.5 }}>
                ⚠ This calculator assumes a fixed annual return rate. Real investment returns fluctuate year to year and are not guaranteed. Past performance does not predict future results. Tax treatment varies by country, account type, and holding period. Consult a licensed financial adviser before making investment decisions.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Investment Calculator</h2>
          <p>
            This investment calculator projects the future value of any investment over time, accounting
            for compound growth, regular contributions, inflation, and taxes on gains. Enter your initial
            investment amount, expected annual return rate, and time horizon to get an instant projection.
            Use the return rate presets — S&P 500 historical average, conservative, moderate, aggressive,
            or savings account — as starting points, then adjust to match your specific investment.
          </p>
          <p>
            Compounding frequency makes a real difference over long periods. Daily compounding yields
            slightly more than monthly, which beats quarterly or annual. The effective annual rate shown
            in the results reflects the true yearly growth after compounding is factored in. Regular
            contributions can be added monthly, quarterly, or annually, and you can choose whether they
            are made at the start or end of each period — start-of-period contributions earn slightly
            more because each deposit has an extra compounding period to grow.
          </p>
          <p>
            The inflation adjustment converts your future value back into today's purchasing power so
            you can understand what the number actually means for your lifestyle. The tax on gains field
            applies a flat rate to your investment profit — useful for estimating capital gains tax impact.
            The year-by-year table shows exactly how your balance builds each year, and the composition
            bar shows the proportion of your final value that comes from your initial investment,
            additional contributions, and investment gains.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Investment Growth Examples</h2>
          <p>
            <strong>Example 1 — Lump sum, S&P 500 average:</strong> $20,000 invested at 10.5%
            compounded monthly for 25 years. Final value ≈ $244,390. Total gains ≈ $224,390.
            ROI ≈ 1,122%. Your money grew more than 12× without a single additional deposit.
          </p>
          <p>
            <strong>Example 2 — Monthly contributions, no lump sum:</strong> $500/month at 8%
            compounded monthly for 20 years. Total invested ≈ $120,000. Final value ≈ $294,510.
            Gains ≈ $174,510 — more than the total amount contributed.
          </p>
          <p>
            <strong>Example 3 — Lump sum plus contributions:</strong> $10,000 initial investment
            plus $300/month at 7% compounded monthly for 15 years. Total invested ≈ $64,000.
            Final value ≈ $117,380. Gains ≈ $53,380.
          </p>
          <p>
            <strong>Example 4 — After-tax and inflation:</strong> $50,000 at 9% for 20 years,
            15% tax on gains, 3% inflation. Gross value ≈ $280,220. After 15% tax on gains ≈
            $246,750. In today's dollars (real value) ≈ $136,720. This is the true purchasing power
            of your investment.
          </p>
        </div>

        <RelatedTools currentId="investment-calculator" />
      </div>
    </div>
  );
}
