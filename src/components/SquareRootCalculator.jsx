import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

function fmt(n, dp = 10) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(dp)).toString();
}

function isPerfectSquare(n) {
  if (n < 0) return false;
  const s = Math.round(Math.sqrt(n));
  return s * s === n;
}

function isPerfectCube(n) {
  const c = Math.round(Math.cbrt(Math.abs(n)));
  return c * c * c === Math.abs(n);
}

// Prime factorisation (for simplifying surds, up to reasonable size)
function primeFactors(n) {
  const factors = {};
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      n = Math.floor(n / d);
    }
    d++;
  }
  if (n > 1) factors[n] = (factors[n] || 0) + 1;
  return factors;
}

// Simplify √n → a√b  e.g. √72 → 6√2
function simplifyRoot(n, rootDeg = 2) {
  if (n < 0 && rootDeg % 2 === 0) return null; // complex
  const sign = n < 0 ? -1 : 1;
  const absN = Math.abs(n);
  if (absN === 0) return { outside: 0, inside: 0 };
  if (absN === 1) return { outside: sign, inside: 1 };

  const factors = primeFactors(absN);
  let outside = 1;
  let inside = 1;

  for (const [prime, count] of Object.entries(factors)) {
    const p = parseInt(prime);
    outside *= Math.pow(p, Math.floor(count / rootDeg));
    inside  *= Math.pow(p, count % rootDeg);
  }

  return { outside: outside * sign, inside };
}

// GCD for fraction simplification
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

// ── Shared UI components ──────────────────────────────────────

