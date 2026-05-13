import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

// ── 2025 Federal Tax Data ─────────────────────────────────────

const STANDARD_DEDUCTIONS_2025 = {
  single:           15000,
  married_jointly:  30000,
  married_sep:      15000,
  head_of_household:22500,
  widow:            30000,
};

const TAX_BRACKETS_2025 = {
  single: [
    { min: 0,       max: 11925,  rate: 0.10 },
    { min: 11925,   max: 48475,  rate: 0.12 },
    { min: 48475,   max: 103350, rate: 0.22 },
    { min: 103350,  max: 197300, rate: 0.24 },
    { min: 197300,  max: 250525, rate: 0.32 },
    { min: 250525,  max: 626350, rate: 0.35 },
    { min: 626350,  max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0,       max: 23850,  rate: 0.10 },
    { min: 23850,   max: 96950,  rate: 0.12 },
    { min: 96950,   max: 206700, rate: 0.22 },
    { min: 206700,  max: 394600, rate: 0.24 },
    { min: 394600,  max: 501050, rate: 0.32 },
    { min: 501050,  max: 751600, rate: 0.35 },
    { min: 751600,  max: Infinity, rate: 0.37 },
  ],
  married_sep: [
    { min: 0,       max: 11925,  rate: 0.10 },
    { min: 11925,   max: 48475,  rate: 0.12 },
    { min: 48475,   max: 103350, rate: 0.22 },
    { min: 103350,  max: 197300, rate: 0.24 },
    { min: 197300,  max: 250525, rate: 0.32 },
    { min: 250525,  max: 375800, rate: 0.35 },
    { min: 375800,  max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0,       max: 17000,  rate: 0.10 },
    { min: 17000,   max: 64850,  rate: 0.12 },
    { min: 64850,   max: 103350, rate: 0.22 },
    { min: 103350,  max: 197300, rate: 0.24 },
    { min: 197300,  max: 250500, rate: 0.32 },
    { min: 250500,  max: 626350, rate: 0.35 },
    { min: 626350,  max: Infinity, rate: 0.37 },
  ],
  widow: [
    { min: 0,       max: 23850,  rate: 0.10 },
    { min: 23850,   max: 96950,  rate: 0.12 },
    { min: 96950,   max: 206700, rate: 0.22 },
    { min: 206700,  max: 394600, rate: 0.24 },
    { min: 394600,  max: 501050, rate: 0.32 },
    { min: 501050,  max: 751600, rate: 0.35 },
    { min: 751600,  max: Infinity, rate: 0.37 },
  ],
};

// Child Tax Credit 2025: $2,000 per child under 17, phases out at $200k single / $400k joint
const CHILD_CREDIT_PER_CHILD = 2000;
const CHILD_CREDIT_PHASE_SINGLE  = 200000;
const CHILD_CREDIT_PHASE_JOINT   = 400000;

// FICA rates 2025
const SOCIAL_SECURITY_RATE  = 0.062;
const MEDICARE_RATE         = 0.0145;
const SS_WAGE_BASE_2025     = 176100;

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return n.toFixed(2) + '%';
}

function computeTax(taxableIncome, filingStatus) {
  const brackets = TAX_BRACKETS_2025[filingStatus] || TAX_BRACKETS_2025.single;
  let tax = 0;
  const breakdown = [];
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    const taxable = Math.min(taxableIncome, b.max) - b.min;
    const amount  = taxable * b.rate;
    tax += amount;
    breakdown.push({ min: b.min, max: b.max, rate: b.rate, taxable, amount });
  }
  return { tax, breakdown };
}

