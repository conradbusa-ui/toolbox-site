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

function fmtPct(n) {
  return parseFloat(n.toFixed(2)).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '%';
}

function ResultRow({ label, value, highlight, muted, positive, negative }) {
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

function ROIBadge({ roi }) {
  const color = roi >= 100 ? '#16a34a'
    : roi >= 20  ? '#0d9488'
    : roi >= 0   ? '#f59e0b'
    : '#dc2626';
  const label = roi >= 100 ? 'Excellent'
    : roi >= 20  ? 'Good'
    : roi >= 0   ? 'Low'
    : 'Loss';
  return (
    <span style={{
      background: color + '20',
      color,
      border: `1px solid ${color}40`,
      borderRadius: '99px',
      padding: '2px 10px',
      fontSize: '0.75rem',
      fontWeight: 700,
      marginLeft: '8px',
    }}>
      {label}
    </span>
  );
}

// ── Section 1: Basic ROI ──────────────────────────────────────
function BasicROI({ currency }) {
  const [cost, setCost]         = useState('');
  const [returnVal, setReturn]  = useState('');
  const [years, setYears]       = useState('');
  const [result, setResult]     = useState(null);

  const calculate = () => {
    const c = parseFloat(cost);
    const r = parseFloat(returnVal);
    const y = parseFloat(years) || 1;
    if (isNaN(c) || isNaN(r) || c <= 0) return;

    const netProfit    = r - c;
    const roi          = (netProfit / c) * 100;
    const annualisedRoi = (Math.pow(r / c, 1 / y) - 1) * 100;
    const multiple     = r / c;

    setResult({ c, r, netProfit, roi, annualisedRoi, multiple, y });
  };

  const reset = () => { setCost(''); setReturn(''); setYears(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Basic ROI Calculator</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="roi-cost">Total Investment Cost</label>
          <input id="roi-cost" type="number" min="0" placeholder="e.g. 10000"
            value={cost}
            onChange={e => { setCost(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="roi-return">Total Return / Final Value</label>
          <input id="roi-return" type="number" min="0" placeholder="e.g. 14500"
            value={returnVal}
            onChange={e => { setReturn(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="roi-years">
            Holding Period (Years) <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input id="roi-years" type="number" min="0" step="0.5" placeholder="e.g. 3"
            value={years}
            onChange={e => { setYears(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!cost || !returnVal}>
          Calculate ROI
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          {/* Hero ROI */}
          <div style={{
            textAlign: 'center',
            background: result.roi >= 0
              ? 'linear-gradient(135deg, #0f172a, #134e4a)'
              : 'linear-gradient(135deg, #0f172a, #450a0a)',
            borderRadius: 'var(--radius)',
            padding: '22px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
              Return on Investment
            </div>
            <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: result.roi >= 0 ? '#5eead4' : '#fca5a5' }}>
              {fmtPct(result.roi)}
            </div>
            {parseFloat(years) > 1 && (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '8px' }}>
                Annualised ROI: {fmtPct(result.annualisedRoi)} per year
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '16px' }}>
            <ResultRow label="Total Investment"   value={fmt(result.c, currency)} />
            <ResultRow label="Total Return"        value={fmt(result.r, currency)} />
            <ResultRow label="Net Profit / Loss"
              value={fmt(result.netProfit, currency)}
              positive={result.netProfit >= 0}
              negative={result.netProfit < 0} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
                ROI
                <ROIBadge roi={result.roi} />
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: result.roi >= 0 ? 'var(--accent)' : '#dc2626', letterSpacing: '-0.02em' }}>
                {fmtPct(result.roi)}
              </span>
            </div>
            {parseFloat(years) > 0 && (
              <ResultRow label={`Annualised ROI (over ${result.y} yrs)`} value={fmtPct(result.annualisedRoi)} />
            )}
            <ResultRow label="Return Multiple" value={`${result.multiple.toFixed(2)}×`} />
          </div>

          {/* Visual bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ height: '14px', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${Math.min((result.c / Math.max(result.r, result.c)) * 100, 100)}%`,
                background: '#64748b',
              }} />
              {result.netProfit > 0 && (
                <div style={{ flex: 1, background: '#16a34a' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '6px' }}>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#64748b', marginRight: '5px', verticalAlign: 'middle' }} />
                Cost {((result.c / Math.max(result.r, result.c)) * 100).toFixed(1)}%
              </span>
              {result.netProfit > 0 && (
                <span>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#16a34a', marginRight: '5px', verticalAlign: 'middle' }} />
                  Profit {((result.netProfit / result.r) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 2: Marketing / Campaign ROI ──────────────────────
function MarketingROI({ currency }) {
  const [spend, setSpend]       = useState('');
  const [revenue, setRevenue]   = useState('');
  const [cogs, setCogs]         = useState('');
  const [result, setResult]     = useState(null);

  const calculate = () => {
    const s = parseFloat(spend);
    const r = parseFloat(revenue);
    const c = parseFloat(cogs) || 0;
    if (isNaN(s) || isNaN(r) || s <= 0) return;

    const grossProfit  = r - c;
    const netProfit    = grossProfit - s;
    const roi          = ((grossProfit - s) / s) * 100;
    const roas         = r / s; // Return on Ad Spend
    const breakEvenRev = s + c;

    setResult({ s, r, c, grossProfit, netProfit, roi, roas, breakEvenRev });
  };

  const reset = () => { setSpend(''); setRevenue(''); setCogs(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Marketing / Campaign ROI</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="mkt-spend">Marketing Spend</label>
          <input id="mkt-spend" type="number" min="0" placeholder="e.g. 5000"
            value={spend}
            onChange={e => { setSpend(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="mkt-revenue">Revenue Generated</label>
          <input id="mkt-revenue" type="number" min="0" placeholder="e.g. 20000"
            value={revenue}
            onChange={e => { setRevenue(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="mkt-cogs">
            Cost of Goods Sold <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input id="mkt-cogs" type="number" min="0" placeholder="e.g. 8000"
            value={cogs}
            onChange={e => { setCogs(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!spend || !revenue}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Marketing Spend"     value={fmt(result.s, currency)} />
          <ResultRow label="Revenue Generated"   value={fmt(result.r, currency)} />
          {result.c > 0 && <ResultRow label="Cost of Goods (COGS)" value={fmt(result.c, currency)} muted />}
          <ResultRow label="Gross Profit"        value={fmt(result.grossProfit, currency)} positive={result.grossProfit >= 0} />
          <ResultRow label="Net Profit (after spend)" value={fmt(result.netProfit, currency)} positive={result.netProfit >= 0} negative={result.netProfit < 0} />
          <ResultRow label="Marketing ROI"       value={fmtPct(result.roi)} highlight />
          <ResultRow label="ROAS (Return on Ad Spend)" value={`${result.roas.toFixed(2)}×`} />
          <ResultRow label="Break-even Revenue"  value={fmt(result.breakEvenRev, currency)} muted />
        </div>
      )}
    </div>
  );
}

// ── Section 3: Compare multiple investments ───────────────────
function CompareROI({ currency }) {
  const [investments, setInvestments] = useState([
    { id: 1, name: 'Investment A', cost: '', returnVal: '', years: '' },
    { id: 2, name: 'Investment B', cost: '', returnVal: '', years: '' },
  ]);
  const [results, setResults] = useState(null);

  const update = (id, field, val) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, [field]: val } : inv));
    setResults(null);
  };

  const addRow = () => {
    const id = Date.now();
    setInvestments(prev => [...prev, { id, name: `Investment ${String.fromCharCode(65 + prev.length)}`, cost: '', returnVal: '', years: '' }]);
    setResults(null);
  };

  const removeRow = (id) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    setResults(null);
  };

  const calculate = () => {
    const calc = investments.map(inv => {
      const c = parseFloat(inv.cost);
      const r = parseFloat(inv.returnVal);
      const y = parseFloat(inv.years) || 1;
      if (isNaN(c) || isNaN(r) || c <= 0) return { ...inv, valid: false };
      const roi          = ((r - c) / c) * 100;
      const annualisedRoi = (Math.pow(r / c, 1 / y) - 1) * 100;
      const netProfit    = r - c;
      return { ...inv, c, r, y, roi, annualisedRoi, netProfit, valid: true };
    }).filter(i => i.valid);

    if (calc.length === 0) return;
    calc.sort((a, b) => b.annualisedRoi - a.annualisedRoi);
    setResults(calc);
  };

  const reset = () => {
    setInvestments([
      { id: 1, name: 'Investment A', cost: '', returnVal: '', years: '' },
      { id: 2, name: 'Investment B', cost: '', returnVal: '', years: '' },
    ]);
    setResults(null);
  };

  return (
    <div className="tool-box">
      <h2 className="tool-box-title">Compare Multiple Investments</h2>

      <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Name', 'Cost', 'Return', 'Years', ''].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {investments.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 4px' }}>
                  <input type="text" value={inv.name}
                    onChange={e => update(inv.id, 'name', e.target.value)}
                    style={{ width: '120px', fontFamily: 'var(--font)' }} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input type="number" min="0" value={inv.cost} placeholder="0"
                    onChange={e => update(inv.id, 'cost', e.target.value)}
                    style={{ width: '100px' }} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input type="number" min="0" value={inv.returnVal} placeholder="0"
                    onChange={e => update(inv.id, 'returnVal', e.target.value)}
                    style={{ width: '100px' }} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  <input type="number" min="0" step="0.5" value={inv.years} placeholder="1"
                    onChange={e => update(inv.id, 'years', e.target.value)}
                    style={{ width: '70px' }} />
                </td>
                <td style={{ padding: '6px 4px' }}>
                  {investments.length > 2 && (
                    <button onClick={() => removeRow(inv.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: '#ef4444' }}>✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btn-group" style={{ marginBottom: results ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate}>Compare</button>
        <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Row</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {results && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Rank', 'Name', 'Net Profit', 'ROI', 'Annualised ROI'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((inv, i) => (
                <tr key={inv.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i === 0 ? 'var(--accent-light)' : 'transparent',
                }}>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: i === 0 ? 'var(--accent-hover)' : 'var(--text-3)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : `#${i + 1}`}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{inv.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: inv.netProfit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {fmt(inv.netProfit, currency)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtPct(inv.roi)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{fmtPct(inv.annualisedRoi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function ROICalculator() {
  const [currency, setCurrency] = useState('$');

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>ROI Calculator</span>
          </div>
          <h1>ROI Calculator</h1>
          <p className="subtitle">
            Calculate return on investment, annualised ROI, marketing ROAS, and compare multiple investments side by side.
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
        <BasicROI currency={currency} />
        <MarketingROI currency={currency} />
        <CompareROI currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>What Is ROI and How Is It Calculated?</h2>
          <p>
            Return on Investment (ROI) is a performance metric that measures the efficiency or
            profitability of an investment relative to its cost. The basic formula is simple:
            ROI = (Net Profit ÷ Investment Cost) × 100. A 45% ROI means you earned 45 cents
            of profit for every dollar invested. ROI is used across every type of investment —
            stocks, real estate, business projects, marketing campaigns, and equipment purchases —
            making it one of the most universally understood financial metrics.
          </p>
          <p>
            When comparing investments held for different time periods, annualised ROI is more
            useful than simple ROI. A 100% return over 10 years is far less impressive than a
            100% return over 2 years. Annualised ROI converts the total return into an equivalent
            yearly rate, allowing fair comparison between investments of different durations.
            This calculator shows both figures whenever a holding period is entered.
          </p>
          <p>
            For marketing and advertising, ROAS (Return on Ad Spend) is the standard metric —
            it tells you how many dollars of revenue are generated for every dollar spent on
            advertising. The marketing ROI section goes further by accounting for the cost of
            goods sold, giving you net profit after both the marketing spend and production costs.
            The comparison tool lets you rank multiple investments by annualised ROI so you can
            identify where your money works hardest.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>ROI Calculation Examples</h2>
          <p>
            <strong>Example 1 — Stock investment:</strong> You invest $15,000 and sell after
            4 years for $23,500. Net profit = $8,500. ROI = 56.67%.
            Annualised ROI = (23,500/15,000)^(1/4) − 1 = 11.94% per year.
          </p>
          <p>
            <strong>Example 2 — Real estate:</strong> Property purchased for R1,200,000, sold
            for R1,750,000 after 5 years. Net profit = R550,000. ROI = 45.83%.
            Annualised ROI ≈ 7.83% per year.
          </p>
          <p>
            <strong>Example 3 — Marketing campaign:</strong> Ad spend of $3,000 generated
            $18,000 in revenue with $9,000 COGS. Gross profit = $9,000. Net profit after spend
            = $6,000. Marketing ROI = 200%. ROAS = 6× (every $1 spent returned $6 in revenue).
          </p>
          <p>
            <strong>Example 4 — Comparing investments:</strong> Investment A: $5,000 → $8,000
            over 3 years (annualised ROI 16.96%). Investment B: $5,000 → $12,000 over 6 years
            (annualised ROI 15.73%). Investment A wins on annualised ROI despite B having a
            higher total return — time matters.
          </p>
        </div>

        <RelatedTools currentId="roi-calculator" />
      </div>
    </div>
  );
}