function ResultCard({ label, value, sub, wide = false }) {
  return (
    <div style={{
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
      padding: '16px 22px',
      textAlign: 'center',
      flex: wide ? '1 1 100%' : '1 1 130px',
      minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.3rem,3.5vw,2rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', marginTop: '5px', lineHeight: 1.1, wordBreak: 'break-all' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function StepList({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div style={{ marginTop: '20px' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
        Step-by-step
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          }}>
            <span style={{
              minWidth: '22px', height: '22px', borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{s.expr}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Mode 1: Square Root ───────────────────────────────────────

function SquareRootMode() {
  const [val, setVal] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const n = parseFloat(val);
    if (isNaN(n)) { setError('Enter a valid number.'); setResult(null); return; }

    if (n < 0) {
      setResult({
        type: 'complex',
        decimal: Math.sqrt(-n),
        n,
        steps: [
          { label: 'Input is negative', expr: `√${fmt(n)} = √(−1 × ${fmt(-n)})` },
          { label: 'Split using i = √(−1)', expr: `= i × √${fmt(-n)} = ${fmt(Math.sqrt(-n))}i` },
        ],
      });
      setError('');
      return;
    }

    const sqrt = Math.sqrt(n);
    const perfect = isPerfectSquare(n) && Number.isInteger(n);
    const simplified = n >= 2 && Number.isInteger(n) ? simplifyRoot(n, 2) : null;
    const canSimplify = simplified && simplified.outside > 1 && simplified.inside > 1;

    const steps = [
      { label: 'Calculate √' + fmt(n), expr: `√${fmt(n)} = ${fmt(sqrt)}` },
    ];

    if (perfect) {
      steps.push({ label: 'Perfect square ✓', expr: `${fmt(sqrt)} × ${fmt(sqrt)} = ${fmt(n)}` });
    } else if (canSimplify) {
      steps.push({
        label: 'Simplify the surd',
        expr: `√${fmt(n)} = √(${simplified.outside ** 2} × ${simplified.inside}) = ${simplified.outside}√${simplified.inside}`,
      });
      steps.push({
        label: 'Verify',
        expr: `${simplified.outside}√${simplified.inside} = ${simplified.outside} × ${fmt(Math.sqrt(simplified.inside))} ≈ ${fmt(sqrt)}`,
      });
    }

    steps.push({ label: 'Squared verification', expr: `${fmt(sqrt)}² ≈ ${fmt(sqrt * sqrt)}` });

    setResult({
      type: 'real',
      sqrt,
      perfect,
      simplified: canSimplify ? simplified : null,
      n,
      steps,
    });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate the square root of any number. Returns the exact decimal, simplified surd form (e.g. 6√2), and flags perfect squares.
      </p>
      <div className="form-group">
        <label>Number (x)</label>
        <input
          type="number"
          value={val}
          onChange={e => { setVal(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && calculate()}
          placeholder="e.g. 72"
          style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }}
          autoFocus
        />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate √x</button>
        <button className="btn btn-ghost" onClick={() => { setVal(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          {result.type === 'complex' && (
            <>
              <div style={{
                background: '#fef3c7', border: '1px solid #f59e0b',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                fontSize: '0.85rem', color: '#92400e', marginBottom: '14px',
              }}>
                ⚠ Negative input — result is a complex (imaginary) number.
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ResultCard label="√x (complex)" value={`${fmt(result.decimal)}i`} sub="imaginary number" />
              </div>
            </>
          )}

          {result.type === 'real' && (
            <>
              {result.perfect && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                  fontSize: '0.82rem', color: '#15803d', marginBottom: '14px', fontWeight: 600,
                }}>
                  ✓ Perfect square — √{fmt(result.n)} is a whole number.
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ResultCard label="√x (decimal)" value={fmt(result.sqrt)} />
                {result.simplified && (
                  <ResultCard
                    label="Simplified surd"
                    value={`${result.simplified.outside}√${result.simplified.inside}`}
                    sub={`exact form`}
                  />
                )}
                <ResultCard label="x²  (squared back)" value={fmt(result.n)} sub="verification" />
              </div>
            </>
          )}

          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Nth Root ──────────────────────────────────────────

function NthRootMode() {
  const [val, setVal] = useState('');
  const [n, setN] = useState('3');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const ROOT_PRESETS = [
    { label: '2nd (√)', val: '2' },
    { label: '3rd (∛)', val: '3' },
    { label: '4th (∜)', val: '4' },
    { label: '5th',     val: '5' },
  ];

  function calculate() {
    const x = parseFloat(val);
    const nv = parseFloat(n);

    if (isNaN(x))          { setError('Enter a valid number.'); setResult(null); return; }
    if (isNaN(nv) || nv <= 0 || !Number.isInteger(nv)) {
      setError('Root degree must be a positive whole number.');
      setResult(null); return;
    }
    if (x < 0 && nv % 2 === 0) {
      setError(`Even roots of negative numbers are complex. Try an odd root degree.`);
      setResult(null); return;
    }

    const sign = x < 0 ? -1 : 1;
    const root = sign * Math.pow(Math.abs(x), 1 / nv);
    const perfect = Number.isInteger(x) && isPerfectSquare(Math.abs(Math.round(root))) ? true
      : Math.abs(Math.pow(root, nv) - x) < 1e-6 && Math.abs(root - Math.round(root)) < 1e-9;

    const simplified = Number.isInteger(x) && x > 0 ? simplifyRoot(x, nv) : null;
    const canSimplify = simplified && simplified.outside > 1 && simplified.inside > 1;

    const ordinal = ['', 'st', 'nd', 'rd'][nv] || 'th';
    const steps = [
      { label: `Formula: ⁿ√x = x^(1/n)`, expr: `${nv}√${fmt(x)} = ${fmt(x)}^(1/${nv})` },
      { label: 'Calculate', expr: `= ${fmt(root)}` },
      { label: 'Verification', expr: `${fmt(root)}^${nv} ≈ ${fmt(Math.pow(root, nv))}` },
    ];

    if (canSimplify) {
      steps.splice(2, 0, {
        label: 'Simplified form',
        expr: `${nv}√${fmt(x)} = ${simplified.outside} × ${nv}√${simplified.inside}`,
      });
    }

    setResult({ root, x, nv, ordinal, simplified: canSimplify ? simplified : null, steps });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate any <strong>nth root</strong> of a number — cube root, 4th root, 5th root, and beyond.
      </p>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Number (x)</label>
          <input
            type="number"
            value={val}
            onChange={e => { setVal(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 64"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Root (n)</label>
          <input
            type="number"
            value={n}
            min="2"
            onChange={e => { setN(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3"
          />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Common roots
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ROOT_PRESETS.map(p => (
            <button
              key={p.val}
              className={`tag${n === p.val ? ' active' : ''}`}
              onClick={() => { setN(p.val); setResult(null); setError(''); }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate ⁿ√x</button>
        <button className="btn btn-ghost" onClick={() => { setVal(''); setN('3'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label={`${result.nv}√${fmt(result.x)}`}
              value={fmt(result.root)}
            />
            {result.simplified && (
              <ResultCard
                label="Simplified"
                value={`${result.simplified.outside} × ${result.nv}√${result.simplified.inside}`}
                sub="exact surd form"
              />
            )}
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Simplify Surd ─────────────────────────────────────

function SimplifySurdMode() {
  const [val, setVal] = useState('');
  const [rootDeg, setRootDeg] = useState('2');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const n = parseInt(val);
    const r = parseInt(rootDeg);

    if (isNaN(n) || n <= 0) { setError('Enter a positive whole number.'); setResult(null); return; }
    if (isNaN(r) || r < 2)  { setError('Root degree must be 2 or higher.'); setResult(null); return; }

    const factors = primeFactors(n);
    const simplified = simplifyRoot(n, r);

    const factorStr = Object.entries(factors)
      .map(([p, e]) => e > 1 ? `${p}^${e}` : p)
      .join(' × ');

    const steps = [
      { label: 'Prime factorisation', expr: `${n} = ${factorStr}` },
    ];

    const groupDetails = Object.entries(factors).map(([p, e]) => {
      const outside = Math.floor(e / r);
      const inside = e % r;
      return `${p}^${e}: takes ${p}^${outside} outside, ${p}^${inside} stays inside`;
    });
    if (groupDetails.length) {
      steps.push({ label: `Group factors in sets of ${r}`, expr: groupDetails.join('\n') });
    }

    if (simplified.outside === 1) {
      steps.push({ label: 'Already in simplest form', expr: `${r}√${n} cannot be simplified further` });
    } else {
      steps.push({
        label: 'Simplified form',
        expr: `${r}√${n} = ${simplified.outside} × ${r}√${simplified.inside}`,
      });
      steps.push({
        label: 'Decimal check',
        expr: `${fmt(Math.pow(n, 1/r))} ≈ ${simplified.outside} × ${fmt(Math.pow(simplified.inside, 1/r))} = ${fmt(simplified.outside * Math.pow(simplified.inside, 1/r))}`,
      });
    }

    setResult({ n, r, simplified, factors, factorStr, steps });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Simplify a surd (radical) to its exact form using prime factorisation — e.g. √72 → 6√2.
      </p>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Number under the root (radicand)</label>
          <input
            type="number"
            value={val}
            onChange={e => { setVal(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 72"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Root (n)</label>
          <input
            type="number"
            value={rootDeg}
            min="2"
            onChange={e => { setRootDeg(e.target.value); setResult(null); setError(''); }}
            placeholder="2"
          />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Simplify</button>
        <button className="btn btn-ghost" onClick={() => { setVal(''); setRootDeg('2'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {result.simplified.outside === 1 ? (
              <ResultCard label="Already simplified" value={`${result.r}√${result.n}`} sub="cannot simplify further" />
            ) : (
              <>
                <ResultCard label="Simplified" value={`${result.simplified.outside}√${result.simplified.inside}`} sub="exact surd form" />
                <ResultCard label="Decimal" value={fmt(Math.pow(result.n, 1 / result.r))} sub="≈ approximation" />
              </>
            )}
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Square & Cube quick lookup ────────────────────────

function PerfectRootsMode() {
  const [max, setMax] = useState('20');

  const count = Math.min(Math.max(parseInt(max) || 10, 2), 50);
  const rows = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return { n, sq: n * n, cb: n * n * n, sqrtSq: n, cbrtCb: n };
  });

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Quick reference table of perfect squares and cubes up to any number.
      </p>

      <div className="form-group" style={{ maxWidth: '200px' }}>
        <label>Show up to n =</label>
        <input
          type="number"
          value={max}
          min="2" max="50"
          onChange={e => setMax(e.target.value)}
          placeholder="20"
        />
      </div>

      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['n', 'n² (square)', '√n²', 'n³ (cube)', '∛n³'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 14px',
                  fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ n, sq, cb }) => (
              <tr key={n} style={{ borderBottom: '1px solid var(--border)', background: n % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                <td style={{ padding: '7px 14px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>{n}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)' }}>{sq.toLocaleString()}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{n}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)' }}>{cb.toLocaleString()}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mode tabs & main component ────────────────────────────────

const MODES = [
  { label: 'Square Root',     desc: '√x with surd form' },
  { label: 'Nth Root',        desc: 'cube, 4th, 5th...' },
  { label: 'Simplify Surd',   desc: '√72 → 6√2' },
  { label: 'Perfect Squares', desc: 'reference table' },
];

export default function SquareRootCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Square Root Calculator</span>
          </div>
          <h1>Square Root Calculator</h1>
          <p className="subtitle">
            Calculate square roots, nth roots, simplify surds, and explore perfect squares — with step-by-step working.
          </p>
        </div>

        {/* Tool Box */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '8px', marginBottom: '24px' }}>
            {MODES.map((m, i) => (
              <button
                key={m.label}
                onClick={() => setMode(i)}
                style={{
                  background: mode === i ? 'var(--accent-light)' : 'var(--surface2)',
                  border: `1.5px solid ${mode === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          {mode === 0 && <SquareRootMode />}
          {mode === 1 && <NthRootMode />}
          {mode === 2 && <SimplifySurdMode />}
          {mode === 3 && <PerfectRootsMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Square Root Calculator</h2>
          <p>
            This free square root calculator covers every common root operation — all running instantly in your browser with no sign-up needed. Switch between four modes using the tabs above.
          </p>
          <p>
            <strong>Square Root</strong> calculates √x for any number. When the input is a positive integer, it also shows the <em>simplified surd form</em> using prime factorisation — for example, √72 simplifies to 6√2 because 72 = 36 × 2 and √36 = 6. Perfect squares (4, 9, 16, 25…) are flagged with a confirmation. Negative inputs return the complex (imaginary) result as a multiple of <em>i</em>.
          </p>
          <p>
            <strong>Nth Root</strong> calculates the cube root (∛), 4th root (∜), 5th root, or any higher root using the formula x^(1/n). Quick-select buttons let you switch between the most common root degrees instantly.
          </p>
          <p>
            <strong>Simplify Surd</strong> reduces any radical to its simplest exact form using prime factorisation with full working shown at every step — ideal for GCSE and A-Level maths revision.
          </p>
          <p>
            <strong>Perfect Squares table</strong> provides a quick-reference chart of n², √n², n³ and ∛n³ for any range up to 50, useful for spotting patterns and checking answers at a glance.
          </p>
          <p>
            Every mode shows step-by-step working including verification, so you can follow the logic rather than just trust the answer.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Square Root Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            {[
              { label: '√144',   value: '12',        sub: 'perfect square' },
              { label: '√2',     value: '1.4142…',   sub: 'irrational number' },
              { label: '√72',    value: '6√2',        sub: 'simplified surd' },
              { label: '∛216',   value: '6',          sub: 'perfect cube root' },
              { label: '√0.25',  value: '0.5',        sub: 'decimal root' },
              { label: '4√1296', value: '6',          sub: '4th root' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value">{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="square-root-calculator" />
      </div>
    </div>
  );
}
