import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculations ─────────────────────────────────────────

// Monthly payment: P×r×(1+r)^n / ((1+r)^n - 1)
function calcMonthlyPayment(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

// Total cost of loan
function calcTotalCost(monthly, months) { return monthly * months; }

// Total interest
function calcTotalInterest(totalCost, principal) { return totalCost - principal; }

// Loan amount after down payment and trade-in
function calcLoanAmount(vehiclePrice, downPayment, tradeIn, salesTax, fees) {
  const taxable = Math.max(0, vehiclePrice - tradeIn);
  const taxAmount = taxable * salesTax / 100;
  return Math.max(0, vehiclePrice - downPayment - tradeIn + taxAmount + fees);
}

// Full amortisation schedule
function calcAmortisation(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  const monthly = calcMonthlyPayment(principal, annualRate, months);
  const rows = [];
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest  = balance * r;
    const principalPaid = monthly - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month: m, payment: monthly, interest, principalPaid, balance });
  }
  return rows;
}

// Estimated depreciation (rough guide)
function estimateDepreciation(vehiclePrice, years) {
  // Year 1: ~20%, Year 2-5: ~15% each, after 5: ~10% each
  let val = vehiclePrice;
  for (let y = 1; y <= years; y++) {
    const rate = y === 1 ? 0.20 : y <= 5 ? 0.15 : 0.10;
    val *= (1 - rate);
  }
  return val;
}

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

