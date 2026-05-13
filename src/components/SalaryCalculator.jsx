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

function ResultRow({ label, value, highlight, muted, sub }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: sub ? '7px 0 7px 16px' : '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        fontSize: sub ? '0.82rem' : '0.9rem',
        color: muted ? 'var(--text-3)' : 'var(--text-2)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: highlight ? '1.25rem' : sub ? '0.88rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)' : muted ? 'var(--text-3)' : 'var(--text)',
        letterSpacing: highlight ? '-0.02em' : 0,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function SalaryCalculator() {
  const [currency, setCurrency]   = useState('$');
  const [amount, setAmount]       = useState('');
  const [inputType, setInputType] = useState('annual');   // annual | hourly
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [weeksPerYear, setWeeksPerYear] = useState('52');
  const [taxRate, setTaxRate]     = useState('');
  const [result, setResult]       = useState(null);

  const PERIODS = [
    { id: 'annual',    label: 'Annual'    },
    { id: 'monthly',   label: 'Monthly'   },
    { id: 'biweekly',  label: 'Bi-weekly' },
    { id: 'weekly',    label: 'Weekly'    },
    { id: 'daily',     label: 'Daily'     },
    { id: 'hourly',    label: 'Hourly'    },
  ];

  const calculate = () => {
    const val   = parseFloat(amount);
    const hpw   = parseFloat(hoursPerWeek) || 40;
    const wpy   = parseFloat(weeksPerYear) || 52;
    const tax   = parseFloat(taxRate) || 0;
    if (isNaN(val) || val <= 0) return;

    // Derive annual gross from input type
    let annual;
    if (inputType === 'annual')    annual = val;
    else if (inputType === 'monthly')   annual = val * 12;
    else if (inputType === 'biweekly')  annual = val * 26;
    else if (inputType === 'weekly')    annual = val * wpy;
    else if (inputType === 'daily')     annual = val * 5 * wpy;
    else if (inputType === 'hourly')    annual = val * hpw * wpy;

    const totalHours  = hpw * wpy;
    const monthly     = annual / 12;
    const biweekly    = annual / 26;
    const weekly      = annual / wpy;
    const daily       = annual / (5 * wpy);
    const hourly      = annual / totalHours;

    const taxAmount   = annual * (tax / 100);
    const netAnnual   = annual - taxAmount;
    const netMonthly  = netAnnual / 12;
    const netWeekly   = netAnnual / wpy;
    const netHourly   = netAnnual / totalHours;

    setResult({
      annual, monthly, biweekly, weekly, daily, hourly,
      tax, taxAmount, netAnnual, netMonthly, netWeekly, netHourly,
      hpw, wpy, totalHours,
    });
  };

  const reset = () => { setAmount(''); setTaxRate(''); setResult(null); };

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Salary Calculator</span>
          </div>
          <h1>Salary Calculator</h1>
          <p className="subtitle">
            Convert any salary between hourly, daily, weekly, bi-weekly, monthly, and annual pay — with optional tax deduction.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate & Convert Your Salary</h2>

          {/* Currency */}
          <div style={{ marginBottom: '18px' }}>
            <label>Currency</label>
            <div className="tag-row">
              {CURRENCIES.map(c => (
                <button key={c} className={`tag${currency === c ? ' active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Input type */}
          <div style={{ marginBottom: '18px' }}>
            <label>I earn this amount per</label>
            <div className="tag-row">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  className={`tag${inputType === p.id ? ' active' : ''}`}
                  onClick={() => { setInputType(p.id); setResult(null); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="salary-amount">
                {inputType.charAt(0).toUpperCase() + inputType.slice(1)} Salary
              </label>
              <input
                id="salary-amount"
                type="number"
                min="0"
                placeholder={
                  inputType === 'hourly'   ? 'e.g. 25' :
                  inputType === 'daily'    ? 'e.g. 200' :
                  inputType === 'weekly'   ? 'e.g. 1000' :
                  inputType === 'biweekly' ? 'e.g. 2000' :
                  inputType === 'monthly'  ? 'e.g. 4000' :
                                             'e.g. 50000'
                }
                value={amount}
                onChange={e => { setAmount(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="hours-week">Hours / Week</label>
              <input
                id="hours-week"
                type="number"
                min="1"
                max="168"
                value={hoursPerWeek}
                onChange={e => { setHoursPerWeek(e.target.value); setResult(null); }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weeks-year">Weeks / Year</label>
              <input
                id="weeks-year"
                type="number"
                min="1"
                max="52"
                value={weeksPerYear}
                onChange={e => { setWeeksPerYear(e.target.value); setResult(null); }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tax-rate">
                Tax Rate % <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 25"
                value={taxRate}
                onChange={e => { setTaxRate(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '24px' : 0 }}>
            <button className="btn btn-primary" onClick={calculate} disabled={!amount}>
              Calculate Salary
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div>
              {/* Gross breakdown */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>
                Gross Pay
              </p>
              <div style={{ marginBottom: '20px' }}>
                <ResultRow label="Annual"    value={fmt(result.annual,   currency)} highlight />
                <ResultRow label="Monthly"   value={fmt(result.monthly,  currency)} />
                <ResultRow label="Bi-weekly" value={fmt(result.biweekly, currency)} />
                <ResultRow label="Weekly"    value={fmt(result.weekly,   currency)} />
                <ResultRow label="Daily"     value={fmt(result.daily,    currency)} />
                <ResultRow label="Hourly"    value={fmt(result.hourly,   currency)} />
              </div>

              {/* Working hours summary */}
              <div className="result-grid" style={{ marginBottom: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.hpw}</div>
                  <div className="stat-label">Hrs / Week</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.wpy}</div>
                  <div className="stat-label">Weeks / Year</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.totalHours.toLocaleString()}</div>
                  <div className="stat-label">Total Hrs / Year</div>
                </div>
              </div>

              {/* Net pay (if tax entered) */}
              {result.tax > 0 && (
                <>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '4px' }}>
                    After Tax ({result.tax}%)
                  </p>
                  <div style={{ marginBottom: '16px' }}>
                    <ResultRow label={`Tax Deducted (${result.tax}%)`} value={`− ${fmt(result.taxAmount, currency)}`} muted />
                    <ResultRow label="Net Annual"  value={fmt(result.netAnnual,  currency)} highlight />
                    <ResultRow label="Net Monthly" value={fmt(result.netMonthly, currency)} />
                    <ResultRow label="Net Weekly"  value={fmt(result.netWeekly,  currency)} />
                    <ResultRow label="Net Hourly"  value={fmt(result.netHourly,  currency)} />
                  </div>
                </>
              )}

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                ⚠ This calculator uses a flat tax rate. Actual take-home pay varies depending on your country's tax brackets, deductions, and other withholdings. Consult a financial adviser for precise figures.
              </p>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Convert Your Salary Between Pay Periods</h2>
          <p>
            Whether you're comparing a job offer, budgeting monthly expenses, or working out what a contract
            rate is worth annually, converting between pay periods is something most people need to do
            regularly. This salary calculator handles every common conversion — hourly to annual, annual to
            monthly, bi-weekly to hourly, and everything in between — in one step.
          </p>
          <p>
            Enter your salary for any pay period, select that period from the tabs, and the calculator
            instantly shows your equivalent pay across all other periods. You can adjust the hours per week
            and working weeks per year to match your actual schedule — useful for part-time workers, contractors,
            or anyone who takes unpaid leave. The default is 40 hours per week over 52 weeks, which is the
            standard full-time baseline.
          </p>
          <p>
            Add an optional flat tax rate to see an estimated take-home pay after deductions. The net pay
            section shows your after-tax annual, monthly, weekly, and hourly figures side by side, making
            it easy to plan a budget around your actual income rather than your gross salary. All calculations
            run instantly in your browser — no data is stored or shared.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Salary Conversion Examples</h2>
          <p>
            <strong>Example 1 — Hourly to annual:</strong> You earn $25/hr working 40 hrs/week for 52 weeks.
            Annual = $25 × 40 × 52 = $52,000. Monthly gross = $4,333.
          </p>
          <p>
            <strong>Example 2 — Annual to monthly (with tax):</strong> Salary is $72,000/year with a 28% tax rate.
            Gross monthly = $6,000. Tax = $1,680/month. Net monthly take-home = $4,320.
          </p>
          <p>
            <strong>Example 3 — Part-time contractor:</strong> You earn R350/hr for 20 hrs/week over 48 weeks.
            Annual = R350 × 20 × 48 = R336,000. Weekly gross = R7,000.
          </p>
          <p>
            <strong>Example 4 — Comparing job offers:</strong> Job A pays $85,000/year. Job B pays $42/hr.
            At 40 hrs/week × 52 weeks, Job B = $87,360/year — $2,360 more annually.
          </p>
        </div>

        <RelatedTools currentId="salary-calculator" />
      </div>
    </div>
  );
}
