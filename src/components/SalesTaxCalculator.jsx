import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculations ─────────────────────────────────────────

function addTax(preTax, rate)       { return preTax * (1 + rate / 100); }
function removeTax(totalWithTax, rate) { return totalWithTax / (1 + rate / 100); }
function taxAmount(preTax, rate)    { return preTax * rate / 100; }
function effectiveRate(preTax, tax) { return (tax / preTax) * 100; }

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
}

function fmtCurrency(n, symbol = '$') {
  if (!isFinite(n) || isNaN(n)) return '—';
  return `${symbol}${parseFloat(n.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── US State sales tax rates (2025) ──────────────────────────

const US_STATE_RATES = [
  { state: 'Alabama',       code: 'AL', rate: 4.00 },
  { state: 'Alaska',        code: 'AK', rate: 0.00, note: 'No state tax' },
  { state: 'Arizona',       code: 'AZ', rate: 5.60 },
  { state: 'Arkansas',      code: 'AR', rate: 6.50 },
  { state: 'California',    code: 'CA', rate: 7.25, note: 'Highest base rate' },
  { state: 'Colorado',      code: 'CO', rate: 2.90 },
  { state: 'Connecticut',   code: 'CT', rate: 6.35 },
  { state: 'Delaware',      code: 'DE', rate: 0.00, note: 'No state tax' },
  { state: 'Florida',       code: 'FL', rate: 6.00 },
  { state: 'Georgia',       code: 'GA', rate: 4.00 },
  { state: 'Hawaii',        code: 'HI', rate: 4.00 },
  { state: 'Idaho',         code: 'ID', rate: 6.00 },
  { state: 'Illinois',      code: 'IL', rate: 6.25 },
  { state: 'Indiana',       code: 'IN', rate: 7.00 },
  { state: 'Iowa',          code: 'IA', rate: 6.00 },
  { state: 'Kansas',        code: 'KS', rate: 6.50 },
  { state: 'Kentucky',      code: 'KY', rate: 6.00 },
  { state: 'Louisiana',     code: 'LA', rate: 4.45 },
  { state: 'Maine',         code: 'ME', rate: 5.50 },
  { state: 'Maryland',      code: 'MD', rate: 6.00 },
  { state: 'Massachusetts', code: 'MA', rate: 6.25 },
  { state: 'Michigan',      code: 'MI', rate: 6.00 },
  { state: 'Minnesota',     code: 'MN', rate: 6.875 },
  { state: 'Mississippi',   code: 'MS', rate: 7.00 },
  { state: 'Missouri',      code: 'MO', rate: 4.225 },
  { state: 'Montana',       code: 'MT', rate: 0.00, note: 'No state tax' },
  { state: 'Nebraska',      code: 'NE', rate: 5.50 },
  { state: 'Nevada',        code: 'NV', rate: 6.85 },
  { state: 'New Hampshire', code: 'NH', rate: 0.00, note: 'No state tax' },
  { state: 'New Jersey',    code: 'NJ', rate: 6.625 },
  { state: 'New Mexico',    code: 'NM', rate: 5.00 },
  { state: 'New York',      code: 'NY', rate: 4.00, note: '+local avg 4.5%' },
  { state: 'North Carolina',code: 'NC', rate: 4.75 },
  { state: 'North Dakota',  code: 'ND', rate: 5.00 },
  { state: 'Ohio',          code: 'OH', rate: 5.75 },
  { state: 'Oklahoma',      code: 'OK', rate: 4.50 },
  { state: 'Oregon',        code: 'OR', rate: 0.00, note: 'No state tax' },
  { state: 'Pennsylvania',  code: 'PA', rate: 6.00 },
  { state: 'Rhode Island',  code: 'RI', rate: 7.00 },
  { state: 'South Carolina',code: 'SC', rate: 6.00 },
  { state: 'South Dakota',  code: 'SD', rate: 4.50 },
  { state: 'Tennessee',     code: 'TN', rate: 7.00 },
  { state: 'Texas',         code: 'TX', rate: 6.25 },
  { state: 'Utah',          code: 'UT', rate: 5.95 },
  { state: 'Vermont',       code: 'VT', rate: 6.00 },
  { state: 'Virginia',      code: 'VA', rate: 5.30 },
  { state: 'Washington',    code: 'WA', rate: 6.50 },
  { state: 'West Virginia', code: 'WV', rate: 6.00 },
  { state: 'Wisconsin',     code: 'WI', rate: 5.00 },
  { state: 'Wyoming',       code: 'WY', rate: 4.00 },
  { state: 'Washington DC', code: 'DC', rate: 6.00 },
].sort((a, b) => a.state.localeCompare(b.state));

// ── Country VAT rates ─────────────────────────────────────────

const COUNTRY_RATES = [
  { country: 'Australia',      code: 'AU', rate: 10,  name: 'GST'  },
  { country: 'Austria',        code: 'AT', rate: 20,  name: 'VAT'  },
  { country: 'Belgium',        code: 'BE', rate: 21,  name: 'VAT'  },
  { country: 'Brazil',         code: 'BR', rate: 17,  name: 'ICMS' },
  { country: 'Canada',         code: 'CA', rate: 5,   name: 'GST'  },
  { country: 'China',          code: 'CN', rate: 13,  name: 'VAT'  },
  { country: 'Denmark',        code: 'DK', rate: 25,  name: 'VAT'  },
  { country: 'Finland',        code: 'FI', rate: 25.5,name: 'VAT'  },
  { country: 'France',         code: 'FR', rate: 20,  name: 'VAT'  },
  { country: 'Germany',        code: 'DE', rate: 19,  name: 'VAT'  },
  { country: 'Greece',         code: 'GR', rate: 24,  name: 'VAT'  },
  { country: 'Hungary',        code: 'HU', rate: 27,  name: 'VAT',  note: 'Highest in EU' },
  { country: 'India',          code: 'IN', rate: 18,  name: 'GST',  note: 'Standard rate' },
  { country: 'Ireland',        code: 'IE', rate: 23,  name: 'VAT'  },
  { country: 'Italy',          code: 'IT', rate: 22,  name: 'VAT'  },
  { country: 'Japan',          code: 'JP', rate: 10,  name: 'JCT'  },
  { country: 'Mexico',         code: 'MX', rate: 16,  name: 'IVA'  },
  { country: 'Netherlands',    code: 'NL', rate: 21,  name: 'VAT'  },
  { country: 'New Zealand',    code: 'NZ', rate: 15,  name: 'GST'  },
  { country: 'Norway',         code: 'NO', rate: 25,  name: 'VAT'  },
  { country: 'Poland',         code: 'PL', rate: 23,  name: 'VAT'  },
  { country: 'Portugal',       code: 'PT', rate: 23,  name: 'VAT'  },
  { country: 'Russia',         code: 'RU', rate: 20,  name: 'VAT'  },
  { country: 'Saudi Arabia',   code: 'SA', rate: 15,  name: 'VAT'  },
  { country: 'Singapore',      code: 'SG', rate: 9,   name: 'GST'  },
  { country: 'South Africa',   code: 'ZA', rate: 15,  name: 'VAT'  },
  { country: 'South Korea',    code: 'KR', rate: 10,  name: 'VAT'  },
  { country: 'Spain',          code: 'ES', rate: 21,  name: 'IVA'  },
  { country: 'Sweden',         code: 'SE', rate: 25,  name: 'VAT'  },
  { country: 'Switzerland',    code: 'CH', rate: 8.1, name: 'VAT'  },
  { country: 'Turkey',         code: 'TR', rate: 20,  name: 'KDV'  },
  { country: 'UAE',            code: 'AE', rate: 5,   name: 'VAT'  },
  { country: 'United Kingdom', code: 'GB', rate: 20,  name: 'VAT'  },
  { country: 'United States',  code: 'US', rate: 0,   name: '—',   note: 'Varies by state' },
].sort((a, b) => a.country.localeCompare(b.country));

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
      <div style={{ fontSize: 'clamp(1.05rem,2.8vw,1.6rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Mode 1: Add / Remove tax ──────────────────────────────────

function AddRemoveMode() {
  const [amount,    setAmount]    = useState('');
  const [taxRate,   setTaxRate]   = useState('');
  const [mode,      setMode]      = useState('add'); // add | remove
  const [currency,  setCurrency]  = useState('$');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState('');

  const QUICK_RATES = ['5', '7.5', '10', '13', '15', '20', '21', '25'];

  function calculate() {
    const amt = parseFloat(amount);
    const rate = parseFloat(taxRate);
    if (isNaN(amt) || amt < 0)        { setError('Enter a valid amount.'); setResult(null); return; }
    if (isNaN(rate) || rate < 0 || rate > 100) { setError('Enter a valid tax rate (0–100%).'); setResult(null); return; }

    let preTax, tax, total;
    if (mode === 'add') {
      preTax = amt;
      tax    = taxAmount(preTax, rate);
      total  = preTax + tax;
    } else {
      total  = amt;
      preTax = removeTax(total, rate);
      tax    = total - preTax;
    }

    setResult({ preTax, tax, total, rate, mode, currency });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Pre-tax: ${fmtCurrency(result.preTax, result.currency)}`,
      `Tax (${result.rate}%): ${fmtCurrency(result.tax, result.currency)}`,
      `Total: ${fmtCurrency(result.total, result.currency)}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate the tax amount and final price for any purchase, or remove tax from a price that already includes it.
      </p>

      {/* Currency */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['$', '£', '€', 'A$', 'C$', 'R', '₹', '¥'].map(s => (
          <button key={s} className={`tag${currency === s ? ' active' : ''}`}
            style={{ minWidth: '38px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
            onClick={() => { setCurrency(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      {/* Add / remove toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'add',    label: '+ Add tax',     sub: 'price before tax' },
          { id: 'remove', label: '− Remove tax',  sub: 'price includes tax' },
        ].map(opt => (
          <button key={opt.id} onClick={() => { setMode(opt.id); setResult(null); }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${mode === opt.id ? 'var(--accent)' : 'var(--border)'}`,
              background: mode === opt.id ? 'var(--accent-light)' : 'var(--surface2)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: mode === opt.id ? 'var(--accent-hover)' : 'var(--text)' }}>{opt.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px' }}>{opt.sub}</div>
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{mode === 'add' ? 'Pre-tax amount' : 'Price (tax included)'} ({currency})</label>
          <input type="number" value={amount} min="0" step="0.01"
            onChange={e => { setAmount(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 100.00"
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Tax / VAT rate (%)</label>
          <input type="number" value={taxRate} min="0" max="100" step="0.1"
            onChange={e => { setTaxRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 20"
            style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {QUICK_RATES.map(r => (
              <button key={r} className={`tag${taxRate === r ? ' active' : ''}`}
                onClick={() => { setTaxRate(r); setResult(null); }}>{r}%</button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setAmount(''); setTaxRate(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          {/* Receipt-style breakdown */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '16px',
          }}>
            {/* Header */}
            <div style={{ background: 'var(--accent-hover)', padding: '10px 18px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tax breakdown</div>
            </div>
            {/* Lines */}
            {[
              { label: 'Pre-tax amount',   value: fmtCurrency(result.preTax, result.currency) },
              { label: `Tax (${result.rate}%)`,  value: fmtCurrency(result.tax, result.currency), color: '#dc2626' },
            ].map((line, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-2)' }}>{line.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: line.color || 'var(--text)' }}>{line.value}</span>
              </div>
            ))}
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--accent-light)' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>Total</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-hover)' }}>{fmtCurrency(result.total, result.currency)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Pre-tax"  value={fmtCurrency(result.preTax, result.currency)} />
            <StatCard accent label={`Tax (${result.rate}%)`} value={fmtCurrency(result.tax, result.currency)} color="#dc2626" />
            <StatCard accent label="Total" value={fmtCurrency(result.total, result.currency)} />
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Multi-item cart ───────────────────────────────────

function CartMode() {
  const [items, setItems] = useState([
    { name: 'Item 1', price: '', qty: '1', taxable: true },
    { name: 'Item 2', price: '', qty: '1', taxable: true },
  ]);
  const [taxRate,  setTaxRate]  = useState('');
  const [currency, setCurrency] = useState('$');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState('');

  function updateItem(i, field, val) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    setResult(null);
  }

  function calculate() {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) { setError('Enter a valid tax rate.'); setResult(null); return; }

    const rows = items.map(item => {
      const price = parseFloat(item.price) || 0;
      const qty   = parseFloat(item.qty) || 1;
      const subtotal = price * qty;
      const tax = item.taxable ? taxAmount(subtotal, rate) : 0;
      return { ...item, price, qty, subtotal, tax, total: subtotal + tax };
    });

    const subtotal   = rows.reduce((s, r) => s + r.subtotal, 0);
    const totalTax   = rows.reduce((s, r) => s + r.tax, 0);
    const grandTotal = subtotal + totalTax;

    setResult({ rows, subtotal, totalTax, grandTotal, rate, currency });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      ...result.rows.map(r => `${r.name}: ${fmtCurrency(r.total, result.currency)}`),
      `Subtotal: ${fmtCurrency(result.subtotal, result.currency)}`,
      `Tax (${result.rate}%): ${fmtCurrency(result.totalTax, result.currency)}`,
      `Total: ${fmtCurrency(result.grandTotal, result.currency)}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Add multiple items to calculate a full order total with tax, including per-item tax control.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 140px', margin: 0 }}>
          <label>Tax rate (%)</label>
          <input type="number" value={taxRate} min="0" max="100" step="0.1"
            onChange={e => { setTaxRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 8.5" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group" style={{ flex: '0 0 100px', margin: 0 }}>
          <label>Currency</label>
          <select value={currency} onChange={e => { setCurrency(e.target.value); setResult(null); }}
            style={{ fontFamily: 'var(--mono)' }}>
            {['$','£','€','A$','C$','R','₹','¥'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Item table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '460px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Item name', 'Price', 'Qty', 'Taxable', 'Subtotal', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const p = parseFloat(item.price) || 0;
              const q = parseFloat(item.qty)   || 1;
              const sub = p * q;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="text" value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)}
                      style={{ fontSize: '0.85rem', width: '130px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={item.price} min="0" step="0.01"
                      onChange={e => updateItem(i, 'price', e.target.value)}
                      placeholder="0.00" style={{ fontFamily: 'var(--mono)', width: '110px' }} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" value={item.qty} min="1"
                      onChange={e => updateItem(i, 'qty', e.target.value)}
                      style={{ fontFamily: 'var(--mono)', width: '80px' }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="checkbox" checked={item.taxable}
                      onChange={e => updateItem(i, 'taxable', e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent-hover)', whiteSpace: 'nowrap' }}>
                    {sub > 0 ? fmtCurrency(sub, currency) : '—'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <button onClick={() => { if (items.length > 1) { setItems(prev => prev.filter((_, idx) => idx !== i)); setResult(null); } }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '4px 6px' }}
                      onMouseEnter={e => e.target.style.color = '#dc2626'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="btn-group" style={{ marginTop: '10px' }}>
        <button className="btn btn-primary" onClick={calculate}>Calculate total</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setItems(prev => [...prev, { name: `Item ${prev.length + 1}`, price: '', qty: '1', taxable: true }]); setResult(null); }}>+ Add item</button>
        <button className="btn btn-ghost" onClick={() => { setItems([{ name: 'Item 1', price: '', qty: '1', taxable: true }, { name: 'Item 2', price: '', qty: '1', taxable: true }]); setResult(null); setError(''); }}>Reset</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Subtotal"  value={fmtCurrency(result.subtotal, result.currency)}   sub="before tax" />
            <StatCard accent label={`Tax (${result.rate}%)`} value={fmtCurrency(result.totalTax, result.currency)} color="#dc2626" />
            <StatCard accent label="Grand total" value={fmtCurrency(result.grandTotal, result.currency)} />
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 3: US State tax lookup ───────────────────────────────

function USStateMode() {
  const [amount,   setAmount]   = useState('');
  const [state,    setState]    = useState('');
  const [localRate,setLocalRate]= useState('');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const selectedState = US_STATE_RATES.find(s => s.code === state);

  function calculate() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) { setError('Enter a valid amount.'); setResult(null); return; }
    if (!selectedState) { setError('Select a state.'); setResult(null); return; }

    const stateRate = selectedState.rate;
    const localR    = parseFloat(localRate) || 0;
    const combined  = stateRate + localR;
    const tax       = taxAmount(amt, combined);
    const total     = amt + tax;

    setResult({ amt, stateRate, localR, combined, tax, total, stateName: selectedState.state });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Look up the state sales tax rate for any US state and calculate the tax on any purchase. Add a local tax rate to get the combined rate.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Purchase amount ($)</label>
          <input type="number" value={amount} min="0" step="0.01"
            onChange={e => { setAmount(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 100.00" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>State</label>
          <select value={state} onChange={e => { setState(e.target.value); setResult(null); setError(''); }}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>
            <option value="">— Select state —</option>
            {US_STATE_RATES.map(s => (
              <option key={s.code} value={s.code}>
                {s.state} ({s.rate}%)
              </option>
            ))}
          </select>
          {selectedState?.note && (
            <p style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '3px' }}>⚠ {selectedState.note}</p>
          )}
        </div>
        <div className="form-group">
          <label>Local / county tax (%) <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional</span></label>
          <input type="number" value={localRate} min="0" max="10" step="0.1"
            onChange={e => { setLocalRate(e.target.value); setResult(null); }}
            placeholder="e.g. 2.5" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setAmount(''); setState(''); setLocalRate(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label={`${result.stateName} rate`} value={`${fmt(result.stateRate, 3)}%`} />
            {result.localR > 0 && <StatCard label="Local rate" value={`${fmt(result.localR, 2)}%`} />}
            <StatCard label="Combined rate" value={`${fmt(result.combined, 3)}%`} color="#dc2626" />
            <StatCard accent label="Tax amount"   value={`$${fmt(result.tax, 2)}`}   />
            <StatCard accent label="Total (incl. tax)" value={`$${fmt(result.total, 2)}`} />
          </div>
        </div>
      )}

      {/* State rate table */}
      <SectionTitle>All US state tax rates</SectionTitle>
      <div style={{ overflowX: 'auto', maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['State', 'Code', 'State rate', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {US_STATE_RATES.map((s, i) => (
              <tr key={s.code}
                onClick={() => { setState(s.code); setResult(null); }}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: s.code === state ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                <td style={{ padding: '7px 12px', fontWeight: s.code === state ? 700 : 500, color: s.code === state ? 'var(--accent-hover)' : 'var(--text)' }}>{s.state}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>{s.code}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: s.rate === 0 ? '#16a34a' : s.rate >= 7 ? '#dc2626' : 'var(--text)' }}>
                  {s.rate === 0 ? 'None' : `${s.rate}%`}
                </td>
                <td style={{ padding: '7px 12px', fontSize: '0.75rem', color: 'var(--text-3)' }}>{s.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mode 4: Global VAT lookup ─────────────────────────────────

function GlobalVATMode() {
  const [amount,   setAmount]   = useState('');
  const [country,  setCountry]  = useState('');
  const [currency, setCurrency] = useState('$');
  const [mode,     setMode]     = useState('add');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  const selectedCountry = COUNTRY_RATES.find(c => c.code === country);

  function calculate() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) { setError('Enter a valid amount.'); setResult(null); return; }
    if (!selectedCountry || selectedCountry.rate === 0) { setError('Select a country with a VAT rate.'); setResult(null); return; }

    const rate = selectedCountry.rate;
    let preTax, tax, total;
    if (mode === 'add') {
      preTax = amt; tax = taxAmount(preTax, rate); total = preTax + tax;
    } else {
      total = amt; preTax = removeTax(total, rate); tax = total - preTax;
    }

    setResult({ preTax, tax, total, rate, countryName: selectedCountry.country, taxName: selectedCountry.name, currency });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Look up VAT / GST rates for 30+ countries and calculate tax on any purchase.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {['$','£','€','A$','C$','¥','₹','R'].map(s => (
          <button key={s} className={`tag${currency === s ? ' active' : ''}`}
            style={{ minWidth: '38px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
            onClick={() => { setCurrency(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount ({currency})</label>
          <input type="number" value={amount} min="0" step="0.01"
            onChange={e => { setAmount(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 100.00" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Country</label>
          <select value={country} onChange={e => { setCountry(e.target.value); setResult(null); setError(''); }}
            style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>
            <option value="">— Select country —</option>
            {COUNTRY_RATES.filter(c => c.rate > 0).map(c => (
              <option key={c.code} value={c.code}>{c.country} — {c.name} {c.rate}%</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Mode</label>
          <select value={mode} onChange={e => { setMode(e.target.value); setResult(null); }} style={{ fontFamily: 'var(--mono)' }}>
            <option value="add">Add {selectedCountry?.taxName || 'VAT'}</option>
            <option value="remove">Remove {selectedCountry?.taxName || 'VAT'}</option>
          </select>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setAmount(''); setCountry(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Pre-tax" value={fmtCurrency(result.preTax, result.currency)} />
            <StatCard accent label={`${result.taxName} (${result.rate}%)`} value={fmtCurrency(result.tax, result.currency)} color="#dc2626" />
            <StatCard accent label="Total" value={fmtCurrency(result.total, result.currency)} />
          </div>
        </div>
      )}

      {/* Country table */}
      <SectionTitle>VAT / GST rates by country</SectionTitle>
      <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Country', 'Tax name', 'Standard rate', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COUNTRY_RATES.map((c, i) => (
              <tr key={c.code}
                onClick={() => { if (c.rate > 0) { setCountry(c.code); setResult(null); } }}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: c.code === country ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent',
                  cursor: c.rate > 0 ? 'pointer' : 'default',
                  opacity: c.rate === 0 ? 0.6 : 1,
                }}>
                <td style={{ padding: '7px 12px', fontWeight: c.code === country ? 700 : 500, color: c.code === country ? 'var(--accent-hover)' : 'var(--text)' }}>{c.country}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-3)' }}>{c.name}</td>
                <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: c.rate === 0 ? 'var(--text-3)' : c.rate >= 24 ? '#dc2626' : 'var(--text)' }}>
                  {c.rate === 0 ? 'None' : `${c.rate}%`}
                </td>
                <td style={{ padding: '7px 12px', fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Add / Remove Tax', desc: 'single item'         },
  { label: 'Cart Calculator', desc: 'multi-item order'     },
  { label: 'US State Tax',    desc: 'all 50 state rates'   },
  { label: 'Global VAT',      desc: '30+ country rates'    },
];

export default function SalesTaxCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Sales Tax Calculator</span>
          </div>
          <h1>Sales Tax Calculator</h1>
          <p className="subtitle">
            Add or remove sales tax, calculate multi-item cart totals, look up US state tax rates, and find VAT/GST rates for 30+ countries — all in one tool.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {mode === 0 && <AddRemoveMode />}
          {mode === 1 && <CartMode />}
          {mode === 2 && <USStateMode />}
          {mode === 3 && <GlobalVATMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Sales Tax Calculator</h2>
          <p>
            This free sales tax and VAT calculator handles every common tax calculation in one tool. Whether you need to add tax to a price, find out the pre-tax amount from a total, or look up rates for a specific US state or country, it's all here.
          </p>
          <p>
            <strong>Add / Remove Tax</strong> is the simplest mode. To add tax, enter the pre-tax price and the tax rate, and the calculator shows the tax amount and total price. To remove tax from a price-inclusive amount — for example, to find out how much VAT is included in a receipt total — switch to Remove Tax mode. The reverse formula is: pre-tax = total ÷ (1 + rate/100).
          </p>
          <p>
            <strong>Cart Calculator</strong> handles multi-item orders with individual tax control per line item. Useful for receipts where some items are taxable and others (like groceries or medicine) are exempt. Enter item names, prices, and quantities, toggle taxable on or off per item, and get a full breakdown with subtotal, tax, and grand total.
          </p>
          <p>
            <strong>US State Tax</strong> provides the current state sales tax rate for all 50 US states plus Washington DC, with an optional local/county tax field to calculate the combined rate. Note that actual total rates vary by city — the state rate is the floor, not the ceiling.
          </p>
          <p>
            <strong>Global VAT</strong> lists the standard VAT, GST, or equivalent consumption tax rate for 30+ countries, from 5% (UAE, Canada) to 27% (Hungary). Rates are standard rates — most countries have reduced rates for essentials like food and medicine.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Tax Calculation Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '$100 + 8.5% sales tax',        value: '$108.50',  sub: '$8.50 tax' },
              { label: '£120 total — remove 20% VAT', value: '£100',     sub: '£20 VAT included' },
              { label: '$250 in California (7.25%)',   value: '$268.13',  sub: 'state rate only' },
              { label: '€500 + 19% German VAT',        value: '€595.00',  sub: '€95.00 MwSt' },
              { label: 'Cart: $45+$30+$15 at 10%',     value: '$99.00',   sub: '$9.00 tax on $90' },
              { label: '¥10,000 + 10% Japan JCT',      value: '¥11,000',  sub: '¥1,000 consumption tax' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="sales-tax-calculator" />
      </div>
    </div>
  );
}