function fmtCurrency(n, symbol = '$') {
  if (!isFinite(n) || isNaN(n)) return '—';
  return `${symbol}${parseFloat(n.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Shared UI ─────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginTop: '26px', marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px',
      textAlign: 'center', flex: '1 1 130px', minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: 'clamp(1rem,2.8vw,1.55rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Cost breakdown bar ────────────────────────────────────────

function CostBreakdown({ principal, totalInterest, fees, symbol }) {
  const total = principal + totalInterest + fees;
  const pPct  = (principal / total) * 100;
  const iPct  = (totalInterest / total) * 100;
  const fPct  = (fees / total) * 100;

  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ height: '12px', borderRadius: '99px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
        <div style={{ width: `${pPct}%`, background: 'var(--accent)', transition: 'width 0.4s' }} />
        <div style={{ width: `${iPct}%`, background: '#dc2626', transition: 'width 0.4s' }} />
        {fPct > 0 && <div style={{ width: `${fPct}%`, background: '#f59e0b', transition: 'width 0.4s' }} />}
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-3)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', borderRadius: 2, marginRight: 4 }} />Vehicle ({fmt(pPct, 1)}%)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#dc2626', borderRadius: 2, marginRight: 4 }} />Interest ({fmt(iPct, 1)}%)</span>
        {fPct > 0 && <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', borderRadius: 2, marginRight: 4 }} />Fees ({fmt(fPct, 1)}%)</span>}
      </div>
    </div>
  );
}

// ── Amortisation table ────────────────────────────────────────

function AmortTable({ rows, symbol, showAll, setShowAll }) {
  const display = showAll ? rows : rows.slice(0, 12);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr key={row.month} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{row.month}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtCurrency(row.payment, symbol)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{fmtCurrency(row.principalPaid, symbol)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: '#dc2626' }}>{fmtCurrency(row.interest, symbol)}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{fmtCurrency(row.balance, symbol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}
          onClick={() => setShowAll(v => !v)}>
          {showAll ? `▲ Show first 12 months` : `▼ Show all ${rows.length} months`}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

const TERM_OPTIONS = [
  { months: 24,  label: '24 mo (2 yr)' },
  { months: 36,  label: '36 mo (3 yr)' },
  { months: 48,  label: '48 mo (4 yr)' },
  { months: 60,  label: '60 mo (5 yr)' },
  { months: 72,  label: '72 mo (6 yr)' },
  { months: 84,  label: '84 mo (7 yr)' },
];

const CURRENCY_SYMBOLS = ['$', '£', '€', 'A$', 'C$', 'R', '₹'];

export default function AutoLoanCalculator() {
  // Inputs
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [downPayment,  setDownPayment]  = useState('');
  const [tradeIn,      setTradeIn]      = useState('');
  const [loanTerm,     setLoanTerm]     = useState('60');
  const [interestRate, setInterestRate] = useState('');
  const [salesTax,     setSalesTax]     = useState('');
  const [fees,         setFees]         = useState('');
  const [currency,     setCurrency]     = useState('$');

  // Results
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [showAmort, setShowAmort] = useState(false);
  const [showAll,   setShowAll]   = useState(false);
  const [toast,     setToast]     = useState('');

  // Live loan amount preview
  const liveLoan = (() => {
    const vp = parseFloat(vehiclePrice) || 0;
    const dp = parseFloat(downPayment)  || 0;
    const ti = parseFloat(tradeIn)      || 0;
    const st = parseFloat(salesTax)     || 0;
    const fe = parseFloat(fees)         || 0;
    if (vp <= 0) return null;
    return calcLoanAmount(vp, dp, ti, st, fe);
  })();

  function calculate() {
    const vp = parseFloat(vehiclePrice);
    const dp = parseFloat(downPayment)  || 0;
    const ti = parseFloat(tradeIn)      || 0;
    const ir = parseFloat(interestRate);
    const st = parseFloat(salesTax)     || 0;
    const fe = parseFloat(fees)         || 0;
    const months = parseInt(loanTerm)   || 60;

    if (isNaN(vp) || vp <= 0) { setError('Enter a valid vehicle price.'); setResult(null); return; }
    if (isNaN(ir) || ir < 0 || ir > 100) { setError('Enter a valid interest rate (0–100%).'); setResult(null); return; }

    const loanAmt    = calcLoanAmount(vp, dp, ti, st, fe);
    if (loanAmt <= 0) { setError('Loan amount is 0 or negative. Check your down payment and trade-in values.'); setResult(null); return; }

    const monthly    = calcMonthlyPayment(loanAmt, ir, months);
    const totalCost  = calcTotalCost(monthly, months);
    const totalInt   = calcTotalInterest(totalCost, loanAmt);
    const amort      = calcAmortisation(loanAmt, ir, months);

    // Ownership cost estimate
    const loanYears   = months / 12;
    const depreciated = estimateDepreciation(vp, loanYears);
    const depLoss     = vp - depreciated;

    setResult({
      vp, dp, ti, ir, st, fe, months, loanAmt,
      monthly, totalCost, totalInt,
      amort, depreciated, depLoss, currency,
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Vehicle price: ${fmtCurrency(result.vp, result.currency)}`,
      `Loan amount: ${fmtCurrency(result.loanAmt, result.currency)}`,
      `Monthly payment: ${fmtCurrency(result.monthly, result.currency)}`,
      `Total interest: ${fmtCurrency(result.totalInt, result.currency)}`,
      `Total cost: ${fmtCurrency(result.totalCost + result.dp, result.currency)}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Auto Loan Calculator</span>
          </div>
          <h1>Auto Loan Calculator</h1>
          <p className="subtitle">
            Calculate your monthly car payment, total interest, and full amortisation schedule — including down payment, trade-in value, sales tax, and dealer fees.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">

          {/* Currency */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {CURRENCY_SYMBOLS.map(s => (
              <button key={s} className={`tag${currency === s ? ' active' : ''}`}
                style={{ minWidth: '38px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
                onClick={() => { setCurrency(s); setResult(null); }}>
                {s}
              </button>
            ))}
          </div>

          {/* Core inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle price ({currency})</label>
              <input type="number" value={vehiclePrice} min="0" step="100"
                onChange={e => { setVehiclePrice(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 35000"
                style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
            </div>
            <div className="form-group">
              <label>Interest rate (% p.a.)</label>
              <input type="number" value={interestRate} min="0" max="100" step="0.1"
                onChange={e => { setInterestRate(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder="e.g. 6.5"
                style={{ fontFamily: 'var(--mono)' }} />
            </div>
          </div>

          {/* Loan term */}
          <div className="form-group">
            <label>Loan term</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TERM_OPTIONS.map(t => (
                <button key={t.months}
                  className={`tag${loanTerm === String(t.months) ? ' active' : ''}`}
                  onClick={() => { setLoanTerm(String(t.months)); setResult(null); }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional inputs */}
          <div className="form-row">
            <div className="form-group">
              <label>Down payment ({currency}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
              <input type="number" value={downPayment} min="0" step="100"
                onChange={e => { setDownPayment(e.target.value); setResult(null); setError(''); }}
                placeholder="e.g. 5000"
                style={{ fontFamily: 'var(--mono)' }} />
            </div>
            <div className="form-group">
              <label>Trade-in value ({currency}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
              <input type="number" value={tradeIn} min="0" step="100"
                onChange={e => { setTradeIn(e.target.value); setResult(null); setError(''); }}
                placeholder="e.g. 8000"
                style={{ fontFamily: 'var(--mono)' }} />
            </div>
            <div className="form-group">
              <label>Sales tax (%) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
              <input type="number" value={salesTax} min="0" max="20" step="0.1"
                onChange={e => { setSalesTax(e.target.value); setResult(null); setError(''); }}
                placeholder="e.g. 8.5"
                style={{ fontFamily: 'var(--mono)' }} />
            </div>
            <div className="form-group">
              <label>Dealer / title fees ({currency}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
              <input type="number" value={fees} min="0" step="50"
                onChange={e => { setFees(e.target.value); setResult(null); setError(''); }}
                placeholder="e.g. 1500"
                style={{ fontFamily: 'var(--mono)' }} />
            </div>
          </div>

          {/* Live loan amount preview */}
          {liveLoan !== null && liveLoan > 0 && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '4px', fontWeight: 600 }}>
              Loan amount: <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{fmtCurrency(liveLoan, currency)}</span>
            </div>
          )}

          <div className="btn-group">
            <button className="btn btn-primary" onClick={calculate}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => {
              setVehiclePrice(''); setDownPayment(''); setTradeIn('');
              setInterestRate(''); setSalesTax(''); setFees('');
              setLoanTerm('60'); setResult(null); setError('');
            }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '28px' }}>

              {/* Monthly payment banner */}
              <div style={{
                background: 'var(--accent-light)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                  Monthly payment
                </div>
                <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmtCurrency(result.monthly, result.currency)}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
                  {result.months} monthly payments &nbsp;·&nbsp; {fmt(result.ir)}% APR
                </div>
              </div>

              {/* Key stats */}
              <SectionTitle>Loan summary</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Loan amount"    value={fmtCurrency(result.loanAmt, result.currency)}  sub="financed" />
                <StatCard accent label="Monthly payment" value={fmtCurrency(result.monthly, result.currency)} />
                <StatCard label="Total interest" value={fmtCurrency(result.totalInt, result.currency)}  color="#dc2626" sub={`${fmt((result.totalInt / result.loanAmt) * 100, 1)}% of loan`} />
                <StatCard label="Total paid"     value={fmtCurrency(result.totalCost, result.currency)} sub="over loan life" />
              </div>

              {/* Full cost of ownership */}
              <SectionTitle>Full cost of ownership (loan period)</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Down payment"  value={fmtCurrency(result.dp, result.currency)} sub="paid upfront" />
                <StatCard label="Trade-in"      value={result.ti > 0 ? fmtCurrency(result.ti, result.currency) : '—'} sub="applied" />
                {result.st > 0 && <StatCard label="Sales tax"   value={`${fmt(result.st)}%`} sub="of taxable amount" />}
                {result.fe > 0 && <StatCard label="Fees"        value={fmtCurrency(result.fe, result.currency)} sub="dealer / title" />}
                <StatCard accent label="Total out-of-pocket" value={fmtCurrency(result.totalCost + result.dp, result.currency)} sub="loans + down" />
              </div>

              {/* Depreciation estimate */}
              <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                📉 <strong>Estimated depreciation:</strong> After {fmt(result.months / 12, 0)} years, the vehicle's estimated value drops to <strong style={{ color: 'var(--accent-hover)' }}>{fmtCurrency(result.depreciated, result.currency)}</strong> (approx. <strong style={{ color: '#dc2626' }}>{fmtCurrency(result.depLoss, result.currency)}</strong> in depreciation loss). This is a rough estimate only.
              </div>

              {/* Cost breakdown bar */}
              <SectionTitle>Total cost breakdown</SectionTitle>
              <CostBreakdown
                principal={result.loanAmt}
                totalInterest={result.totalInt}
                fees={result.fe}
                symbol={result.currency}
              />

              {/* Term comparison table */}
              <SectionTitle>Compare loan terms</SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Term', 'Monthly payment', 'Total interest', 'Total paid'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TERM_OPTIONS.map((t, i) => {
                      const mp  = calcMonthlyPayment(result.loanAmt, result.ir, t.months);
                      const tc  = mp * t.months;
                      const ti  = tc - result.loanAmt;
                      const isActive = t.months === result.months;
                      return (
                        <tr key={t.months} style={{ borderBottom: '1px solid var(--border)', background: isActive ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                          <td style={{ padding: '8px 12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-hover)' : 'var(--text)' }}>
                            {t.label} {isActive && '✓'}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-hover)' : 'var(--text)' }}>
                            {fmtCurrency(mp, result.currency)}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: '#dc2626' }}>
                            {fmtCurrency(ti, result.currency)}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>
                            {fmtCurrency(tc, result.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Amortisation toggle */}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '16px' }}
                onClick={() => setShowAmort(v => !v)}>
                {showAmort ? '▲ Hide' : '▶ Show'} full amortisation schedule
              </button>

              {showAmort && (
                <div style={{ marginTop: '10px' }}>
                  <AmortTable rows={result.amort} symbol={result.currency} showAll={showAll} setShowAll={setShowAll} />
                </div>
              )}

              <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                ⓘ Results are estimates for informational purposes. Actual loan terms, rates, and fees vary by lender. Sales tax treatment varies by state — some states tax on the full vehicle price, others on the price minus trade-in. Always verify figures with your lender before signing.
              </div>
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Calculate Your Auto Loan Payment</h2>
          <p>
            An auto loan payment is calculated using the standard amortisation formula: <strong>M = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)</strong>, where <em>P</em> is the loan principal, <em>r</em> is the monthly interest rate (APR ÷ 12), and <em>n</em> is the number of monthly payments. Every payment covers that month's interest first, with the remainder reducing your principal balance.
          </p>
          <p>
            Your <strong>loan principal</strong> is not simply the vehicle price — it's the vehicle price minus your down payment, minus any trade-in value, plus applicable sales tax and dealer fees. This calculator accounts for all four variables. Sales tax is typically charged on the purchase price minus trade-in in most US states, so a higher trade-in can meaningfully reduce your taxable amount and therefore your loan.
          </p>
          <p>
            <strong>Loan term</strong> has a major impact on both your monthly payment and total cost. A longer term (72 or 84 months) reduces your monthly payment but increases total interest paid significantly. The loan term comparison table shows all six common terms side by side so you can find the right balance for your budget. Most financial advisors recommend the shortest term you can comfortably afford.
          </p>
          <p>
            The <strong>amortisation schedule</strong> shows every monthly payment broken down into principal and interest for the full loan life. In the early months, most of your payment goes toward interest; as the balance shrinks, more goes to principal. This schedule helps you identify when you'll reach key milestones like 50% payoff.
          </p>
          <p>
            The <strong>depreciation estimate</strong> gives a rough guide to your vehicle's value at the end of the loan term, helping you understand whether you'll have equity or be "underwater" on the loan.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Auto Loan Payment Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: '$35K car, $5K down, 6.5%, 60mo',  value: '$587/mo',   sub: '$5,219 total interest' },
              { label: '$25K car, 0 down, 7%, 48mo',       value: '$599/mo',   sub: '$3,735 total interest' },
              { label: '$50K car, $10K down, 5%, 72mo',    value: '$644/mo',   sub: '$6,382 total interest' },
              { label: '$20K car, $3K down, 8.5%, 60mo',   value: '$349/mo',   sub: '$3,927 total interest' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="auto-loan-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
