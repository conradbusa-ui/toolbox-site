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
  if (n >= 1_000_000) return currency + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return currency + (n / 1_000).toFixed(1) + 'K';
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

const FREQ_OPTIONS = [
  { label: 'Daily',     value: 365 },
  { label: 'Weekly',    value: 52  },
  { label: 'Monthly',   value: 12  },
  { label: 'Quarterly', value: 4   },
  { label: 'Annually',  value: 1   },
];

// ── Section 1: Future Savings Balance ────────────────────────
function FutureSavings({ currency }) {
  const [initial, setInitial]     = useState('');
  const [contrib, setContrib]     = useState('');
  const [contribFreq, setContribFreq] = useState(12);
  const [rate, setRate]           = useState('');
  const [compFreq, setCompFreq]   = useState(12);
  const [years, setYears]         = useState('');
  const [result, setResult]       = useState(null);
  const [showTable, setShowTable] = useState(false);

  const calculate = () => {
    const P  = parseFloat(initial) || 0;
    const c  = parseFloat(contrib) || 0;
    const r  = parseFloat(rate) / 100;
    const t  = parseFloat(years);
    const n  = compFreq;
    const cp = contribFreq;

    if ((P <= 0 && c <= 0) || isNaN(r) || isNaN(t) || t <= 0) return;

    const rPerPeriod   = r / n;
    const totalPeriods = n * t;

    // FV of lump sum
    const fvLump = P * Math.pow(1 + rPerPeriod, totalPeriods);

    // FV of regular contributions (ordinary annuity)
    let fvContrib = 0;
    if (c > 0 && rPerPeriod > 0) {
      const cPerPeriod = c / (n / cp);
      fvContrib = cPerPeriod * ((Math.pow(1 + rPerPeriod, totalPeriods) - 1) / rPerPeriod);
    } else if (c > 0) {
      fvContrib = c * cp * t;
    }

    const finalBalance    = fvLump + fvContrib;
    const totalDeposited  = P + c * cp * t;
    const totalInterest   = finalBalance - totalDeposited;
    const effectiveRate   = (Math.pow(1 + rPerPeriod, n) - 1) * 100;

    // Year-by-year (or month-by-month if period < 2 years)
    const breakdown = [];
    const useMonthly = t < 2;
    let bal2 = P;
    let dep2 = P;

    if (useMonthly) {
      // Month-by-month breakdown
      const totalMonths2 = Math.round(t * 12);
      for (let m = 1; m <= totalMonths2; m++) {
        if (rPerPeriod > 0) {
          const cPer = c > 0 ? c / (n / cp) : 0;
          bal2 = bal2 * (1 + rPerPeriod) + cPer;
        } else {
          bal2 += c > 0 ? c / (12 / cp) : 0;
        }
        dep2 += c > 0 ? c / (12 / cp) : 0;
        breakdown.push({
          label: `Month ${m}`,
          balance: bal2,
          deposited: dep2,
          interest: Math.max(bal2 - dep2, 0),
        });
      }
    } else {
      // Year-by-year breakdown
      for (let y = 1; y <= Math.ceil(t); y++) {
        const startBal = bal2;
        const yPeriods = n;
        if (rPerPeriod > 0) {
          const cPer = c > 0 ? c / (n / cp) : 0;
          bal2 = startBal * Math.pow(1 + rPerPeriod, yPeriods)
            + (cPer > 0 ? cPer * ((Math.pow(1 + rPerPeriod, yPeriods) - 1) / rPerPeriod) : 0);
        } else {
          bal2 = startBal + (c > 0 ? c * cp : 0);
        }
        dep2 += c > 0 ? c * cp : 0;
        breakdown.push({
          label: `Year ${y}`,
          balance: bal2,
          deposited: dep2,
          interest: Math.max(bal2 - dep2, 0),
        });
      }
    }

    setResult({ finalBalance, totalDeposited, totalInterest, effectiveRate, P, c, cp, t, breakdown, useMonthly });
    setShowTable(false);
  };

  const reset = () => {
    setInitial(''); setContrib(''); setRate(''); setYears('');
    setCompFreq(12); setContribFreq(12);
    setResult(null); setShowTable(false);
  };

  const depPct      = result ? ((result.totalDeposited / result.finalBalance) * 100).toFixed(1) : 0;
  const interestPct = result ? ((result.totalInterest / result.finalBalance) * 100).toFixed(1) : 0;

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Future Savings Balance</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fs-initial">Initial Deposit</label>
          <input id="fs-initial" type="number" min="0" placeholder="e.g. 5000"
            value={initial}
            onChange={e => { setInitial(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fs-rate">Annual Interest Rate %</label>
          <input id="fs-rate" type="number" min="0" step="0.1" placeholder="e.g. 5"
            value={rate}
            onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fs-years">Savings Period (Years)</label>
          <input id="fs-years" type="number" min="1" placeholder="e.g. 10"
            value={years}
            onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label>Compounding Frequency</label>
        <div className="tag-row">
          {FREQ_OPTIONS.map(f => (
            <button key={f.value}
              className={`tag${compFreq === f.value ? ' active' : ''}`}
              onClick={() => { setCompFreq(f.value); setResult(null); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
        Regular Contributions (optional)
      </p>
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="fs-contrib">Contribution Amount</label>
          <input id="fs-contrib" type="number" min="0" placeholder="e.g. 200"
            value={contrib}
            onChange={e => { setContrib(e.target.value); setResult(null); }} />
        </div>
        <div className="form-group" style={{ flex: 'none' }}>
          <label>Frequency</label>
          <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
            {FREQ_OPTIONS.filter(f => [12, 52, 1].includes(f.value)).map(f => (
              <button key={f.value}
                className={`tag${contribFreq === f.value ? ' active' : ''}`}
                onClick={() => { setContribFreq(f.value); setResult(null); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={(!initial && !contrib) || !rate || !years}>
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
            padding: '22px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
              Balance after {result.t} {result.t === 1 ? 'year' : 'years'}
            </div>
            <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmtShort(result.finalBalance, currency)}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
              Effective annual rate: {result.effectiveRate.toFixed(3)}%
            </div>
          </div>

          {/* Key results */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
            <ResultRow label="Total Deposited"    value={fmt(result.totalDeposited, currency)} />
            <ResultRow label="Total Interest"     value={fmt(result.totalInterest, currency)} positive />
            <ResultRow label="Final Balance"      value={fmtShort(result.finalBalance, currency)} highlight />
          </div>

          {/* Stats */}
          <div className="result-grid" style={{ marginBottom: '20px' }}>
            <div className="result-stat">
              <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.totalDeposited, currency)}</div>
              <div className="stat-label">Total Saved</div>
            </div>
            <div className="result-stat">
              <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.totalInterest, currency)}</div>
              <div className="stat-label">Interest Earned</div>
            </div>
            <div className="result-stat">
              <div className="stat-value">{interestPct}%</div>
              <div className="stat-label">From Interest</div>
            </div>
            <div className="result-stat">
              <div className="stat-value">{result.effectiveRate.toFixed(2)}%</div>
              <div className="stat-label">Effective Rate</div>
            </div>
          </div>

          {/* Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ height: '14px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: `${depPct}%`, background: 'var(--accent)' }} />
              <div style={{ flex: 1, background: '#f97316' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)' }}>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                Deposits {depPct}%
              </span>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                Interest {interestPct}%
              </span>
            </div>
          </div>

          {/* Table */}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
            {showTable ? 'Hide year-by-year ▲' : 'Show year-by-year breakdown ▼'}
          </button>
          {showTable && (
            <div style={{ marginTop: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {[result.useMonthly ? 'Month' : 'Year', 'Balance', 'Total Deposited', 'Interest Earned'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map(row => (
                    <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>{row.label}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtShort(row.balance, currency)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)' }}>{fmtShort(row.deposited, currency)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmtShort(Math.max(row.interest, 0), currency)}</td>
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

// ── Section 2: Goal — how long to reach a target? ────────────
function SavingsGoal({ currency }) {
  const [target, setTarget]     = useState('');
  const [initial, setInitial]   = useState('');
  const [contrib, setContrib]   = useState('');
  const [contribFreq, setContribFreq] = useState(12);
  const [rate, setRate]         = useState('');
  const [result, setResult]     = useState(null);

  const calculate = () => {
    const G    = parseFloat(target);
    const P    = parseFloat(initial) || 0;
    const c    = parseFloat(contrib) || 0;
    const r    = parseFloat(rate) / 100;
    const cp   = contribFreq;  // contributions per year
    const rPer = r / 12;       // monthly interest rate

    if (isNaN(G) || G <= 0 || (c <= 0 && P <= 0)) return;

    // Already at or above goal
    if (P >= G) {
      setResult({ months: 0, years: 0, totalDeposited: P, totalInterest: 0, G });
      return;
    }

    // Monthly contribution amount regardless of frequency
    const monthlyContrib = c / (12 / cp);

    // If no interest and no contributions, can never reach goal
    if (monthlyContrib <= 0 && P < G) return;

    let bal    = P;
    let months = 0;
    const maxMonths = 600; // 50-year cap

    while (bal < G && months < maxMonths) {
      // Apply monthly interest (safe when rPer is 0)
      if (rPer > 0) bal = bal * (1 + rPer);
      // Add monthly contribution
      bal += monthlyContrib;
      months++;
    }

    const years          = months / 12;
    const totalDeposited = P + monthlyContrib * months;
    // Interest is whatever the balance grew beyond deposits
    const totalInterest  = Math.max(bal - totalDeposited, 0);

    setResult({ months, years, totalDeposited, totalInterest, G });
  };

  const reset = () => { setTarget(''); setInitial(''); setContrib(''); setRate(''); setResult(null); };

  return (
    <div className="tool-box">
      <h2 className="tool-box-title">How Long to Reach a Savings Goal?</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="sg-target">Savings Goal</label>
          <input id="sg-target" type="number" min="0" placeholder="e.g. 50000"
            value={target}
            onChange={e => { setTarget(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="sg-initial">Starting Amount</label>
          <input id="sg-initial" type="number" min="0" placeholder="e.g. 2000"
            value={initial}
            onChange={e => { setInitial(e.target.value); setResult(null); }} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="sg-contrib">Regular Contribution</label>
          <input id="sg-contrib" type="number" min="0" placeholder="e.g. 500"
            value={contrib}
            onChange={e => { setContrib(e.target.value); setResult(null); }} />
        </div>
        <div className="form-group" style={{ flex: 'none' }}>
          <label>Frequency</label>
          <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
            {FREQ_OPTIONS.filter(f => [12, 52, 1].includes(f.value)).map(f => (
              <button key={f.value}
                className={`tag${contribFreq === f.value ? ' active' : ''}`}
                onClick={() => { setContribFreq(f.value); setResult(null); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="sg-rate">Annual Interest Rate % <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input id="sg-rate" type="number" min="0" step="0.1" placeholder="0 for cash savings"
            value={rate}
            onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={!target || (!contrib && !initial)}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f172a, #134e4a)',
            borderRadius: 'var(--radius)',
            padding: '22px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                Time to reach {fmt(result.G, currency)}
              </div>
              <div style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {result.months === 0 ? 'Already there!' : `${result.months} ${result.months === 1 ? 'month' : 'months'}`}
              </div>
              {result.months > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                  {result.years.toFixed(1)} years
                </div>
              )}
          </div>

          {result.months > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
              <ResultRow label="Months to Goal"  value={`${result.months} ${result.months === 1 ? 'month' : 'months'}`} highlight />
              <ResultRow label="Years to Goal"   value={`${result.years.toFixed(1)} years`} />
              <ResultRow label="Total Deposited" value={fmt(result.totalDeposited, currency)} />
              {result.totalInterest > 0 && (
                <ResultRow label="Interest Earned" value={fmt(result.totalInterest, currency)} positive />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function SavingsCalculator() {
  const [currency, setCurrency] = useState('$');

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Savings Calculator</span>
          </div>
          <h1>Savings Calculator</h1>
          <p className="subtitle">
            Calculate your future savings balance with compound interest and regular deposits — or find out how long it takes to reach any savings goal.
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
        <FutureSavings currency={currency} />
        <SavingsGoal currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Savings Calculator</h2>
          <p>
            This savings calculator has two tools. The first projects your future savings balance
            based on an initial deposit, regular contributions, an interest rate, and a time
            period. It accounts for compound interest — the process by which interest earned is
            added back to the balance and begins earning its own interest. You can choose how
            often interest compounds (daily, weekly, monthly, quarterly, or annually) and how
            often you contribute (monthly, weekly, or annually). The year-by-year table shows
            exactly how your balance grows, and the bar chart splits your final balance between
            deposits and interest earned.
          </p>
          <p>
            The second tool answers the question most savers ask: how long will it take to reach
            a specific goal? Enter your target amount, starting balance, regular contribution,
            and interest rate — and the calculator works out the number of months and years to
            get there. This is useful for saving for a house deposit, emergency fund, car, holiday,
            or any other financial milestone.
          </p>
          <p>
            Even small regular contributions make a dramatic difference over time thanks to
            compounding. A $200 monthly deposit at 5% interest grows to over $83,000 in 20 years
            — nearly $35,000 of which is interest earned without any additional effort. Starting
            earlier and contributing consistently are the two most powerful levers in any savings
            plan. All calculations run instantly in your browser.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Savings Calculation Examples</h2>
          <p>
            <strong>Example 1 — Emergency fund:</strong> Starting with $1,000, saving $300/month
            at 4.5% interest compounded monthly for 2 years. Final balance ≈ $8,697.
            Interest earned ≈ $497.
          </p>
          <p>
            <strong>Example 2 — House deposit goal:</strong> Target $80,000. Starting amount $5,000,
            saving $800/month at 5% interest. Time to reach goal ≈ 7.5 years (90 months).
          </p>
          <p>
            <strong>Example 3 — Long-term savings:</strong> $10,000 initial deposit plus $500/month
            at 6% compounded monthly for 20 years. Final balance ≈ $349,340. Total deposited ≈
            $130,000. Interest earned ≈ $219,340 — more than the total amount deposited.
          </p>
          <p>
            <strong>Example 4 — Children's education fund:</strong> R2,000 initial with R1,500/month
            at 7% compounded monthly for 18 years. Final balance ≈ R734,900. Total deposited ≈
            R326,000. Interest ≈ R408,900 — the account more than doubles through interest alone.
          </p>
        </div>

        <RelatedTools currentId="savings-calculator" />
      </div>
    </div>
  );
}