function ResultRow({ label, value, highlight, muted, sub, positive, negative }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: sub ? '7px 0 7px 16px' : '11px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: sub ? '0.82rem' : '0.9rem', color: muted ? 'var(--text-3)' : 'var(--text-2)' }}>
        {label}
      </span>
      <span style={{
        fontSize: highlight ? '1.2rem' : '0.95rem',
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

const FILING_STATUS_OPTIONS = [
  { value: 'single',           label: 'Single' },
  { value: 'married_jointly',  label: 'Married Filing Jointly' },
  { value: 'married_sep',      label: 'Married Filing Separately' },
  { value: 'head_of_household',label: 'Head of Household' },
  { value: 'widow',            label: 'Qualifying Widow(er)' },
];

export default function USTaxCalculator() {
  // Income
  const [wages, setWages]             = useState('');
  const [selfEmpIncome, setSelfEmp]   = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');

  // Withholding
  const [fedWithheld, setFedWithheld] = useState('');

  // Deductions
  const [deductionType, setDeductionType] = useState('standard'); // standard | itemized
  const [mortgage, setMortgage]         = useState('');
  const [stateTax, setStateTax]         = useState('');
  const [charitable, setCharitable]     = useState('');
  const [studentLoan, setStudentLoan]   = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  // Credits & dependents
  const [numChildren, setNumChildren]   = useState('0');
  const [otherCredits, setOtherCredits] = useState('');

  const [result, setResult]     = useState(null);
  const [showBrackets, setShowBrackets] = useState(false);

  const calculate = () => {
    const w    = parseFloat(wages)        || 0;
    const se   = parseFloat(selfEmpIncome)|| 0;
    const oth  = parseFloat(otherIncome)  || 0;
    const fw   = parseFloat(fedWithheld)  || 0;
    const mort = parseFloat(mortgage)     || 0;
    const salt = Math.min(parseFloat(stateTax) || 0, 40000); // SALT cap 2025
    const char = parseFloat(charitable)   || 0;
    const sl   = Math.min(parseFloat(studentLoan) || 0, 2500); // $2,500 limit
    const othdeds = parseFloat(otherDeductions) || 0;
    const children = parseInt(numChildren) || 0;
    const extraCredits = parseFloat(otherCredits) || 0;

    // Self-employment tax (15.3% on 92.35% of SE income)
    const seNetEarnings = se * 0.9235;
    const seTax = seNetEarnings > 0 ? seNetEarnings * 0.153 : 0;
    const seDeduction = seTax / 2; // half of SE tax is deductible

    // Gross income
    const grossIncome = w + se + oth;

    // Above-the-line deductions (ATL)
    const atlDeductions = seDeduction + sl;
    const agi = Math.max(grossIncome - atlDeductions, 0);

    // Standard deduction
    const standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus] || 15000;

    // Itemized deductions
    const itemizedTotal = mort + salt + char + othdeds;

    // Choose larger
    let chosenDeduction, deductionLabel;
    if (deductionType === 'standard') {
      chosenDeduction = standardDeduction;
      deductionLabel  = 'Standard Deduction';
    } else {
      chosenDeduction = Math.max(itemizedTotal, standardDeduction);
      deductionLabel  = itemizedTotal >= standardDeduction ? 'Itemized Deductions' : 'Standard Deduction (larger than itemized)';
    }

    // Taxable income
    const taxableIncome = Math.max(agi - chosenDeduction, 0);

    // Federal income tax
    const { tax: federalTax, breakdown } = computeTax(taxableIncome, filingStatus);

    // Child Tax Credit
    const phaseLimit = ['married_jointly', 'widow'].includes(filingStatus)
      ? CHILD_CREDIT_PHASE_JOINT : CHILD_CREDIT_PHASE_SINGLE;
    const phaseReduction = Math.max(0, Math.ceil((agi - phaseLimit) / 1000)) * 50;
    const rawChildCredit  = children * CHILD_CREDIT_PER_CHILD;
    const childCredit     = Math.max(0, rawChildCredit - phaseReduction);

    // Total credits
    const totalCredits = Math.min(childCredit + extraCredits, federalTax);

    // Net federal tax after credits
    const netFederalTax = Math.max(federalTax - totalCredits, 0);

    // FICA (employee share — on wages only)
    const ssTax  = Math.min(w, SS_WAGE_BASE_2025) * SOCIAL_SECURITY_RATE;
    const medTax = w * MEDICARE_RATE;
    const ficaTax = ssTax + medTax;

    // Refund or owed
    const refundOwed = fw - netFederalTax;

    // Effective & marginal rates
    const effectiveRate = grossIncome > 0 ? (netFederalTax / grossIncome) * 100 : 0;
    const brackets2025 = TAX_BRACKETS_2025[filingStatus];
    const marginalBracket = brackets2025.find(b => taxableIncome >= b.min && taxableIncome < b.max)
      || brackets2025[brackets2025.length - 1];

    setResult({
      grossIncome, agi, atlDeductions, chosenDeduction, deductionLabel,
      taxableIncome, federalTax, childCredit, extraCredits, totalCredits,
      netFederalTax, ficaTax, seTax, ssTax, medTax,
      fw, refundOwed,
      effectiveRate, marginalRate: marginalBracket.rate * 100,
      breakdown, standardDeduction, itemizedTotal,
      seDeduction, sl,
    });
    setShowBrackets(false);
  };

  const reset = () => {
    setWages(''); setSelfEmp(''); setOtherIncome(''); setFedWithheld('');
    setFilingStatus('single'); setDeductionType('standard');
    setMortgage(''); setStateTax(''); setCharitable('');
    setStudentLoan(''); setOtherDeductions('');
    setNumChildren('0'); setOtherCredits('');
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
            <span>US Tax Calculator</span>
          </div>
          <h1>US Income Tax Calculator 2025</h1>
          <p className="subtitle">
            Estimate your 2025 federal income tax, effective tax rate, and refund or amount owed — based on IRS 2025 tax brackets.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">2025 Federal Income Tax Estimator</h2>

          {/* Filing status */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="filing-status">Filing Status</label>
            <select id="filing-status" value={filingStatus}
              onChange={e => { setFilingStatus(e.target.value); setResult(null); }}>
              {FILING_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Income */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px' }}>
            Income
          </p>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="wages">Wages, Salaries & Tips (W-2)</label>
              <input id="wages" type="number" min="0" placeholder="e.g. 75000"
                value={wages} onChange={e => { setWages(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="self-emp">Self-Employment Income</label>
              <input id="self-emp" type="number" min="0" placeholder="e.g. 20000"
                value={selfEmpIncome} onChange={e => { setSelfEmp(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="other-income">Other Income (dividends, interest)</label>
              <input id="other-income" type="number" min="0" placeholder="e.g. 5000"
                value={otherIncome} onChange={e => { setOtherIncome(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="fed-withheld">Federal Tax Already Withheld</label>
              <input id="fed-withheld" type="number" min="0" placeholder="e.g. 10000"
                value={fedWithheld} onChange={e => { setFedWithheld(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Deductions */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Deductions
          </p>
          <div style={{ marginBottom: '14px' }}>
            <div className="tag-row">
              <button className={`tag${deductionType === 'standard' ? ' active' : ''}`}
                onClick={() => { setDeductionType('standard'); setResult(null); }}>
                Standard Deduction (${STANDARD_DEDUCTIONS_2025[filingStatus]?.toLocaleString()})
              </button>
              <button className={`tag${deductionType === 'itemized' ? ' active' : ''}`}
                onClick={() => { setDeductionType('itemized'); setResult(null); }}>
                Itemize Deductions
              </button>
            </div>
          </div>

          {deductionType === 'itemized' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mortgage">Mortgage Interest</label>
                <input id="mortgage" type="number" min="0" placeholder="e.g. 12000"
                  value={mortgage} onChange={e => { setMortgage(e.target.value); setResult(null); }} />
              </div>
              <div className="form-group">
                <label htmlFor="state-tax">State & Local Taxes (max $40,000)</label>
                <input id="state-tax" type="number" min="0" placeholder="e.g. 8000"
                  value={stateTax} onChange={e => { setStateTax(e.target.value); setResult(null); }} />
              </div>
              <div className="form-group">
                <label htmlFor="charitable">Charitable Donations</label>
                <input id="charitable" type="number" min="0" placeholder="e.g. 2000"
                  value={charitable} onChange={e => { setCharitable(e.target.value); setResult(null); }} />
              </div>
              <div className="form-group">
                <label htmlFor="other-deds">Other Deductions</label>
                <input id="other-deds" type="number" min="0" placeholder="e.g. 1000"
                  value={otherDeductions} onChange={e => { setOtherDeductions(e.target.value); setResult(null); }} />
              </div>
            </div>
          )}

          {/* Above-the-line deductions always available */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student-loan">Student Loan Interest (max $2,500)</label>
              <input id="student-loan" type="number" min="0" placeholder="e.g. 2000"
                value={studentLoan} onChange={e => { setStudentLoan(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Credits */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '10px', marginTop: '8px' }}>
            Tax Credits
          </p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="num-children">Children Under 17 (Child Tax Credit $2,000 each)</label>
              <input id="num-children" type="number" min="0" max="20" placeholder="0"
                value={numChildren} onChange={e => { setNumChildren(e.target.value); setResult(null); }} />
            </div>
            <div className="form-group">
              <label htmlFor="other-credits">Other Tax Credits</label>
              <input id="other-credits" type="number" min="0" placeholder="e.g. 500"
                value={otherCredits} onChange={e => { setOtherCredits(e.target.value); setResult(null); }} />
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate}
              disabled={!wages && !selfEmpIncome && !otherIncome}>
              Calculate Tax
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Refund / owed hero */}
              <div style={{
                textAlign: 'center',
                background: result.refundOwed >= 0
                  ? 'linear-gradient(135deg, #0f172a, #134e4a)'
                  : 'linear-gradient(135deg, #0f172a, #450a0a)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                  {result.refundOwed >= 0 ? 'Estimated Federal Refund' : 'Estimated Amount Owed'}
                </div>
                <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: result.refundOwed >= 0 ? '#5eead4' : '#fca5a5' }}>
                  {fmt(result.refundOwed)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                  {result.refundOwed >= 0
                    ? 'Based on withholding vs. estimated tax liability'
                    : 'Additional tax due when filing your return'}
                </div>
              </div>

              {/* Key rates */}
              <div className="result-grid" style={{ marginBottom: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{fmtPct(result.effectiveRate)}</div>
                  <div className="stat-label">Effective Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{fmtPct(result.marginalRate)}</div>
                  <div className="stat-label">Marginal Rate</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.taxableIncome)}</div>
                  <div className="stat-label">Taxable Income</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(result.netFederalTax)}</div>
                  <div className="stat-label">Federal Tax</div>
                </div>
              </div>

              {/* Full breakdown */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>
                Income & Deductions
              </p>
              <div style={{ marginBottom: '20px' }}>
                <ResultRow label="Gross Income"                  value={fmt(result.grossIncome)} />
                {result.seDeduction > 0 &&
                  <ResultRow label="½ Self-Employment Tax Deduction" value={`− ${fmt(result.seDeduction)}`} sub muted />}
                {result.sl > 0 &&
                  <ResultRow label="Student Loan Interest"       value={`− ${fmt(result.sl)}`} sub muted />}
                <ResultRow label="Adjusted Gross Income (AGI)"  value={fmt(result.agi)} />
                <ResultRow label={result.deductionLabel}        value={`− ${fmt(result.chosenDeduction)}`} muted />
                <ResultRow label="Federal Taxable Income"       value={fmt(result.taxableIncome)} highlight />
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>
                Tax Calculation
              </p>
              <div style={{ marginBottom: '20px' }}>
                <ResultRow label="Federal Income Tax (before credits)" value={fmt(result.federalTax)} />
                {result.childCredit > 0 &&
                  <ResultRow label="Child Tax Credit"             value={`− ${fmt(result.childCredit)}`} sub positive />}
                {result.extraCredits > 0 &&
                  <ResultRow label="Other Credits"                value={`− ${fmt(result.extraCredits)}`} sub positive />}
                <ResultRow label="Net Federal Income Tax"         value={fmt(result.netFederalTax)} highlight />
                <ResultRow label="Federal Tax Withheld (W-2)"     value={`− ${fmt(result.fw)}`} muted />
                <ResultRow
                  label={result.refundOwed >= 0 ? 'Estimated Refund' : 'Estimated Amount Owed'}
                  value={fmt(result.refundOwed)}
                  positive={result.refundOwed >= 0}
                  negative={result.refundOwed < 0}
                />
              </div>

              {/* FICA */}
              {(result.ficaTax > 0 || result.seTax > 0) && (
                <>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>
                    Payroll / Self-Employment Taxes (not refundable)
                  </p>
                  <div style={{ marginBottom: '20px' }}>
                    {result.ssTax > 0 &&
                      <ResultRow label="Social Security (6.2% on wages up to $176,100)" value={fmt(result.ssTax)} sub />}
                    {result.medTax > 0 &&
                      <ResultRow label="Medicare (1.45% on wages)"                       value={fmt(result.medTax)} sub />}
                    {result.ficaTax > 0 &&
                      <ResultRow label="Total FICA (employee share)"                     value={fmt(result.ficaTax)} />}
                    {result.seTax > 0 &&
                      <ResultRow label="Self-Employment Tax (15.3%)"                     value={fmt(result.seTax)} />}
                  </div>
                </>
              )}

              {/* Bracket breakdown toggle */}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBrackets(v => !v)}>
                {showBrackets ? 'Hide bracket breakdown ▲' : 'Show bracket breakdown ▼'}
              </button>

              {showBrackets && (
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['Tax Rate', 'Income Range', 'Taxable in Bracket', 'Tax'].map(h => (
                          <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map((b, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{(b.rate * 100).toFixed(0)}%</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>
                            ${b.min.toLocaleString()} – {b.max === Infinity ? '∞' : `$${b.max.toLocaleString()}`}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(b.taxable)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmt(b.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '16px', lineHeight: 1.5 }}>
                ⚠ This calculator provides estimates for federal income tax only, based on 2025 IRS tax brackets and standard deductions. It does not account for state income taxes, AMT, all possible credits, or complex tax situations. Always consult a qualified tax professional or use official IRS tools for your actual tax return.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How the 2025 US Federal Income Tax Calculator Works</h2>
          <p>
            The United States uses a progressive federal income tax system, meaning different portions of
            your income are taxed at increasing rates as your income rises. For 2025, there are seven
            federal tax brackets ranging from 10% to 37%. This calculator applies those brackets to your
            taxable income — not your gross income — to estimate your actual federal tax liability.
          </p>
          <p>
            Your taxable income is your gross income minus deductions. Most taxpayers take the standard
            deduction ($15,000 for single filers, $30,000 for married filing jointly in 2025). If your
            mortgage interest, state taxes, and charitable donations add up to more than the standard
            deduction, itemizing may reduce your tax bill further. This calculator automatically uses
            whichever method gives you the larger deduction.
          </p>
          <p>
            The Child Tax Credit of up to $2,000 per qualifying child under 17 directly reduces your
            federal tax owed. Self-employed individuals also see their self-employment tax calculated
            separately — half of it is deductible above the line, reducing your AGI. The FICA section
            shows Social Security (6.2%) and Medicare (1.45%) taxes on wages, which are withheld by
            employers and are separate from income tax. Enter your federal tax already withheld from
            your W-2 to see whether you're on track for a refund or will owe money at filing time.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>2025 Federal Tax Examples</h2>
          <p>
            <strong>Example 1 — Single filer, standard deduction:</strong> Wages of $65,000.
            Standard deduction: $15,000. Taxable income: $50,000. Federal tax ≈ $6,617.
            Effective rate ≈ 10.2%. Marginal rate: 22%.
          </p>
          <p>
            <strong>Example 2 — Married filing jointly with children:</strong> Combined wages $120,000,
            2 children under 17. Standard deduction: $30,000. Taxable income: $90,000.
            Federal tax before credits ≈ $12,414. Child Tax Credit: $4,000.
            Net federal tax ≈ $8,414. Effective rate ≈ 7%.
          </p>
          <p>
            <strong>Example 3 — Self-employed, itemizing:</strong> Self-employment income $80,000.
            SE tax ≈ $11,304. Half SE deduction ≈ $5,652. AGI ≈ $74,348.
            Itemized deductions (mortgage $12,000 + SALT $8,000 + charitable $3,000) = $23,000.
            Standard deduction $15,000 is lower so itemized is used. Taxable income ≈ $51,348.
            Federal income tax ≈ $6,913.
          </p>
          <p>
            <strong>Example 4 — High earner, 32% bracket:</strong> Single filer, wages $220,000.
            Standard deduction: $15,000. Taxable income: $205,000. Federal tax ≈ $43,369.
            Effective rate ≈ 19.7%. Marginal rate: 32%.
          </p>
        </div>

        <RelatedTools currentId="us-tax-calculator" />
      </div>
    </div>
  );
}
