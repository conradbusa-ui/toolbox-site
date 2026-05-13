import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

// ── Currency list ─────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',           symbol: '$'  },
  { code: 'EUR', name: 'Euro',                symbol: '€'  },
  { code: 'GBP', name: 'British Pound',       symbol: '£'  },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R'  },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥'  },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥'  },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹'  },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso',        symbol: '$'  },
  { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar',    symbol: 'HK$'},
  { code: 'NOK', name: 'Norwegian Krone',     symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona',       symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone',        symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar',  symbol: 'NZ$'},
  { code: 'AED', name: 'UAE Dirham',          symbol: 'د.إ'},
  { code: 'SAR', name: 'Saudi Riyal',         symbol: '﷼'  },
  { code: 'KES', name: 'Kenyan Shilling',     symbol: 'KSh'},
  { code: 'NGN', name: 'Nigerian Naira',      symbol: '₦'  },
  { code: 'EGP', name: 'Egyptian Pound',      symbol: '£'  },
  { code: 'GHS', name: 'Ghanaian Cedi',       symbol: '₵'  },
  { code: 'TZS', name: 'Tanzanian Shilling',  symbol: 'TSh'},
  { code: 'PKR', name: 'Pakistani Rupee',     symbol: '₨'  },
  { code: 'BDT', name: 'Bangladeshi Taka',    symbol: '৳'  },
  { code: 'IDR', name: 'Indonesian Rupiah',   symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit',   symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso',     symbol: '₱'  },
  { code: 'THB', name: 'Thai Baht',           symbol: '฿'  },
  { code: 'PLN', name: 'Polish Zloty',        symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna',        symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint',    symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu',        symbol: 'lei'},
  { code: 'TRY', name: 'Turkish Lira',        symbol: '₺'  },
  { code: 'ILS', name: 'Israeli Shekel',      symbol: '₪'  },
  { code: 'CLP', name: 'Chilean Peso',        symbol: '$'  },
  { code: 'COP', name: 'Colombian Peso',      symbol: '$'  },
  { code: 'ARS', name: 'Argentine Peso',      symbol: '$'  },
];

const POPULAR = ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'AUD', 'CAD', 'CHF'];

function fmtAmount(n, code) {
  if (isNaN(n)) return '—';
  const decimals = ['JPY', 'KRW', 'IDR', 'HUF', 'CLP', 'COP', 'TZS', 'NGN'].includes(code) ? 0 : 2;
  return n.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency]     = useState('ZAR');
  const [amount, setAmount]             = useState('1');
  const [rates, setRates]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [toast, setToast]               = useState('');

  // Fetch live rates from open.er-api.com (free, no key needed)
  const fetchRates = useCallback(async (base) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const data = await res.json();
      if (data.result === 'success') {
        setRates({ base, data: data.rates });
        setLastUpdated(Date.now());
      } else {
        setError('Could not fetch live rates. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRates(fromCurrency);
  }, [fromCurrency, fetchRates]);

  const getResult = () => {
    if (!rates || !rates.data) return null;
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) return null;
    const rate = rates.data[toCurrency];
    if (!rate) return null;
    return { value: val * rate, rate };
  };

  const swap = () => {
    const newFrom = toCurrency;
    const newTo   = fromCurrency;
    setFromCurrency(newFrom);
    setToCurrency(newTo);
    // rates will refetch via useEffect
  };

  const result = getResult();

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(fmtAmount(result.value, toCurrency)).then(() => {
      setToast('Copied!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  const fromInfo = CURRENCIES.find(c => c.code === fromCurrency);
  const toInfo   = CURRENCIES.find(c => c.code === toCurrency);

  // All conversions for quick reference
  const quickConversions = rates
    ? POPULAR.filter(c => c !== fromCurrency).map(code => {
        const info = CURRENCIES.find(c => c.code === code);
        const r    = rates.data[code];
        const val  = parseFloat(amount || 1) * r;
        return { code, name: info?.name, symbol: info?.symbol, value: val, rate: r };
      })
    : [];

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Currency Converter</span>
          </div>
          <h1>Currency Converter</h1>
          <p className="subtitle">
            Convert between 40+ world currencies using live exchange rates updated daily.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">
            Convert Currency
            {lastUpdated && (
              <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-3)', marginLeft: '10px' }}>
                Rates updated {timeAgo(lastUpdated)}
              </span>
            )}
          </h2>

          {/* Amount input */}
          <div className="form-group">
            <label htmlFor="amount-input">Amount</label>
            <input
              id="amount-input"
              type="number"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontSize: '1.2rem', fontWeight: 600 }}
            />
          </div>

          {/* From / Swap / To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '16px' }}>

            {/* From */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="from-currency">From</label>
              <select
                id="from-currency"
                value={fromCurrency}
                onChange={e => setFromCurrency(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            {/* Swap */}
            <div style={{ paddingBottom: '2px', textAlign: 'center' }}>
              <button
                className="btn btn-ghost"
                onClick={swap}
                title="Swap currencies"
                style={{ fontSize: '1.2rem', padding: '10px 14px' }}
              >
                ⇄
              </button>
            </div>

            {/* To */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="to-currency">To</label>
              <select
                id="to-currency"
                value={toCurrency}
                onChange={e => setToCurrency(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: '#991b1b', fontSize: '0.85rem', marginBottom: '12px',
            }}>
              {error}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: '10px' }}
                onClick={() => fetchRates(fromCurrency)}>Retry</button>
            </div>
          )}

          {/* Result */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-3)', fontSize: '0.9rem' }}>
              Loading live rates…
            </div>
          ) : result ? (
            <div>
              {/* Big result */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                borderRadius: 'var(--radius)',
                padding: '24px 20px',
                marginBottom: '16px',
                cursor: 'pointer',
              }} onClick={copyResult} title="Click to copy">
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '6px' }}>
                  {fmtAmount(parseFloat(amount) || 1, fromCurrency)} {fromInfo?.name} equals
                </div>
                <div style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: 700, color: '#5eead4', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {toInfo?.symbol}{fmtAmount(result.value, toCurrency)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '8px' }}>
                  {toCurrency} · {toInfo?.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                  click to copy
                </div>
              </div>

              {/* Exchange rate */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '20px',
              }}>
                <span>
                  <strong>1 {fromCurrency}</strong> = <strong style={{ color: 'var(--accent)' }}>{fmtAmount(result.rate, toCurrency)} {toCurrency}</strong>
                </span>
                <span>
                  <strong>1 {toCurrency}</strong> = <strong style={{ color: 'var(--accent)' }}>{fmtAmount(1 / result.rate, fromCurrency)} {fromCurrency}</strong>
                </span>
              </div>

              {/* Quick popular conversions */}
              {quickConversions.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                    {parseFloat(amount) || 1} {fromCurrency} in popular currencies
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {quickConversions.map(c => (
                      <div
                        key={c.code}
                        style={{
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                          cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                        onClick={() => setToCurrency(c.code)}
                        title={`Switch to ${c.code}`}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '3px' }}>
                          {c.code} · {c.name}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                          {c.symbol}{fmtAmount(c.value, c.code)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fetchRates(fromCurrency)}
              disabled={loading}
            >
              ↻ Refresh Rates
            </button>
          </div>
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How This Currency Converter Works</h2>
          <p>
            This currency converter fetches live exchange rates from a real-time data feed updated daily,
            so the rates you see reflect current market conditions rather than outdated static values baked
            into the tool. Select your source currency, choose your target currency, enter any amount, and
            the converted result appears immediately. The ⇄ swap button reverses the conversion in one click
            without re-entering anything.
          </p>
          <p>
            Exchange rates fluctuate constantly during trading hours as global currency markets respond to
            economic news, interest rate changes, inflation data, and geopolitical events. The rates shown
            here are mid-market rates — the midpoint between the buy and sell prices used by banks and
            brokers. Actual rates you receive from a bank, exchange bureau, or payment app will differ due
            to fees and spreads built into their service.
          </p>
          <p>
            The quick-reference panel at the bottom shows your amount converted into the most commonly used
            currencies at a glance — useful when comparing prices across multiple markets or planning travel
            across several countries. Click any currency card to switch it into the main converter. Over
            40 currencies are supported, covering major world currencies, African currencies, and popular
            emerging market currencies.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Currency Conversion Examples</h2>
          <p>
            <strong>Travel planning:</strong> If you're travelling from South Africa to the US and have
            R10,000 to spend, the converter tells you how many US dollars that is at today's rate — so you
            can budget accurately before you go.
          </p>
          <p>
            <strong>Online shopping:</strong> A product priced at £85 on a UK website converts to your
            local currency so you know the real cost before you check out, including before any card
            conversion fees.
          </p>
          <p>
            <strong>Freelance invoicing:</strong> If a client pays you $2,500 USD and you need to know
            how much that is in your home currency for tax or budgeting purposes, enter the amount and
            select your currency pair to get an up-to-date figure.
          </p>
          <p>
            <strong>Comparing salaries:</strong> A job offer of €60,000 in Germany versus $65,000 in the
            US — convert both to your home currency to make a fair comparison after exchange rates.
          </p>
        </div>

        <RelatedTools currentId="currency-converter" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
