import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core SIP calculations ─────────────────────────────────────

// Future Value of SIP: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
// P = monthly investment, r = monthly rate, n = months
function sipFutureValue(monthlyAmount, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

// Total invested
function totalInvested(monthlyAmount, years) {
  return monthlyAmount * years * 12;
}

// Monthly SIP needed to reach goal
// P = FV × r / [((1 + r)^n - 1) × (1 + r)]
function monthlySIPForGoal(targetAmount, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return targetAmount / n;
  return targetAmount * r / ((Math.pow(1 + r, n) - 1) * (1 + r));
}

// Lump-sum future value: FV = P × (1 + r)^n
function lumpSumFV(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate / 100 / 12, years * 12);
}

// Year-by-year breakdown
function sipYearlyBreakdown(monthlyAmount, annualRate, years) {
  const rows = [];
  const r = annualRate / 100 / 12;
  let fv = 0;
  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    fv = r === 0
      ? monthlyAmount * n
      : monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const invested = monthlyAmount * n;
    rows.push({ year: y, invested, value: fv, gains: fv - invested });
  }
  return rows;
}

// Inflation-adjusted return
function realRate(nominalRate, inflationRate) {
  return ((1 + nominalRate / 100) / (1 + inflationRate / 100) - 1) * 100;
}

