import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function ResultRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '1.3rem' : '1rem',
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--accent)' : 'var(--text)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
    </div>
  );
}

function fmt(n, currency) {
  return currency + parseFloat(n.toFixed(2)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DiscountCalculator() {
  const [original, setOriginal]   = useState('');
  const [discount, setDiscount]   = useState('');
  const [tax, setTax]             = useState('');
  const [currency, setCurrency]   = useState('$');
  const [result, setResult]       = useState(null);

  const calculate = () => {
    const price    = parseFloat(original);
    const disc     = parseFloat(discount) || 0;
    const taxRate  = parseFloat(tax) || 0;

    if (isNaN(price) || price <= 0) return;

    const savings      = price * (disc / 100);
    const discounted   = price - savings;
    const taxAmount    = discounted * (taxRate / 100);
    const finalPrice   = discounted + taxAmount;

    setResult({ price, disc, savings, discounted, taxAmount, finalPrice, taxRate });
  };

  const reset = () => {
    setOriginal('');
    setDiscount('');
    setTax('');
    setResult(null);
  };

  const currencies = ['$', '€', '£', 'R', '¥'];

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Discount Calculator</span>
          </div>
          <h1>Discount Calculator</h1>
          <p className="subtitle">Find the sale price, total savings, and final cost including tax — instantly.</p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Discount & Final Price</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currency-select">Currency</label>
              <select
                id="currency-select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%' }}
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="original-price">Original Price</label>
              <input
                id="original-price"
                type="number"
                min="0"
                placeholder="e.g. 199.99"
                value={original}
                onChange={e => { setOriginal(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="discount-pct">Discount %</label>
              <input
                id="discount-pct"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 20"
                value={discount}
                onChange={e => { setDiscount(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="tax-rate">Tax / VAT % <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input
                id="tax-rate"
                type="number"
                min="0"
                placeholder="e.g. 15"
                value={tax}
                onChange={e => { setTax(e.target.value); setResult(null); }}
                onKeyDown={e => e.key === 'Enter' && calculate()}
              />
            </div>
          </div>

          <div className="btn-group" style={{ marginBottom: result ? '20px' : 0 }}>
            <button
              className="btn btn-primary"
              onClick={calculate}
              disabled={!original || !discount}
            >
              Calculate
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>

          {result && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
              <ResultRow label="Original Price"    value={fmt(result.price, currency)} />
              <ResultRow label={`Discount (${result.disc}%)`} value={`− ${fmt(result.savings, currency)}`} />
              <ResultRow label="Price After Discount" value={fmt(result.discounted, currency)} />
              {result.taxRate > 0 && (
                <ResultRow label={`Tax / VAT (${result.taxRate}%)`} value={`+ ${fmt(result.taxAmount, currency)}`} />
              )}
              <div style={{ paddingTop: '4px' }}>
                <ResultRow label="Final Price" value={fmt(result.finalPrice, currency)} highlight />
              </div>
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
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>You save</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)' }}>
                  {fmt(result.savings, currency)} ({result.disc}% off)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* H2 + SEO content */}
        <div className="seo-content">
          <h2>How to Calculate a Discount</h2>
          <p>
            Working out a sale price by hand is easy to get wrong, especially when tax gets added back on top.
            This discount calculator does it in one step: enter the original price, the percentage off, and an
            optional tax or VAT rate, then hit Calculate to see the discounted price, the amount you save, and
            the final cost all at once.
          </p>
          <p>
            The formula is straightforward — savings equal the original price multiplied by the discount rate,
            and the sale price is what's left after subtracting those savings. If you add a tax rate, it's
            applied to the discounted price, not the original, which is how most retail and VAT calculations
            work in practice.
          </p>
          <p>
            Use this tool when shopping online during sales, comparing deals across stores, calculating staff
            or trade discounts, or working out VAT-inclusive prices. The currency selector covers common
            symbols so results are easy to read at a glance.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Discount Calculation Examples</h2>
          <p>
            <strong>Example 1 — Simple sale:</strong> A jacket costs $120 and is 25% off.
            Savings = $120 × 0.25 = $30. Sale price = $90.
          </p>
          <p>
            <strong>Example 2 — With VAT:</strong> A laptop is £800 with a 15% discount and 20% VAT.
            After discount: £800 − £120 = £680. VAT on £680 = £136. Final price = £816.
          </p>
          <p>
            <strong>Example 3 — South African VAT:</strong> An item is R500 with 10% off and 15% VAT.
            Discounted price = R450. VAT = R67.50. You pay R517.50.
          </p>
        </div>

        <RelatedTools currentId="discount-calculator" />
      </div>
    </div>
  );
}
