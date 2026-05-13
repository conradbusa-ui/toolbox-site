import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Helpers ──────────────────────────────────────────────────
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function simplify(n, d) {
  if (d === 0) return { n: 0, d: 0, error: 'Division by zero' };
  const g = gcd(Math.abs(n), Math.abs(d));
  const sign = d < 0 ? -1 : 1;
  return { n: sign * n / g, d: sign * d / g };
}

function parseFraction(str) {
  str = str.trim();
  if (!str) return null;
  // Support mixed numbers: "1 2/3"
  const mixed = str.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1]);
    const num = parseInt(mixed[2]);
    const den = parseInt(mixed[3]);
    const sign = whole < 0 ? -1 : 1;
    return { n: whole * den + sign * num, d: den };
  }
  // Fraction: "2/3"
  const frac = str.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) return { n: parseInt(frac[1]), d: parseInt(frac[2]) };
  // Whole number
  const whole = str.match(/^(-?\d+)$/);
  if (whole) return { n: parseInt(whole[1]), d: 1 };
  return null;
}

function formatFraction({ n, d }, showMixed = true) {
  if (d === 0) return 'undefined';
  if (n === 0) return '0';
  if (d === 1) return `${n}`;
  if (showMixed && Math.abs(n) > Math.abs(d)) {
    const whole = Math.trunc(n / d);
    const rem = Math.abs(n % d);
    if (rem === 0) return `${whole}`;
    return `${whole} ${rem}/${d}`;
  }
  return `${n}/${d}`;
}

function compute(a, b, op) {
  if (!a || !b) return null;
  if (a.d === 0 || b.d === 0) return { error: 'Division by zero in input' };
  let n, d;
  if (op === '+') { n = a.n * b.d + b.n * a.d; d = a.d * b.d; }
  else if (op === '-') { n = a.n * b.d - b.n * a.d; d = a.d * b.d; }
  else if (op === '×') { n = a.n * b.n; d = a.d * b.d; }
  else if (op === '÷') {
    if (b.n === 0) return { error: 'Cannot divide by zero' };
    n = a.n * b.d; d = a.d * b.n;
  }
  return simplify(n, d);
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? <div className="copy-toast">{msg}</div> : null;
}

// ── Fraction Input Row ────────────────────────────────────────
function FractionInput({ label, value, onChange, error }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. 3/4 or 1 2/3"
        style={{ fontFamily: 'var(--mono)', borderColor: error ? '#dc2626' : undefined }}
      />
      {error && <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

// ── Result Display ────────────────────────────────────────────
function ResultDisplay({ result }) {
  if (!result) return null;
  if (result.error) {
    return (
      <div className="output-area json-err" style={{ marginTop: '16px' }}>
        ✗ {result.error}
      </div>
    );
  }
  const decimal = result.d !== 0 ? (result.n / result.d).toFixed(8).replace(/\.?0+$/, '') : 'undefined';
  const mixed = formatFraction(result, true);
  const improper = `${result.n}/${result.d}`;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        background: 'var(--accent-light)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Result</div>
        <div style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, color: 'var(--accent-hover)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {mixed}
        </div>
        {mixed !== improper && result.d !== 1 && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '6px' }}>
            Improper: <span style={{ fontFamily: 'var(--mono)' }}>{improper}</span>
          </div>
        )}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>
          Decimal: <span style={{ fontFamily: 'var(--mono)' }}>{decimal}</span>
        </div>
      </div>
    </div>
  );
}

// ── Simplify Mode ─────────────────────────────────────────────
function SimplifyMode() {
  const [val, setVal] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  function run() {
    const p = parseFraction(val);
    if (!p) { setErr('Enter a valid fraction (e.g. 8/12)'); setResult(null); return; }
    if (p.d === 0) { setErr('Denominator cannot be zero'); setResult(null); return; }
    setErr('');
    setResult(simplify(p.n, p.d));
  }

  return (
    <div>
      <FractionInput label="Fraction to simplify" value={val} onChange={setVal} error={err} />
      <div className="btn-group">
        <button className="btn btn-primary" onClick={run}>Simplify</button>
        <button className="btn btn-ghost" onClick={() => { setVal(''); setResult(null); setErr(''); }}>Clear</button>
      </div>
      <ResultDisplay result={result} />
    </div>
  );
}