// Format helpers
function fmtCurrency(n, symbol = '₹', compact = false) {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (compact) {
    if (n >= 1e7) return `${symbol}${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `${symbol}${(n / 1e5).toFixed(2)} L`;
  }
  return `${symbol}${parseFloat(n.toFixed(0)).toLocaleString('en-IN')}`;
}

function fmt(n, dp = 2) {
  return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—';
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

// ── Growth chart (SVG bar chart) ──────────────────────────────

function GrowthChart({ rows, symbol }) {
  if (!rows.length) return null;
  const maxVal = rows[rows.length - 1].value;
  const W = 480, H = 160, PAD = 8;
  const barW = Math.max(2, (W - PAD * 2) / rows.length - 2);

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {rows.map((row, i) => {
          const x     = PAD + i * ((W - PAD * 2) / rows.length);
          const invH  = (row.invested / maxVal) * H;
          const valH  = (row.value    / maxVal) * H;
          return (
            <g key={row.year}>
              {/* Total value bar (teal) */}
              <rect x={x} y={H - valH} width={barW} height={valH}
                fill="var(--accent)" fillOpacity="0.25" rx="2" />
              {/* Invested bar (darker teal) */}
              <rect x={x} y={H - invH} width={barW} height={invH}
                fill="var(--accent)" fillOpacity="0.7" rx="2" />
            </g>
          );
        })}
        {/* Year labels every 5 years */}
        {rows.filter(r => r.year % 5 === 0 || r.year === 1).map(row => {
          const x = PAD + (row.year - 1) * ((W - PAD * 2) / rows.length) + barW / 2;
          return (
            <text key={row.year} x={x} y={H + 16}
              textAnchor="middle" fontSize="9" fill="var(--text-3)" fontFamily="var(--mono)">
              Y{row.year}
            </text>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', opacity: 0.7, borderRadius: 2, marginRight: 4 }} />Invested</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', opacity: 0.25, borderRadius: 2, marginRight: 4 }} />Gains</span>
      </div>
    </div>
  );
}

// ── Mode 1: SIP returns calculator ───────────────────────────

function SIPMode({ symbol, onSymbolChange }) {
  const [monthly,   setMonthly]   = useState('');
  const [rate,      setRate]      = useState('12');
  const [years,     setYears]     = useState('10');
  const [inflation, setInflation] = useState('');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState('');
  const [showYearly,setShowYearly]= useState(false);

  const RATE_PRESETS  = ['8', '10', '12', '15', '18'];
  const YEARS_PRESETS = ['5', '10', '15', '20', '25', '30'];

  function calculate() {
    const m = parseFloat(monthly);
    const r = parseFloat(rate);
    const y = parseFloat(years);
    const inf = parseFloat(inflation) || 0;

    if (isNaN(m) || m <= 0) { setError('Enter a valid monthly SIP amount.'); setResult(null); return; }
    if (isNaN(r) || r <= 0 || r > 100) { setError('Enter a valid annual return rate (1–100%).'); setResult(null); return; }
    if (isNaN(y) || y <= 0 || y > 50)  { setError('Enter a valid investment period (1–50 years).'); setResult(null); return; }

    const fv        = sipFutureValue(m, r, y);
    const invested  = totalInvested(m, y);
    const gains     = fv - invested;
    const gainsPct  = (gains / invested) * 100;
    const cagr      = (Math.pow(fv / invested, 1 / y) - 1) * 100;
    const rows      = sipYearlyBreakdown(m, r, y);
    const realR     = inf > 0 ? realRate(r, inf) : null;
    const realFV    = (realR !== null && realR > -100) ? sipFutureValue(m, realR, y) : null;

    setResult({ fv, invested, gains, gainsPct, cagr, rows, realFV, inf, m, r, y });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Monthly SIP: ${fmtCurrency(result.m, symbol)}`,
      `Duration: ${result.y} years`,
      `Annual return: ${result.r}%`,
      `Invested: ${fmtCurrency(result.invested, symbol)}`,
      `Est. returns: ${fmtCurrency(result.gains, symbol)}`,
      `Total value: ${fmtCurrency(result.fv, symbol)}`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate the future value of your Systematic Investment Plan based on monthly contribution, expected return, and investment duration.
      </p>

      {/* Currency */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['₹','$','£','€'].map(s => (
          <button key={s} onClick={() => { onSymbolChange(s); setResult(null); }}
            className={`tag${symbol === s ? ' active' : ''}`}
            style={{ minWidth: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            {s}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="form-row">
        <div className="form-group">
          <label>Monthly SIP amount ({symbol})</label>
          <input type="number" value={monthly} min="1"
            onChange={e => { setMonthly(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 5000" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Expected annual return (%)</label>
          <input type="number" value={rate} min="1" max="100" step="0.1"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="12" style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {RATE_PRESETS.map(p => (
              <button key={p} className={`tag${rate === p ? ' active' : ''}`}
                onClick={() => { setRate(p); setResult(null); }}>{p}%</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Investment period (years)</label>
          <input type="number" value={years} min="1" max="50"
            onChange={e => { setYears(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="10" style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {YEARS_PRESETS.map(p => (
              <button key={p} className={`tag${years === p ? ' active' : ''}`}
                onClick={() => { setYears(p); setResult(null); }}>{p}y</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Inflation rate (%) <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-3)' }}>optional</span></label>
          <input type="number" value={inflation} min="0" max="20" step="0.1"
            onChange={e => { setInflation(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 6" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setMonthly(''); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Big result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Estimated maturity value
            </div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtCurrency(result.fv, symbol, true)}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
              {fmtCurrency(result.fv, symbol)} after {result.y} years
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label="Invested"         value={fmtCurrency(result.invested, symbol, true)} sub={`${result.y * 12} months`} />
            <StatCard accent label="Est. returns" value={fmtCurrency(result.gains, symbol, true)} sub={`+${fmt(result.gainsPct, 1)}% on invested`} />
            <StatCard label="Total value"      value={fmtCurrency(result.fv, symbol, true)} />
            <StatCard label="Wealth ratio"     value={`${fmt(result.fv / result.invested, 2)}×`} sub="value / invested" />
          </div>

          {/* Wealth gauge */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>
              <span>Invested ({fmt((result.invested / result.fv) * 100, 1)}%)</span>
              <span>Returns ({fmt((result.gains / result.fv) * 100, 1)}%)</span>
            </div>
            <div style={{ height: '10px', borderRadius: '99px', overflow: 'hidden', background: 'var(--surface2)', display: 'flex' }}>
              <div style={{ width: `${(result.invested / result.fv) * 100}%`, background: 'var(--accent)', opacity: 0.8 }} />
              <div style={{ flex: 1, background: 'var(--accent)', opacity: 0.3 }} />
            </div>
          </div>

          {/* Inflation-adjusted */}
          {result.realFV && (
            <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              📊 At {result.inf}% inflation, the inflation-adjusted value of your corpus would be{' '}
              <strong style={{ color: 'var(--accent-hover)' }}>{fmtCurrency(result.realFV, symbol, true)}</strong>{' '}
              in today's money (real return: {fmt(realRate(result.r, result.inf), 2)}% p.a.).
            </div>
          )}

          {/* Growth chart */}
          <SectionTitle>Portfolio growth over time</SectionTitle>
          <GrowthChart rows={result.rows} symbol={symbol} />

          {/* Yearly breakdown */}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }}
            onClick={() => setShowYearly(v => !v)}>
            {showYearly ? '▼ Hide' : '▶ Show'} year-by-year breakdown
          </button>

          {showYearly && (
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Year', 'Invested', 'Returns', 'Total value', 'Gain %'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={row.year} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>Y{row.year}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)' }}>{fmtCurrency(row.invested, symbol, true)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: '#16a34a', fontWeight: 600 }}>{fmtCurrency(row.gains, symbol, true)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{fmtCurrency(row.value, symbol, true)}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-3)' }}>+{fmt((row.gains / row.invested) * 100, 1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Goal SIP (target amount → monthly SIP) ────────────

function GoalMode({ symbol, onSymbolChange }) {
  const [target,  setTarget]  = useState('');
  const [rate,    setRate]    = useState('12');
  const [years,   setYears]   = useState('10');
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');

  const RATE_PRESETS  = ['8', '10', '12', '15', '18'];
  const YEARS_PRESETS = ['5', '10', '15', '20', '30'];

  function calculate() {
    const t = parseFloat(target);
    const r = parseFloat(rate);
    const y = parseFloat(years);

    if (isNaN(t) || t <= 0) { setError('Enter a valid target amount.'); setResult(null); return; }
    if (isNaN(r) || r <= 0 || r > 100) { setError('Enter a valid return rate.'); setResult(null); return; }
    if (isNaN(y) || y <= 0 || y > 50)  { setError('Enter a valid period.'); setResult(null); return; }

    const monthly   = monthlySIPForGoal(t, r, y);
    const invested  = monthly * y * 12;
    const gains     = t - invested;

    // Compare rates
    const comparisons = [8, 10, 12, 15, 18].map(cr => ({
      rate: cr,
      monthly: monthlySIPForGoal(t, cr, y),
    }));

    setResult({ monthly, invested, gains, target: t, r, y, comparisons });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter your financial goal, expected return, and timeline to find out exactly how much you need to invest every month.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['₹','$','£','€'].map(s => (
          <button key={s} className={`tag${symbol === s ? ' active' : ''}`}
            style={{ minWidth: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
            onClick={() => { onSymbolChange(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Target amount ({symbol})</label>
          <input type="number" value={target} min="1"
            onChange={e => { setTarget(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 1000000" style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
        </div>
        <div className="form-group">
          <label>Expected annual return (%)</label>
          <input type="number" value={rate} min="1" max="100" step="0.1"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="12" style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {RATE_PRESETS.map(p => (
              <button key={p} className={`tag${rate === p ? ' active' : ''}`}
                onClick={() => { setRate(p); setResult(null); }}>{p}%</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Time period (years)</label>
          <input type="number" value={years} min="1" max="50"
            onChange={e => { setYears(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="10" style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {YEARS_PRESETS.map(p => (
              <button key={p} className={`tag${years === p ? ' active' : ''}`}
                onClick={() => { setYears(p); setResult(null); }}>{p}y</button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate SIP</button>
        <button className="btn btn-ghost" onClick={() => { setTarget(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Monthly SIP required
            </div>
            <div style={{ fontSize: 'clamp(1.8rem,6vw,3rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtCurrency(result.monthly, symbol, true)}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '6px' }}>
              to reach {fmtCurrency(result.target, symbol, true)} in {result.y} years at {result.r}%
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Monthly SIP"  value={fmtCurrency(result.monthly, symbol, true)}  />
            <StatCard label="Total invested" value={fmtCurrency(result.invested, symbol, true)} sub="your contribution" />
            <StatCard label="Market returns" value={fmtCurrency(result.gains, symbol, true)}    color="#16a34a" sub="wealth created" />
          </div>

          {/* Rate comparison */}
          <SectionTitle>SIP at different return rates</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Annual return', 'Monthly SIP needed', 'Total invested', 'You save vs 8%'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.comparisons.map((c, i) => {
                  const inv = c.monthly * result.y * 12;
                  const base = result.comparisons[0].monthly * result.y * 12;
                  const saving = base - inv;
                  const isActive = Math.abs(c.rate - result.r) < 0.5;
                  return (
                    <tr key={c.rate} style={{ borderBottom: '1px solid var(--border)', background: isActive ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {c.rate}% {isActive && '✓'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: isActive ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {fmtCurrency(c.monthly, symbol, true)}/mo
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>
                        {fmtCurrency(inv, symbol, true)}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: saving > 0 ? '#16a34a' : 'var(--text-3)', fontWeight: saving > 0 ? 600 : 400 }}>
                        {saving > 0 ? `Save ${fmtCurrency(saving, symbol, true)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: SIP vs Lump-sum comparison ───────────────────────

function CompareMode({ symbol, onSymbolChange }) {
  const [lumpSum,  setLumpSum]  = useState('');
  const [monthly,  setMonthly]  = useState('');
  const [rate,     setRate]     = useState('12');
  const [years,    setYears]    = useState('10');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  function calculate() {
    const ls = parseFloat(lumpSum);
    const m  = parseFloat(monthly);
    const r  = parseFloat(rate);
    const y  = parseFloat(years);

    if (isNaN(r) || r <= 0) { setError('Enter a valid return rate.'); setResult(null); return; }
    if (isNaN(y) || y <= 0) { setError('Enter a valid period.'); setResult(null); return; }
    if ((isNaN(ls) || ls <= 0) && (isNaN(m) || m <= 0)) {
      setError('Enter a lump-sum amount or monthly SIP amount (or both).'); setResult(null); return;
    }

    const sipFV  = !isNaN(m) && m > 0 ? sipFutureValue(m, r, y) : 0;
    const lumpFV = !isNaN(ls) && ls > 0 ? lumpSumFV(ls, r, y) : 0;
    const sipInv = !isNaN(m) && m > 0 ? m * y * 12 : 0;

    setResult({ sipFV, lumpFV, sipInv, lumpSum: ls || 0, monthly: m || 0, r, y, total: sipFV + lumpFV });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Compare the future value of a lump-sum investment against a monthly SIP — or combine both to see your total corpus.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['₹','$','£','€'].map(s => (
          <button key={s} className={`tag${symbol === s ? ' active' : ''}`}
            style={{ minWidth: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
            onClick={() => { onSymbolChange(s); setResult(null); }}>
            {s}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Lump-sum amount ({symbol}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
          <input type="number" value={lumpSum} min="0"
            onChange={e => { setLumpSum(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 100000" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Monthly SIP ({symbol}) <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>optional</span></label>
          <input type="number" value={monthly} min="0"
            onChange={e => { setMonthly(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 5000" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Annual return (%)</label>
          <input type="number" value={rate} min="1" max="100" step="0.1"
            onChange={e => { setRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="12" style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Duration (years)</label>
          <input type="number" value={years} min="1" max="50"
            onChange={e => { setYears(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="10" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Compare</button>
        <button className="btn btn-ghost" onClick={() => { setLumpSum(''); setMonthly(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {result.lumpSum > 0 && (
              <StatCard accent label={`Lump-sum FV (${symbol}${fmtCurrency(result.lumpSum,symbol,true).replace(symbol,'')})`}
                value={fmtCurrency(result.lumpFV, symbol, true)}
                sub={`${result.r}% for ${result.y}y`} />
            )}
            {result.monthly > 0 && (
              <StatCard accent label={`SIP FV (${symbol}${fmtCurrency(result.monthly,symbol,true).replace(symbol,'')}/mo)`}
                value={fmtCurrency(result.sipFV, symbol, true)}
                sub={`invested: ${fmtCurrency(result.sipInv, symbol, true)}`} />
            )}
            {result.lumpSum > 0 && result.monthly > 0 && (
              <StatCard label="Combined corpus" value={fmtCurrency(result.total, symbol, true)} color="#7c3aed" />
            )}
          </div>

          {result.lumpSum > 0 && result.monthly > 0 && (
            <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              💡 The lump-sum of <strong>{fmtCurrency(result.lumpSum, symbol, true)}</strong> grows to{' '}
              <strong style={{ color: 'var(--accent-hover)' }}>{fmtCurrency(result.lumpFV, symbol, true)}</strong>,
              {result.lumpFV > result.sipFV
                ? ` outperforming the SIP corpus by ${fmtCurrency(result.lumpFV - result.sipFV, symbol, true)}.`
                : ` while the SIP builds ${fmtCurrency(result.sipFV - result.lumpFV, symbol, true)} more wealth through regular investing.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'SIP Returns',   desc: 'how much will I have?' },
  { label: 'Goal SIP',      desc: 'how much should I invest?' },
  { label: 'SIP vs Lump Sum', desc: 'compare strategies' },
];

export default function SIPCalculator() {
  const [mode, setMode]       = useState(0);
  const [symbol, setSymbol]   = useState('₹');

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>SIP Calculator</span>
          </div>
          <h1>SIP Calculator</h1>
          <p className="subtitle">
            Calculate how much your monthly SIP investments will grow to, find the SIP needed to reach any financial goal, and compare SIP against lump-sum investing — with year-by-year projections and inflation adjustment.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <SIPMode  symbol={symbol} onSymbolChange={setSymbol} />}
          {mode === 1 && <GoalMode symbol={symbol} onSymbolChange={setSymbol} />}
          {mode === 2 && <CompareMode symbol={symbol} onSymbolChange={setSymbol} />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>What Is a SIP Calculator?</h2>
          <p>
            A Systematic Investment Plan (SIP) is a disciplined way to invest a fixed amount in mutual funds, stocks, or other instruments every month. A SIP calculator uses the future value of an annuity formula to show you what your regular contributions will compound to over time — making it one of the most useful tools in personal finance planning.
          </p>
          <p>
            The core formula is: <strong>FV = P × [((1 + r)ⁿ − 1) / r] × (1 + r)</strong>, where <em>P</em> is your monthly investment, <em>r</em> is the monthly interest rate (annual rate ÷ 12), and <em>n</em> is the total number of months. The extra <em>(1 + r)</em> multiplier accounts for investments made at the beginning of each period (annuity due).
          </p>
          <p>
            <strong>SIP Returns</strong> shows how much a fixed monthly investment will grow to over your chosen period at an assumed annual return. Equity mutual funds have historically delivered 12–15% annualised returns over long periods, though this is never guaranteed. The inflation adjustment feature shows the real purchasing power of your corpus in today's money — useful for retirement planning where nominal figures can be misleading.
          </p>
          <p>
            <strong>Goal SIP</strong> reverses the calculation: enter your target amount and timeline, and the calculator tells you exactly how much to invest monthly. The rate comparison table shows how dramatically the required SIP changes at different return assumptions — a powerful illustration of the value of a higher-returning instrument.
          </p>
          <p>
            <strong>SIP vs Lump Sum</strong> compares investing a fixed lump sum today against spreading the same or a different amount through monthly SIPs, helping you evaluate which strategy suits your current financial situation.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">SIP Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: '₹5,000/mo for 10y at 12%',      value: '₹11.6L',  sub: 'invested ₹6L, returns ₹5.6L' },
              { label: '₹10,000/mo for 20y at 12%',     value: '₹99.9L',  sub: 'invested ₹24L, returns ₹75.9L' },
              { label: 'Goal ₹50L in 15y at 12%',       value: '₹9,909/mo',sub: 'monthly SIP required' },
              { label: '₹1L lump sum, 10y at 12%',      value: '₹3.30L',  sub: 'vs SIP ₹5,000/mo = ₹11.6L' },
              { label: '₹5,000/mo for 30y at 12%',      value: '₹1.76 Cr',sub: 'power of long-term compounding' },
              { label: '$500/mo for 20y at 10%',        value: '$383K',   sub: 'invested $120K, returns $263K' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="sip-calculator" />
      </div>
    </div>
  );
}
