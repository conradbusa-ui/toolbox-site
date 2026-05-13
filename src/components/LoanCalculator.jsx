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

export default function LoanCalculator() {
  const [currency, setCurrency]     = useState('$');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm]     = useState('');
  const [termUnit, setTermUnit]     = useState('years');   // 'years' | 'months'
  const [result, setResult]         = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);

  const calculate = () => {
    const P = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const term = parseFloat(loanTerm);
    if (isNaN(P) || isNaN(annualRate) || isNaN(term) || P <= 0 || term <= 0) return;

    const n = termUnit === 'years' ? term * 12 : term; // total months
    const r = annualRate / 100 / 12; // monthly rate

    let monthlyPayment;
    let totalInterest;
    let totalPayment;

    if (r === 0) {
      // 0% interest
      monthlyPayment = P / n;
      totalInterest  = 0;
      totalPayment   = P;
    } else {
      monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalPayment   = monthlyPayment * n;
      totalInterest  = totalPayment - P;
    }

    // Amortisation schedule
    const schedule = [];
    let balance = P;
    for (let i = 1; i <= n; i++) {
      const interestPayment  = balance * r;
      const principalPayment = monthlyPayment - interestPayment;
      balance = Math.max(balance - principalPayment, 0);
      schedule.push({
        month: i,
        payment:   monthlyPayment,
        principal: principalPayment,
        interest:  interestPayment,
        balance,
      });
    }

    setResult({
      P, annualRate, n, monthlyPayment, totalPayment, totalInterest, schedule,
      termYears: termUnit === 'years' ? term : (term / 12).toFixed(1),
    });
    setShowFullTable(false);
  };

  const reset = () => {
    setLoanAmount(''); setInterestRate(''); setLoanTerm('');
    setResult(null); setShowFullTable(false);
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
            <span>Loan Calculator</span>
          </div>
          <h1>Loan Calculator</h1>
          <p className="subtitle">
            Calculate your monthly repayment, total interest, and full amortisation schedule for any loan.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Loan Repayments</h2>

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

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="loan-amount">Loan Amount</label>
              <input
                id="loan-amount"
                type="number"
                min="0"
                placeholder="e.g. 250000"
                value={loanAmount}
                onChange={e => { setLoanAmount(e.target.value); setResult(null); }}
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
                placeholder="e.g. 6.5"
                value={interestRate}
                onChange={e => { setInterestRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="loan-term">Loan Term</label>
              <input
                id="loan-term"
                type="number"
                min="1"
                placeholder={termUnit === 'years' ? 'e.g. 30' : 'e.g. 360'}
                value={loanTerm}
                onChange={e => { setLoanTerm(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 'none', minWidth: '120px' }}>
              <label>Term Unit</label>
              <div className="tag-row" style={{ marginBottom: 0, marginTop: '6px' }}>
                <button className={`tag${termUnit === 'years' ? ' active' : ''}`}
                  onClick={() => { setTermUnit('years'); setResult(null); }}>Years</button>
                <button className={`tag${termUnit === 'months' ? ' active' : ''}`}
                  onClick={() => { setTermUnit('months'); setResult(null); }}>Months</button>
              </div>
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={!loanAmount || !interestRate || !loanTerm}>
              Calculate
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Key results */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '20px' }}>
                <ResultRow label="Monthly Payment"   value={fmt(result.monthlyPayment, currency)} highlight />
                <ResultRow label="Total Principal"   value={fmt(result.P, currency)} />
                <ResultRow label="Total Interest"    value={fmt(result.totalInterest, currency)} />
                <ResultRow label="Total Repayment"   value={fmt(result.totalPayment, currency)} />
              </div>

              {/* Visual split */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Principal vs Interest
                </p>
                <div style={{ height: '18px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                  <div style={{
                    width: `${(result.P / result.totalPayment) * 100}%`,
                    background: 'var(--accent)',
                    transition: 'width 0.4s ease',
                  }} />
                  <div style={{
                    flex: 1,
                    background: '#f97316',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                    Principal {((result.P / result.totalPayment) * 100).toFixed(1)}%
                  </span>
                  <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                    Interest {((result.totalInterest / result.totalPayment) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Summary stats */}
              <div className="result-grid" style={{ marginBottom: '24px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.n}</div>
                  <div className="stat-label">Payments</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.annualRate}%</div>
                  <div className="stat-label">Annual Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>
                    {fmt(result.totalInterest, currency)}
                  </div>
                  <div className="stat-label">Total Interest</div>
                </div>
              </div>

              {/* Amortisation table */}
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Amortisation Schedule {!showFullTable && result.schedule.length > 12 ? `(First 12 of ${result.schedule.length} months)` : ''}
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
              </div>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How Does a Loan Calculator Work?</h2>
          <p>
            A loan calculator uses the standard amortisation formula to work out your fixed monthly repayment
            based on three inputs: the loan amount (principal), the annual interest rate, and the loan term.
            Each monthly payment covers the interest due on the remaining balance plus a portion of the
            principal. In the early months most of your payment goes toward interest; as the balance falls,
            more of each payment chips away at the principal.
          </p>
          <p>
            This calculator shows your monthly repayment instantly, along with the total amount you'll pay
            over the life of the loan and the total interest cost — so you can see exactly what borrowing
            will cost you overall, not just month to month. The principal versus interest bar gives you a
            quick visual breakdown of where your money goes.
          </p>
          <p>
            The full amortisation schedule lists every monthly payment, showing how much goes to principal
            and interest each month and what your outstanding balance is after each payment. Use it for home
            loans, car loans, personal loans, or any fixed-rate instalment agreement. Adjust the term unit
            between years and months for flexibility. All calculations run in your browser — nothing is stored
            or submitted anywhere.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Loan Calculation Examples</h2>
          <p>
            <strong>Example 1 — Home loan:</strong> $300,000 at 6.5% over 30 years.
            Monthly payment ≈ $1,896. Total repayment ≈ $682,633. Total interest ≈ $382,633.
          </p>
          <p>
            <strong>Example 2 — Car loan:</strong> $25,000 at 9% over 5 years.
            Monthly payment ≈ $519. Total repayment ≈ $31,141. Total interest ≈ $6,141.
          </p>
          <p>
            <strong>Example 3 — Personal loan:</strong> R50,000 at 14% over 3 years.
            Monthly payment ≈ R1,709. Total repayment ≈ R61,536. Total interest ≈ R11,536.
          </p>
          <p>
            <strong>Example 4 — Effect of term length:</strong> $100,000 at 7%.
            Over 15 years: monthly ≈ $899, total interest ≈ $61,789.
            Over 30 years: monthly ≈ $665, total interest ≈ $139,508. Doubling the term nearly doubles the interest paid.
          </p>
        </div>

        <RelatedTools currentId="loan-calculator" />
      </div>
    </div>
  );
}
