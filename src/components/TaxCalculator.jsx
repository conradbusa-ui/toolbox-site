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

// ── VAT / Sales Tax Calculator ────────────────────────────────
function VatCalculator({ currency }) {
  const [amount, setAmount]   = useState('');
  const [rate, setRate]       = useState('');
  const [mode, setMode]       = useState('exclusive'); // exclusive | inclusive
  const [result, setResult]   = useState(null);

  const QUICK_RATES = ['5', '10', '14', '15', '20', '21', '25'];

  const calculate = () => {
    const a = parseFloat(amount);
    const r = parseFloat(rate);
    if (isNaN(a) || isNaN(r) || a <= 0 || r <= 0) return;

    let preTax, taxAmount, total;
    if (mode === 'exclusive') {
      preTax    = a;
      taxAmount = a * (r / 100);
      total     = a + taxAmount;
    } else {
      total     = a;
      preTax    = a / (1 + r / 100);
      taxAmount = a - preTax;
    }
    setResult({ preTax, taxAmount, total, r });
  };

  const reset = () => { setAmount(''); setRate(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">VAT / Sales Tax Calculator</h2>

      <div style={{ marginBottom: '16px' }}>
        <label>Mode</label>
        <div className="tag-row">
          <button className={`tag${mode === 'exclusive' ? ' active' : ''}`}
            onClick={() => { setMode('exclusive'); setResult(null); }}>
            Add tax to price (exclusive)
          </button>
          <button className={`tag${mode === 'inclusive' ? ' active' : ''}`}
            onClick={() => { setMode('inclusive'); setResult(null); }}>
            Extract tax from price (inclusive)
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="vat-amount">
            {mode === 'exclusive' ? 'Pre-tax Amount' : 'Tax-inclusive Amount'}
          </label>
          <input
            id="vat-amount"
            type="number"
            min="0"
            placeholder="e.g. 1000"
            value={amount}
            onChange={e => { setAmount(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
          />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="vat-rate">Tax Rate %</label>
          <input
            id="vat-rate"
            type="number"
            min="0"
            placeholder="e.g. 15"
            value={rate}
            onChange={e => { setRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Quick Rate</label>
        <div className="tag-row">
          {QUICK_RATES.map(r => (
            <button key={r}
              className={`tag${rate === r ? ' active' : ''}`}
              onClick={() => { setRate(r); setResult(null); }}>
              {r}%
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!amount || !rate}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Pre-tax Amount"        value={fmt(result.preTax, currency)} />
          <ResultRow label={`Tax (${result.r}%)`}  value={fmt(result.taxAmount, currency)} />
          <ResultRow label="Total (incl. tax)"     value={fmt(result.total, currency)} highlight />
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>Tax Amount</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>
              {fmt(result.taxAmount, currency)} ({result.r}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Income Tax Calculator (flat / bracket) ────────────────────
function IncomeTaxCalculator({ currency }) {
  const [income, setIncome]     = useState('');
  const [mode, setMode]         = useState('flat');     // flat | brackets
  const [flatRate, setFlatRate] = useState('');
  const [brackets, setBrackets] = useState([
    { min: '0',      max: '20000',  rate: '10' },
    { min: '20001',  max: '50000',  rate: '20' },
    { min: '50001',  max: '',       rate: '30' },
  ]);
  const [result, setResult]     = useState(null);

  const updateBracket = (i, field, val) => {
    setBrackets(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
    setResult(null);
  };

  const addBracket = () => {
    setBrackets(prev => [...prev, { min: '', max: '', rate: '' }]);
  };

  const removeBracket = (i) => {
    setBrackets(prev => prev.filter((_, idx) => idx !== i));
    setResult(null);
  };

  const calculate = () => {
    const inc = parseFloat(income);
    if (isNaN(inc) || inc <= 0) return;

    if (mode === 'flat') {
      const r = parseFloat(flatRate);
      if (isNaN(r)) return;
      const tax = inc * (r / 100);
      setResult({ tax, net: inc - tax, effective: r, inc, breakdown: [] });
      return;
    }

    // Bracket calculation
    let totalTax = 0;
    const breakdown = [];
    for (const b of brackets) {
      const min  = parseFloat(b.min) || 0;
      const max  = b.max ? parseFloat(b.max) : Infinity;
      const rate = parseFloat(b.rate) || 0;
      if (inc <= min) continue;
      const taxable = Math.min(inc, max) - min;
      if (taxable <= 0) continue;
      const tax = taxable * (rate / 100);
      totalTax += tax;
      breakdown.push({ min, max, rate, taxable, tax });
    }
    const effective = (totalTax / inc) * 100;
    setResult({ tax: totalTax, net: inc - totalTax, effective, inc, breakdown });
  };

  const reset = () => {
    setIncome(''); setFlatRate(''); setResult(null);
    setBrackets([
      { min: '0', max: '20000', rate: '10' },
      { min: '20001', max: '50000', rate: '20' },
      { min: '50001', max: '', rate: '30' },
    ]);
  };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Income Tax Calculator</h2>

      <div style={{ marginBottom: '16px' }}>
        <label>Method</label>
        <div className="tag-row">
          <button className={`tag${mode === 'flat' ? ' active' : ''}`}
            onClick={() => { setMode('flat'); setResult(null); }}>
            Flat rate
          </button>
          <button className={`tag${mode === 'brackets' ? ' active' : ''}`}
            onClick={() => { setMode('brackets'); setResult(null); }}>
            Tax brackets
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="income-input">Annual Income</label>
        <input
          id="income-input"
          type="number"
          min="0"
          placeholder="e.g. 75000"
          value={income}
          onChange={e => { setIncome(e.target.value); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
        />
      </div>

      {mode === 'flat' && (
        <div className="form-group">
          <label htmlFor="flat-rate">Tax Rate %</label>
          <input
            id="flat-rate"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 25"
            value={flatRate}
            onChange={e => { setFlatRate(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
          />
        </div>
      )}

      {mode === 'brackets' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ marginBottom: '8px', display: 'block' }}>Tax Brackets</label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['From', 'To (blank = no limit)', 'Rate %', ''].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brackets.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 4px' }}>
                      <input type="number" value={b.min} onChange={e => updateBracket(i, 'min', e.target.value)}
                        style={{ width: '90px' }} placeholder="0" />
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <input type="number" value={b.max} onChange={e => updateBracket(i, 'max', e.target.value)}
                        style={{ width: '110px' }} placeholder="No limit" />
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <input type="number" value={b.rate} onChange={e => updateBracket(i, 'rate', e.target.value)}
                        style={{ width: '70px' }} placeholder="%" />
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {brackets.length > 1 && (
                        <button onClick={() => removeBracket(i)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#ef4444' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={addBracket}>+ Add bracket</button>
        </div>
      )}

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}
          disabled={!income || (mode === 'flat' && !flatRate)}>
          Calculate Tax
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '16px' }}>
            <ResultRow label="Gross Income"      value={fmt(result.inc, currency)} />
            <ResultRow label="Total Tax"         value={fmt(result.tax, currency)} />
            <ResultRow label="Net Income"        value={fmt(result.net, currency)} highlight />
            <ResultRow label="Effective Tax Rate" value={`${result.effective.toFixed(2)}%`} />
          </div>

          {/* Visual split bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '14px', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(result.net / result.inc) * 100}%`, background: 'var(--accent)' }} />
              <div style={{ flex: 1, background: '#f97316' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '6px' }}>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />
                Take-home {((result.net / result.inc) * 100).toFixed(1)}%
              </span>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                Tax {((result.tax / result.inc) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Bracket breakdown */}
          {result.breakdown.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                Bracket Breakdown
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Bracket', 'Rate', 'Taxable Amount', 'Tax'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((b, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-3)' }}>
                          {currency}{b.min.toLocaleString()} – {b.max === Infinity ? '∞' : `${currency}${b.max.toLocaleString()}`}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{b.rate}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(b.taxable, currency)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>{fmt(b.tax, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '14px', lineHeight: 1.5 }}>
            ⚠ This calculator provides estimates only. Actual tax depends on deductions, credits, allowances, and your country's specific tax rules. Consult a tax professional for accurate advice.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function TaxCalculator() {
  const [currency, setCurrency] = useState('$');
  const CURRENCIES_LIST = ['$', '€', '£', 'R', '¥'];

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Tax Calculator</span>
          </div>
          <h1>Tax Calculator</h1>
          <p className="subtitle">
            Calculate VAT, sales tax, and income tax — with flat rate or custom tax brackets.
          </p>
        </div>

        {/* Currency selector shared across tools */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Currency</label>
          <div className="tag-row" style={{ margin: 0 }}>
            {CURRENCIES_LIST.map(c => (
              <button key={c} className={`tag${currency === c ? ' active' : ''}`}
                onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <VatCalculator currency={currency} />
        <IncomeTaxCalculator currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Tax Calculator</h2>
          <p>
            This tax calculator covers two of the most common tax calculations: VAT or sales tax on goods
            and services, and income tax on earnings. The VAT calculator works in both directions — you can
            add tax to a pre-tax price to find the total, or extract the tax component from a tax-inclusive
            price to find what was paid in tax. Use the quick-rate buttons for common VAT rates like 15%,
            20%, or 25%, or type any custom rate directly.
          </p>
          <p>
            The income tax calculator supports two methods. The flat rate method applies a single percentage
            to your full income — useful for quick estimates or countries with a flat tax structure. The
            tax bracket method lets you enter your country's actual progressive tax bands, where different
            portions of your income are taxed at increasing rates. The bracket breakdown table shows exactly
            how much tax falls into each band, and the effective tax rate shows your real overall percentage
            after all brackets are applied.
          </p>
          <p>
            Both calculators display a visual bar showing the split between take-home pay and tax. All
            results are estimates based on the rates you enter — actual tax liabilities depend on your
            personal deductions, tax credits, and the specific rules of your country's tax authority.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Tax Calculation Examples</h2>
          <p>
            <strong>Example 1 — VAT exclusive (adding tax):</strong> A product costs $500 before VAT.
            At 15% VAT: tax = $75. Total price = $575.
          </p>
          <p>
            <strong>Example 2 — VAT inclusive (extracting tax):</strong> You paid R1,150 for an item
            including 15% VAT. Pre-tax price = R1,150 ÷ 1.15 = R1,000. VAT paid = R150.
          </p>
          <p>
            <strong>Example 3 — Flat income tax:</strong> Annual income $60,000 at a flat 25% rate.
            Tax = $15,000. Take-home = $45,000.
          </p>
          <p>
            <strong>Example 4 — Bracketed income tax:</strong> Income $75,000 with three brackets:
            10% on first $20,000 = $2,000. 20% on $20,001–$50,000 = $6,000. 30% on $50,001–$75,000 = $7,500.
            Total tax = $15,500. Effective rate = 20.67%. Take-home = $59,500.
          </p>
        </div>

        <RelatedTools currentId="tax-calculator" />
      </div>
    </div>
  );
}