// ── Compare Mode ──────────────────────────────────────────────
function CompareMode() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [errA, setErrA] = useState('');
  const [errB, setErrB] = useState('');
  const [result, setResult] = useState(null);

  function run() {
    const pa = parseFraction(a);
    const pb = parseFraction(b);
    let ok = true;
    if (!pa) { setErrA('Invalid fraction'); ok = false; } else setErrA('');
    if (!pb) { setErrB('Invalid fraction'); ok = false; } else setErrB('');
    if (!ok) return;
    const da = pa.n / pa.d;
    const db = pb.n / pb.d;
    let sym, desc;
    if (da > db) { sym = '>'; desc = `${formatFraction(simplify(pa.n,pa.d))} is greater`; }
    else if (da < db) { sym = '<'; desc = `${formatFraction(simplify(pa.n,pa.d))} is smaller`; }
    else { sym = '='; desc = 'Both fractions are equal'; }
    setResult({ sym, desc, da, db });
  }

  return (
    <div>
      <div className="form-row">
        <FractionInput label="First fraction" value={a} onChange={setA} error={errA} />
        <FractionInput label="Second fraction" value={b} onChange={setB} error={errB} />
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={run}>Compare</button>
        <button className="btn btn-ghost" onClick={() => { setA(''); setB(''); setResult(null); setErrA(''); setErrB(''); }}>Clear</button>
      </div>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'var(--accent-light)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>
              {a.trim()} <span style={{ color: '#0f172a' }}>{result.sym}</span> {b.trim()}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '8px' }}>{result.desc}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
              ({result.da.toFixed(6)} vs {result.db.toFixed(6)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Calculator ───────────────────────────────────────────
const MODES = ['Add/Subtract/Multiply/Divide', 'Simplify', 'Compare'];
const OPS = ['+', '-', '×', '÷'];

export default function FractionCalculator() {
  const [mode, setMode] = useState(0);
  const [op, setOp] = useState('+');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [errA, setErrA] = useState('');
  const [errB, setErrB] = useState('');
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  function calculate() {
    const pa = parseFraction(a);
    const pb = parseFraction(b);
    let ok = true;
    if (!pa) { setErrA('Invalid — use e.g. 3/4 or 1 2/3'); ok = false; } else setErrA('');
    if (!pb) { setErrB('Invalid — use e.g. 3/4 or 1 2/3'); ok = false; } else setErrB('');
    if (!ok) { setResult(null); return; }
    setResult(compute(pa, pb, op));
  }

  function clear() {
    setA(''); setB(''); setResult(null); setErrA(''); setErrB('');
  }

  function copyResult() {
    if (!result || result.error) return;
    const text = `${formatFraction(result)} (${(result.n / result.d).toFixed(8).replace(/\.?0+$/, '')})`;
    navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
  }

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Fraction Calculator</span>
          </div>
          <h1>Fraction Calculator</h1>
          <p className="subtitle">Add, subtract, multiply, divide, simplify and compare fractions instantly.</p>
        </div>

        {/* Tool Box */}
        <div className="tool-box">
          {/* Mode tabs */}
          <div className="tag-row" style={{ marginBottom: '20px' }}>
            {MODES.map((m, i) => (
              <button key={m} className={`tag${mode === i ? ' active' : ''}`} onClick={() => { setMode(i); setResult(null); setErrA(''); setErrB(''); }}>
                {m}
              </button>
            ))}
          </div>

          {mode === 0 && (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
                Enter whole numbers (5), fractions (3/4), or mixed numbers (1 2/3).
              </p>

              {/* Operation selector */}
              <div className="form-group">
                <label>Operation</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {OPS.map(o => (
                    <button
                      key={o}
                      onClick={() => setOp(o)}
                      style={{
                        width: '48px', height: '48px',
                        fontFamily: 'var(--mono)', fontSize: '1.2rem', fontWeight: 700,
                        border: `2px solid ${op === o ? 'var(--accent)' : 'var(--border)'}`,
                        background: op === o ? 'var(--accent-light)' : 'var(--surface)',
                        color: op === o ? 'var(--accent-hover)' : 'var(--text-2)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <FractionInput label="First fraction" value={a} onChange={setA} error={errA} />
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
                  {op}
                </div>
                <FractionInput label="Second fraction" value={b} onChange={setB} error={errB} />
              </div>

              <div className="btn-group">
                <button className="btn btn-primary" onClick={calculate}>Calculate</button>
                <button className="btn btn-ghost" onClick={clear}>Clear</button>
                {result && !result.error && (
                  <button className="btn btn-secondary btn-sm" onClick={copyResult}>Copy result</button>
                )}
              </div>

              {result && (
                <div>
                  {!result.error && (
                    <div style={{ marginTop: '10px', color: 'var(--text-3)', fontSize: '0.82rem', fontFamily: 'var(--mono)' }}>
                      {a.trim()} {op} {b.trim()} =
                    </div>
                  )}
                  <ResultDisplay result={result} />
                </div>
              )}
            </>
          )}

          {mode === 1 && <SimplifyMode />}
          {mode === 2 && <CompareMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Fraction Calculator</h2>
          <p>
            This free fraction calculator handles every common fraction operation in your browser — no sign-up, no app, no waiting. Switch between three modes using the tabs above: <strong>Add/Subtract/Multiply/Divide</strong> for arithmetic, <strong>Simplify</strong> to reduce any fraction to its lowest terms, and <strong>Compare</strong> to find which of two fractions is larger.
          </p>
          <p>
            You can enter fractions in three formats: a proper fraction like <code>3/4</code>, an improper fraction like <code>7/4</code>, or a mixed number like <code>1 3/4</code> (whole number, space, then the fraction). Whole numbers like <code>5</code> also work perfectly. Results are always shown in simplest form and displayed as both a mixed number and a decimal, so you can use whichever format suits your needs.
          </p>
          <p>
            <strong>Adding fractions</strong> works by finding the least common denominator — for example, 1/2 + 1/3 becomes 3/6 + 2/6 = 5/6. <strong>Multiplying fractions</strong> is straightforward: multiply numerators together and denominators together, then simplify. <strong>Dividing fractions</strong> flips the second fraction (takes its reciprocal) and multiplies. All steps are handled automatically.
          </p>
          <p>
            The simplify tool uses the greatest common divisor (GCD) algorithm to reduce any fraction to its irreducible form instantly — great for checking homework or working with recipe measurements, unit conversions, and engineering ratios.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Quick Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[
              { label: '1/2 + 1/3', value: '5/6' },
              { label: '3/4 − 1/8', value: '5/8' },
              { label: '2/3 × 3/5', value: '2/5' },
              { label: '7/8 ÷ 1/4', value: '3 1/2' },
              { label: 'Simplify 18/24', value: '3/4' },
              { label: '1 2/3 + 2 1/4', value: '3 11/12' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.label}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="fraction-calculator" />
      </div>
      <Toast msg={toast} />
    </div>
  );
}
