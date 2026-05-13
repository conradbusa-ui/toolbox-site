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

function MarginBadge({ pct }) {
  const color = pct >= 30 ? '#16a34a'
    : pct >= 15 ? '#f59e0b'
    : pct >= 0  ? '#f97316'
    : '#dc2626';
  const label = pct >= 30 ? 'Healthy'
    : pct >= 15 ? 'Moderate'
    : pct >= 0  ? 'Low'
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

// ── Section 1: Margin from cost & revenue ─────────────────────
function MarginFromCostRevenue({ currency }) {
  const [revenue, setRevenue]   = useState('');
  const [cost, setCost]         = useState('');
  const [result, setResult]     = useState(null);

  const calculate = () => {
    const r = parseFloat(revenue);
    const c = parseFloat(cost);
    if (isNaN(r) || isNaN(c) || r <= 0) return;
    const grossProfit   = r - c;
    const grossMargin   = (grossProfit / r) * 100;
    const markup        = c > 0 ? ((r - c) / c) * 100 : 0;
    setResult({ r, c, grossProfit, grossMargin, markup });
  };

  const reset = () => { setRevenue(''); setCost(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Profit Margin from Revenue & Cost</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="rc-revenue">Revenue (Selling Price)</label>
          <input id="rc-revenue" type="number" min="0" placeholder="e.g. 10000"
            value={revenue}
            onChange={e => { setRevenue(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="rc-cost">Cost (COGS / Total Cost)</label>
          <input id="rc-cost" type="number" min="0" placeholder="e.g. 7000"
            value={cost}
            onChange={e => { setCost(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!revenue || !cost}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginBottom: '16px' }}>
            <ResultRow label="Revenue"      value={fmt(result.r, currency)} />
            <ResultRow label="Cost"         value={fmt(result.c, currency)} />
            <ResultRow label="Gross Profit" value={fmt(result.grossProfit, currency)}
              positive={result.grossProfit >= 0} negative={result.grossProfit < 0} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
                Gross Profit Margin
                <MarginBadge pct={result.grossMargin} />
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                {fmtPct(result.grossMargin)}
              </span>
            </div>
            <ResultRow label="Markup (on cost)" value={fmtPct(result.markup)} />
          </div>

          {/* Visual bar */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ height: '14px', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${Math.min(Math.max((result.c / result.r) * 100, 0), 100)}%`,
                background: '#f97316',
              }} />
              <div style={{ flex: 1, background: '#16a34a' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '6px' }}>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#f97316', marginRight: '5px', verticalAlign: 'middle' }} />
                Cost {((result.c / result.r) * 100).toFixed(1)}%
              </span>
              <span>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#16a34a', marginRight: '5px', verticalAlign: 'middle' }} />
                Profit {Math.max(result.grossMargin, 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 2: Find selling price from cost + desired margin ──
function PriceFromMargin({ currency }) {
  const [cost, setCost]     = useState('');
  const [margin, setMargin] = useState('');
  const [result, setResult] = useState(null);

  const QUICK_MARGINS = ['10', '20', '25', '30', '40', '50'];

  const calculate = () => {
    const c = parseFloat(cost);
    const m = parseFloat(margin);
    if (isNaN(c) || isNaN(m) || c <= 0 || m >= 100) return;
    const sellingPrice = c / (1 - m / 100);
    const profit       = sellingPrice - c;
    const markup       = (profit / c) * 100;
    setResult({ c, m, sellingPrice, profit, markup });
  };

  const reset = () => { setCost(''); setMargin(''); setResult(null); };

  return (
    <div className="tool-box" style={{ marginBottom: '16px' }}>
      <h2 className="tool-box-title">Find Selling Price from Cost + Target Margin</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="pm-cost">Cost Price</label>
          <input id="pm-cost" type="number" min="0" placeholder="e.g. 5000"
            value={cost}
            onChange={e => { setCost(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="pm-margin">Target Profit Margin %</label>
          <input id="pm-margin" type="number" min="0" max="99" placeholder="e.g. 30"
            value={margin}
            onChange={e => { setMargin(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Quick Margins</label>
        <div className="tag-row">
          {QUICK_MARGINS.map(m => (
            <button key={m}
              className={`tag${margin === m ? ' active' : ''}`}
              onClick={() => { setMargin(m); setResult(null); }}>
              {m}%
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!cost || !margin}>
          Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Cost Price"    value={fmt(result.c, currency)} />
          <ResultRow label="Gross Profit"  value={fmt(result.profit, currency)} positive />
          <ResultRow label="Selling Price" value={fmt(result.sellingPrice, currency)} highlight />
          <ResultRow label="Profit Margin" value={fmtPct(result.m)} />
          <ResultRow label="Markup on Cost" value={fmtPct(result.markup)} />
        </div>
      )}
    </div>
  );
}

// ── Section 3: Margin from markup ────────────────────────────
function MarginFromMarkup({ currency }) {
  const [cost, setCost]     = useState('');
  const [markup, setMarkup] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const c  = parseFloat(cost);
    const mu = parseFloat(markup);
    if (isNaN(mu) || mu < 0) return;
    const sellingPrice = c > 0 ? c * (1 + mu / 100) : null;
    const margin       = (mu / (100 + mu)) * 100;
    setResult({ c, mu, sellingPrice, margin });
  };

  const reset = () => { setCost(''); setMarkup(''); setResult(null); };

  return (
    <div className="tool-box">
      <h2 className="tool-box-title">Convert Markup ↔ Profit Margin</h2>

      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="mu-cost">Cost Price (optional)</label>
          <input id="mu-cost" type="number" min="0" placeholder="e.g. 80"
            value={cost}
            onChange={e => { setCost(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="mu-markup">Markup %</label>
          <input id="mu-markup" type="number" min="0" placeholder="e.g. 25"
            value={markup}
            onChange={e => { setMarkup(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
      </div>

      <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
        <button className="btn btn-primary" onClick={calculate} disabled={!markup}>
          Convert
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
          <ResultRow label="Markup"         value={fmtPct(result.mu)} />
          <ResultRow label="Profit Margin"  value={fmtPct(result.margin)} highlight />
          {result.sellingPrice && (
            <ResultRow label="Selling Price" value={fmt(result.sellingPrice, currency)} />
          )}
          <div style={{
            marginTop: '12px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '0.82rem',
            color: 'var(--text-2)',
          }}>
            <strong>Key difference:</strong> Markup is calculated on cost. Margin is calculated on revenue.
            A {result.mu}% markup equals a {result.margin.toFixed(2)}% profit margin — always a lower percentage.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function ProfitMarginCalculator() {
  const [currency, setCurrency] = useState('$');

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Profit Margin Calculator</span>
          </div>
          <h1>Profit Margin Calculator</h1>
          <p className="subtitle">
            Calculate gross profit margin, find the right selling price, and convert between markup and margin — instantly.
          </p>
        </div>

        {/* Currency picker */}
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
        <MarginFromCostRevenue currency={currency} />
        <PriceFromMargin currency={currency} />
        <MarginFromMarkup currency={currency} />

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>What Is Profit Margin and Why Does It Matter?</h2>
          <p>
            Profit margin is one of the most important metrics in business — it tells you what percentage
            of revenue you keep as profit after costs. A 30% gross margin means that for every $100 in
            revenue, $30 is profit and $70 covers costs. Tracking your margin helps you price products
            correctly, compare performance against industry benchmarks, and make informed decisions about
            cost reduction or pricing strategy.
          </p>
          <p>
            This calculator covers three common profit margin tasks. The first calculates your gross
            profit margin and markup from a revenue and cost figure — useful when reviewing sales data or
            quoting jobs. The second works in reverse: enter your cost and the margin you want to achieve,
            and it tells you exactly what selling price to set. The quick-margin buttons (10% to 50%)
            let you instantly see what different target margins mean for your pricing.
          </p>
          <p>
            The third tool clarifies the often-confused difference between markup and margin. Markup is
            the percentage added to cost to arrive at a selling price. Margin is the percentage of the
            selling price that is profit. A 25% markup on a $100 item gives a selling price of $125 and
            a profit margin of 20% — not 25%. Confusing these two figures is a common and costly pricing
            mistake. All calculations run instantly in your browser with nothing stored or transmitted.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Profit Margin Calculation Examples</h2>
          <p>
            <strong>Example 1 — Retail product:</strong> You sell a product for $150 and it costs
            you $90 to buy. Gross profit = $60. Gross margin = 40%. Markup on cost = 66.7%.
          </p>
          <p>
            <strong>Example 2 — Setting a price:</strong> Your cost is $200 and you want a 35%
            profit margin. Selling price = $200 ÷ (1 − 0.35) = $307.69. Profit = $107.69.
            Markup on cost = 53.8%.
          </p>
          <p>
            <strong>Example 3 — Service business:</strong> A project billed at R15,000 costs
            R9,500 in labour and materials. Gross profit = R5,500. Margin = 36.7%.
          </p>
          <p>
            <strong>Example 4 — Markup vs margin:</strong> An item costs $50. You apply a 40%
            markup → selling price = $70. But the profit margin is not 40% — it's $20 ÷ $70 = 28.6%.
            This tool clarifies the difference instantly.
          </p>
        </div>

        <RelatedTools currentId="profit-margin-calculator" />
      </div>
    </div>
  );
}
