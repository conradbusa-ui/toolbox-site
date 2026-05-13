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

function fmtShort(n, currency) {
  if (n >= 1000000) return currency + (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000)    return currency + (n / 1000).toFixed(1) + 'K';
  return fmt(n, currency);
}

function ResultRow({ label, value, highlight, muted, sub }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: sub ? '7px 0 7px 16px' : '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: sub ? '0.82rem' : '0.9rem', color: muted ? 'var(--text-3)' : 'var(--text-2)' }}>
        {label}
      </span>
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

function BarSegment({ pct, color, label, value }) {
  return (
    <div style={{ flex: pct, background: color, minWidth: pct > 0 ? '4px' : 0 }} title={`${label}: ${value}`} />
  );
}

export default function MortgageCalculator() {
  const [currency, setCurrency]       = useState('$');
  const [homePrice, setHomePrice]     = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [downType, setDownType]       = useState('amount');   // 'amount' | 'percent'
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm]       = useState('30');
  const [propertyTax, setPropertyTax] = useState('');
  const [homeInsurance, setHomeInsurance] = useState('');
  const [pmi, setPmi]                 = useState('');
  const [hoa, setHoa]                 = useState('');
  const [result, setResult]           = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);

  const TERMS = ['10', '15', '20', '25', '30'];

  const calculate = () => {
    const price   = parseFloat(homePrice);
    const rate    = parseFloat(interestRate);
    const term    = parseInt(loanTerm);
    if (isNaN(price) || isNaN(rate) || price <= 0) return;

    // Down payment
    let dp;
    if (downType === 'percent') {
      dp = price * ((parseFloat(downPayment) || 0) / 100);
    } else {
      dp = parseFloat(downPayment) || 0;
    }
    dp = Math.min(dp, price);
    const dpPct   = (dp / price) * 100;

    const principal = price - dp;
    const n  = term * 12;
    const r  = rate / 100 / 12;

    // Monthly P&I
    let pi;
    if (r === 0) {
      pi = principal / n;
    } else {
      pi = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    // Monthly extras
    const monthlyTax  = (parseFloat(propertyTax)    || 0) / 12;
    const monthlyIns  = (parseFloat(homeInsurance)   || 0) / 12;
    const monthlyPmi  = dpPct < 20 ? (parseFloat(pmi) || 0) / 12 : 0;
    const monthlyHoa  = parseFloat(hoa) || 0;

    const totalMonthly = pi + monthlyTax + monthlyIns + monthlyPmi + monthlyHoa;

    const totalPayment  = pi * n;
    const totalInterest = totalPayment - principal;

    // Amortisation schedule
    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= n; i++) {
      const intPmt  = balance * r;
      const prinPmt = pi - intPmt;
      balance = Math.max(balance - prinPmt, 0);
      schedule.push({ month: i, payment: pi, principal: prinPmt, interest: intPmt, balance });
    }

    setResult({
      price, dp, dpPct, principal, rate, term, n,
      pi, monthlyTax, monthlyIns, monthlyPmi, monthlyHoa,
      totalMonthly, totalPayment, totalInterest,
      schedule, dpPct,
    });
    setShowFullTable(false);
  };

  const reset = () => {
    setHomePrice(''); setDownPayment(''); setInterestRate('');
    setLoanTerm('30'); setPropertyTax(''); setHomeInsurance('');
    setPmi(''); setHoa(''); setResult(null); setShowFullTable(false);
  };

  const displayedRows = result
    ? (showFullTable ? result.schedule : result.schedule.slice(0, 12))
    : [];

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Mortgage Calculator</span>
          </div>
          <h1>Mortgage Calculator</h1>
          <p className="subtitle">
            Calculate your monthly mortgage payment including principal, interest, taxes, insurance, PMI, and HOA fees.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Your Mortgage Payment</h2>

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
            Loan Details
          </p>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="home-price">Home Price</label>
              <input
                id="home-price"
                type="number"
                min="0"
                placeholder="e.g. 400000"
                value={homePrice}
                onChange={e => { setHomePrice(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="down-payment">
                Down Payment
                <span style={{ marginLeft: '8px' }}>
                  <button
                    className={`tag${downType === 'amount' ? ' active' : ''}`}
                    style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    onClick={() => setDownType('amount')}
                  >{currency}</button>
                  <button
                    className={`tag${downType === 'percent' ? ' active' : ''}`}
                    style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    onClick={() => setDownType('percent')}
                  >%</button>
                </span>
              </label>
              <input
                id="down-payment"
                type="number"
                min="0"
                placeholder={downType === 'percent' ? 'e.g. 20' : 'e.g. 80000'}
                value={downPayment}
                onChange={e => { setDownPayment(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="interest-rate">Annual Interest Rate %</label>
              <input
                id="interest-rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 6.75"
                value={interestRate}
                onChange={e => { setInterestRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group">
              <label>Loan Term</label>
              <div className="tag-row" style={{ marginTop: '6px', marginBottom: 0, flexWrap: 'wrap' }}>
                {TERMS.map(t => (
                  <button
                    key={t}
                    className={`tag${loanTerm === t ? ' active' : ''}`}
                    onClick={() => { setLoanTerm(t); setResult(null); }}
                  >
                    {t} yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional extras */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Optional Monthly / Annual Costs
          </p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prop-tax">Property Tax (annual)</label>
              <input
                id="prop-tax"
                type="number"
                min="0"
                placeholder="e.g. 4800"
                value={propertyTax}
                onChange={e => { setPropertyTax(e.target.value); setResult(null); }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="home-ins">Home Insurance (annual)</label>
              <input
                id="home-ins"
                type="number"
                min="0"
                placeholder="e.g. 1200"
                value={homeInsurance}
                onChange={e => { setHomeInsurance(e.target.value); setResult(null); }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pmi-field">PMI (annual) {result && result.dpPct >= 20 && <span style={{ color: 'var(--accent)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— not needed</span>}</label>
              <input
                id="pmi-field"
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={pmi}
                onChange={e => { setPmi(e.target.value); setResult(null); }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="hoa-field">HOA Fee (monthly)</label>
              <input
                id="hoa-field"
                type="number"
                min="0"
                placeholder="e.g. 250"
                value={hoa}
                onChange={e => { setHoa(e.target.value); setResult(null); }}
              />
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={!homePrice || !interestRate}>
              Calculate Mortgage
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Hero monthly number */}
              <div style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                  Total Monthly Payment
                </div>
                <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {fmt(result.totalMonthly, currency)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                  per month for {result.term} years
                </div>
              </div>

              {/* Payment breakdown */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                Monthly Breakdown
              </p>

              {/* Stacked bar */}
              <div style={{ height: '16px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
                <BarSegment pct={result.pi}           color="#0d9488" label="Principal & Interest" value={fmt(result.pi, currency)} />
                <BarSegment pct={result.monthlyTax}   color="#7c3aed" label="Property Tax"         value={fmt(result.monthlyTax, currency)} />
                <BarSegment pct={result.monthlyIns}   color="#0891b2" label="Home Insurance"       value={fmt(result.monthlyIns, currency)} />
                <BarSegment pct={result.monthlyPmi}   color="#f59e0b" label="PMI"                  value={fmt(result.monthlyPmi, currency)} />
                <BarSegment pct={result.monthlyHoa}   color="#db2777" label="HOA"                  value={fmt(result.monthlyHoa, currency)} />
              </div>

              <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                <ResultRow label="Principal & Interest" value={fmt(result.pi, currency)} highlight />
                {result.monthlyTax  > 0 && <ResultRow label="Property Tax (monthly)"  value={fmt(result.monthlyTax, currency)}  sub />}
                {result.monthlyIns  > 0 && <ResultRow label="Home Insurance (monthly)" value={fmt(result.monthlyIns, currency)} sub />}
                {result.monthlyPmi  > 0 && <ResultRow label="PMI (monthly)"            value={fmt(result.monthlyPmi, currency)} sub />}
                {result.monthlyHoa  > 0 && <ResultRow label="HOA Fee (monthly)"        value={fmt(result.monthlyHoa, currency)} sub />}
              </div>

              {/* Loan summary */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                Loan Summary
              </p>
              <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                <ResultRow label="Home Price"     value={fmt(result.price, currency)} />
                <ResultRow label={`Down Payment (${result.dpPct.toFixed(1)}%)`} value={fmt(result.dp, currency)} />
                <ResultRow label="Loan Amount"    value={fmt(result.principal, currency)} />
                <ResultRow label="Total Interest" value={fmt(result.totalInterest, currency)} />
                <ResultRow label="Total Cost"     value={fmt(result.price - result.dp + result.totalInterest, currency)} />
              </div>

              {/* Stats grid */}
              <div className="result-grid" style={{ marginBottom: '24px' }}>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.principal, currency)}</div>
                  <div className="stat-label">Loan Amount</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.rate}%</div>
                  <div className="stat-label">Interest Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.n}</div>
                  <div className="stat-label">Payments</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmtShort(result.totalInterest, currency)}</div>
                  <div className="stat-label">Total Interest</div>
                </div>
              </div>

              {/* PMI warning */}
              {result.dpPct < 20 && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  color: '#92400e',
                  marginBottom: '20px',
                }}>
                  ⚠ Your down payment is under 20% ({result.dpPct.toFixed(1)}%). Lenders typically require
                  Private Mortgage Insurance (PMI) until you reach 20% equity. Enter your estimated annual
                  PMI cost above to include it in your monthly total.
                </div>
              )}

              {/* Amortisation table */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                Amortisation Schedule {!showFullTable && result.schedule.length > 12
                  ? `(First 12 of ${result.schedule.length} months)`
                  : ''}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map(row => (
                      <tr key={row.month} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>{row.month}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.payment, currency)}</td>
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
                ⚠ This calculator provides estimates only. Actual mortgage payments depend on your lender,
                credit score, local tax rates, and other factors. Always confirm figures with a qualified
                mortgage adviser before making financial decisions.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Calculate Your Monthly Mortgage Payment</h2>
          <p>
            A mortgage payment has several components, often referred to as PITI — Principal, Interest,
            Taxes, and Insurance. The principal and interest portion is calculated using the standard
            amortisation formula: your loan amount, interest rate, and term determine a fixed monthly
            payment that stays constant for the life of the loan. In the early years, most of each payment
            covers interest; as the balance falls, more goes toward reducing the principal.
          </p>
          <p>
            Property tax, home insurance, PMI, and HOA fees are added on top of the principal and interest
            payment to give your true monthly housing cost. Private Mortgage Insurance (PMI) is typically
            required when your down payment is less than 20% of the purchase price and is removed
            automatically once you reach 20% equity. HOA fees apply in managed communities and can vary
            significantly.
          </p>
          <p>
            This mortgage calculator lets you enter all of these components to see your complete monthly
            obligation, not just the loan repayment. The full amortisation schedule shows every monthly
            payment across the loan term so you can see exactly when your balance drops below key
            milestones. Adjust the loan term between 10, 15, 20, 25, and 30 years to compare how the term
            affects your monthly payment and total interest cost.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Mortgage Calculation Examples</h2>
          <p>
            <strong>Example 1 — 30-year fixed:</strong> Home price $400,000 with 20% down ($80,000).
            Loan = $320,000 at 6.75% over 30 years. Monthly P&amp;I ≈ $2,076.
            Total interest over 30 years ≈ $427,384.
          </p>
          <p>
            <strong>Example 2 — 15-year fixed (same loan):</strong> $320,000 at 6.5% over 15 years.
            Monthly P&amp;I ≈ $2,790. Total interest ≈ $182,165 — saving over $245,000 in interest
            compared to the 30-year option, at the cost of a higher monthly payment.
          </p>
          <p>
            <strong>Example 3 — Low down payment with PMI:</strong> Home price $300,000 with 5% down
            ($15,000). Loan = $285,000 at 7% over 30 years. Monthly P&amp;I ≈ $1,897. Add $2,400/yr
            property tax ($200/mo), $1,200/yr insurance ($100/mo), and $2,850/yr PMI ($237.50/mo).
            Total monthly payment ≈ $2,434.
          </p>
          <p>
            <strong>Example 4 — Rand-denominated bond:</strong> Property price R1,500,000 with 10% down
            (R150,000). Bond = R1,350,000 at 11.75% over 20 years. Monthly repayment ≈ R15,243.
          </p>
        </div>

        <RelatedTools currentId="mortgage-calculator" />
      </div>
    </div>
  );
}
