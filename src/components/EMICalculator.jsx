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
        color: highlight ? 'var(--accent)' : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function EMICalculator() {
  const [currency, setCurrency]       = useState('₹');
  const [loanAmount, setLoanAmount]   = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure]           = useState('');
  const [tenureType, setTenureType]   = useState('months'); // months | years
  const [result, setResult]           = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);

  const LOAN_TYPES = [
    { label: 'Home Loan',     rate: '8.5',  tenure: '240', type: 'months' },
    { label: 'Car Loan',      rate: '10.5', tenure: '60',  type: 'months' },
    { label: 'Personal Loan', rate: '14',   tenure: '36',  type: 'months' },
    { label: 'Education Loan',rate: '9',    tenure: '84',  type: 'months' },
  ];

  const applyPreset = (preset) => {
    setInterestRate(preset.rate);
    setTenure(preset.tenure);
    setTenureType(preset.type);
    setResult(null);
  };

  const calculate = () => {
    const P = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const t = parseFloat(tenure);
    if (isNaN(P) || isNaN(annualRate) || isNaN(t) || P <= 0 || t <= 0) return;

    const n = tenureType === 'years' ? t * 12 : t;
    const r = annualRate / 100 / 12;

    let emi, totalPayment, totalInterest;

    if (r === 0) {
      emi = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - P;
    }

    // Amortisation schedule
    const schedule = [];
    let balance = P;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    for (let i = 1; i <= n; i++) {
      const interestPmt  = balance * r;
      const principalPmt = emi - interestPmt;
      cumulativeInterest += interestPmt;
      cumulativePrincipal += principalPmt;
      balance = Math.max(balance - principalPmt, 0);
      schedule.push({
        month: i,
        emi,
        principal: principalPmt,
        interest: interestPmt,
        balance,
        cumulativeInterest,
        cumulativePrincipal,
      });
    }

    setResult({ P, annualRate, n, emi, totalPayment, totalInterest, schedule });
    setShowFullTable(false);
  };

  const reset = () => {
    setLoanAmount(''); setInterestRate(''); setTenure('');
    setResult(null); setShowFullTable(false);
  };

  const displayedRows = result
    ? (showFullTable ? result.schedule : result.schedule.slice(0, 12))
    : [];

  const principalPct  = result ? ((result.P / result.totalPayment) * 100).toFixed(1) : 0;
  const interestPct   = result ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1) : 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>EMI Calculator</span>
          </div>
          <h1>EMI Calculator</h1>
          <p className="subtitle">
            Calculate your Equated Monthly Instalment for any loan — home, car, personal, or education — with a full amortisation schedule.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Your EMI</h2>

          {/* Currency */}
          <div style={{ marginBottom: '16px' }}>
            <label>Currency</label>
            <div className="tag-row">
              {CURRENCIES.map(c => (
                <button key={c} className={`tag${currency === c ? ' active' : ''}`}
                  onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Loan type presets */}
          <div style={{ marginBottom: '18px' }}>
            <label>Quick Presets</label>
            <div className="tag-row">
              {LOAN_TYPES.map(p => (
                <button key={p.label} className="tag" onClick={() => applyPreset(p)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="emi-amount">Loan Amount</label>
              <input
                id="emi-amount"
                type="number"
                min="0"
                placeholder="e.g. 500000"
                value={loanAmount}
                onChange={e => { setLoanAmount(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="emi-rate">Annual Interest Rate %</label>
              <input
                id="emi-rate"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 8.5"
                value={interestRate}
                onChange={e => { setInterestRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="emi-tenure">Loan Tenure</label>
              <input
                id="emi-tenure"
                type="number"
                min="1"
                placeholder={tenureType === 'years' ? 'e.g. 20' : 'e.g. 240'}
                value={tenure}
                onChange={e => { setTenure(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 'none', minWidth: '130px' }}>
              <label>Tenure Unit</label>
              <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
                <button className={`tag${tenureType === 'months' ? ' active' : ''}`}
                  onClick={() => { setTenureType('months'); setResult(null); }}>Months</button>
                <button className={`tag${tenureType === 'years' ? ' active' : ''}`}
                  onClick={() => { setTenureType('years'); setResult(null); }}>Years</button>
              </div>
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={!loanAmount || !interestRate || !tenure}>
              Calculate EMI
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Hero EMI */}
              <div style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                  Monthly EMI
                </div>
                <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {fmt(result.emi, currency)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                  per month for {result.n} months
                </div>
              </div>

              {/* Key results */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
                <ResultRow label="Loan Amount (Principal)" value={fmt(result.P, currency)} />
                <ResultRow label="Total Interest Payable"  value={fmt(result.totalInterest, currency)} />
                <ResultRow label="Total Amount Payable"    value={fmt(result.totalPayment, currency)} highlight />
              </div>

              {/* Visual bar */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Principal vs Interest
                </p>
                <div style={{ height: '16px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: `${principalPct}%`, background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                  <div style={{ flex: 1, background: '#f97316' }} />
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  <span>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                    Principal {principalPct}%
                  </span>
                  <span>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                    Interest {interestPct}%
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="result-grid" style={{ marginBottom: '24px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.n}</div>
                  <div className="stat-label">Total EMIs</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.annualRate}%</div>
                  <div className="stat-label">Annual Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.totalInterest, currency)}</div>
                  <div className="stat-label">Total Interest</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.totalPayment, currency)}</div>
                  <div className="stat-label">Total Payable</div>
                </div>
              </div>

              {/* Amortisation table */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                Amortisation Schedule
                {!showFullTable && result.schedule.length > 12
                  ? ` (First 12 of ${result.schedule.length} months)`
                  : ''}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map(row => (
                      <tr key={row.month} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>{row.month}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.emi, currency)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmt(row.principal, currency)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmt(row.interest, currency)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(row.balance, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.schedule.length > 12 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => setShowFullTable(v => !v)}
                >
                  {showFullTable ? 'Show less ▲' : `Show all ${result.schedule.length} months ▼`}
                </button>
              )}

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '16px', lineHeight: 1.5 }}>
                ⚠ EMI figures are estimates based on a fixed interest rate. Actual repayments may vary depending on your lender's terms, processing fees, prepayment charges, and any rate changes on floating-rate loans. Always confirm with your lender before committing.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>What Is an EMI and How Is It Calculated?</h2>
          <p>
            EMI stands for Equated Monthly Instalment — the fixed amount you pay to your lender every
            month until your loan is fully repaid. Each EMI has two components: a portion that goes toward
            repaying the principal (the original loan amount) and a portion that covers the interest charged
            on the outstanding balance. In the early months, most of your EMI goes toward interest. As the
            balance reduces over time, the interest portion shrinks and the principal portion grows — this
            is called an amortising loan structure.
          </p>
          <p>
            The EMI formula is: EMI = P × r × (1 + r)ⁿ ÷ [(1 + r)ⁿ − 1], where P is the principal,
            r is the monthly interest rate (annual rate ÷ 12), and n is the total number of monthly
            instalments. This calculator applies that formula instantly and generates a full month-by-month
            amortisation schedule so you can see exactly how your balance reduces with each payment.
          </p>
          <p>
            Use the quick presets to load typical rates and tenures for home loans, car loans, personal
            loans, and education loans. Adjust the tenure to see how a longer or shorter repayment period
            affects your monthly EMI and total interest cost — a longer tenure means a lower EMI but
            significantly more interest paid overall. All calculations run instantly in your browser.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>EMI Calculation Examples</h2>
          <p>
            <strong>Example 1 — Home Loan:</strong> ₹50,00,000 at 8.5% for 20 years (240 months).
            Monthly EMI ≈ ₹43,391. Total interest ≈ ₹54,13,832. Total payable ≈ ₹1,04,13,832.
          </p>
          <p>
            <strong>Example 2 — Car Loan:</strong> ₹8,00,000 at 10.5% for 5 years (60 months).
            Monthly EMI ≈ ₹17,199. Total interest ≈ ₹2,31,940. Total payable ≈ ₹10,31,940.
          </p>
          <p>
            <strong>Example 3 — Personal Loan:</strong> ₹3,00,000 at 14% for 3 years (36 months).
            Monthly EMI ≈ ₹10,253. Total interest ≈ ₹69,108. Total payable ≈ ₹3,69,108.
          </p>
          <p>
            <strong>Example 4 — Effect of tenure:</strong> ₹10,00,000 at 9%.
            Over 10 years: EMI ≈ ₹12,668, total interest ≈ ₹5,20,160.
            Over 20 years: EMI ≈ ₹8,997, total interest ≈ ₹11,59,280.
            Doubling the tenure cuts the EMI by 29% but more than doubles the interest paid.
          </p>
        </div>

        <RelatedTools currentId="emi-calculator" />
      </div>
    </div>
  );
}
