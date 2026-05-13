import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

// Greatest common divisor
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

// Format a number nicely (trim trailing zeros, handle near-integers)
function fmt(n, decimals = 6) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(decimals)).toString();
}

// Format fraction p/q in simplest form
function fmtFrac(p, q) {
  if (Math.abs(q) < 1e-12) return 'undefined';
  if (Math.abs(p) < 1e-9) return '0';
  const g = gcd(Math.round(Math.abs(p)), Math.round(Math.abs(q)));
  const sign = q < 0 ? -1 : 1;
  const np = sign * Math.round(p) / g;
  const nq = sign * Math.round(q) / g;
  return nq === 1 ? `${np}` : `${np}/${nq}`;
}

// ── Linear equation solver: ax + b = c  ─────────────────────
// Accepts: "2x + 3 = 7", "3x = 9", "x - 5 = 0", etc.
function solveLinear(eq) {
  // Normalize
  eq = eq.replace(/\s+/g, '').replace(/−/g, '-').toLowerCase();

  // Must have exactly one '='
  const sides = eq.split('=');
  if (sides.length !== 2) throw new Error('Equation must contain exactly one "="');

  // Move everything to left: left - right = 0
  let expr = `(${sides[0]})-(${sides[1]})`;

  // Parse: collect coefficient of x and constant
  // Tokenise into [sign, coefficient, 'x'|constant]
  // Replace implicit multiplication: 2x → 2*x
  expr = expr.replace(/(\d)(x)/g, '$1*$2');

  // Simple polynomial parser
  function parse(str) {
    // Returns {a: coeff of x, b: constant}
    let a = 0, b = 0;
    // Split by + or - keeping the sign
    const tokens = str.split(/(?=[+-])/);
    for (let tok of tokens) {
      tok = tok.trim();
      if (!tok) continue;
      if (tok.includes('x')) {
        // Extract coefficient
        const c = tok.replace('*x', '').replace('x', '');
        if (c === '' || c === '+') a += 1;
        else if (c === '-') a -= 1;
        else a += parseFloat(c);
      } else {
        b += parseFloat(tok) || 0;
      }
    }
    return { a, b };
  }

  // Handle parentheses by eval-ing numeric parts first... 
  // Instead: use a cleaner regex-based approach
  function parseExpr(str) {
    // Remove outer parens wrapping the whole thing won't help; 
    // we deal with the (lhs)-(rhs) form by splitting on '='
    // and working per side.
    return parse(str);
  }

  const left = parseExpr(sides[0].replace(/\s+/g, '').replace(/(\d)(x)/g, '$1*$2'));
  const right = parseExpr(sides[1].replace(/\s+/g, '').replace(/(\d)(x)/g, '$1*$2'));

  const a = left.a - right.a;
  const b = right.b - left.b; // ax = b

  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-9) return { type: 'infinite', msg: 'Infinitely many solutions (identity)' };
    return { type: 'none', msg: 'No solution (contradiction)' };
  }

  const x = b / a;
  return {
    type: 'linear',
    x,
    steps: [
      { desc: 'Original equation', expr: eq.replace('=', ' = ') },
      { desc: `Collect x terms (coefficient: ${fmt(a)})`, expr: `${fmt(a)}x = ${fmt(b)}` },
      { desc: `Divide both sides by ${fmt(a)}`, expr: `x = ${fmtFrac(b, a)}` },
      { desc: 'Solution', expr: `x = ${fmt(x)}` },
    ],
  };
}

// ── Quadratic solver: ax² + bx + c = 0 ──────────────────────
function solveQuadratic(aStr, bStr, cStr) {
  const a = parseFloat(aStr), b = parseFloat(bStr), c = parseFloat(cStr);
  if (isNaN(a) || isNaN(b) || isNaN(c)) throw new Error('Enter valid numbers for a, b, c');
  if (a === 0) throw new Error('Coefficient "a" cannot be 0 (use Linear solver)');

  const disc = b * b - 4 * a * c;
  const steps = [
    { desc: 'Equation', expr: `${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)} = 0` },
    { desc: 'Discriminant Δ = b² − 4ac', expr: `Δ = ${fmt(b)}² − 4(${fmt(a)})(${fmt(c)}) = ${fmt(disc)}` },
  ];

  if (disc > 0) {
    const x1 = (-b + Math.sqrt(disc)) / (2 * a);
    const x2 = (-b - Math.sqrt(disc)) / (2 * a);
    steps.push({ desc: 'Two real roots', expr: `x = (−${fmt(b)} ± √${fmt(disc)}) / ${fmt(2 * a)}` });
    steps.push({ desc: 'x₁', expr: `x₁ = ${fmt(x1)}` });
    steps.push({ desc: 'x₂', expr: `x₂ = ${fmt(x2)}` });
    return { type: 'two_real', x1, x2, disc, steps };
  } else if (Math.abs(disc) < 1e-10) {
    const x = -b / (2 * a);
    steps.push({ desc: 'One repeated root (Δ = 0)', expr: `x = −${fmt(b)} / ${fmt(2 * a)} = ${fmt(x)}` });
    return { type: 'one_real', x, disc, steps };
  } else {
    const re = -b / (2 * a);
    const im = Math.sqrt(-disc) / (2 * a);
    steps.push({ desc: 'Complex roots (Δ < 0)', expr: `x = ${fmt(re)} ± ${fmt(im)}i` });
    return { type: 'complex', re, im, disc, steps };
  }
}

// ── System of two linear equations ───────────────────────────
// a1x + b1y = c1
// a2x + b2y = c2
function solveSystem(a1s, b1s, c1s, a2s, b2s, c2s) {
  const [a1, b1, c1, a2, b2, c2] = [a1s, b1s, c1s, a2s, b2s, c2s].map(parseFloat);
  if ([a1, b1, c1, a2, b2, c2].some(isNaN)) throw new Error('Enter valid numbers for all coefficients');

  const det = a1 * b2 - a2 * b1;
  const steps = [
    { desc: 'System', expr: `${fmt(a1)}x + ${fmt(b1)}y = ${fmt(c1)}\n${fmt(a2)}x + ${fmt(b2)}y = ${fmt(c2)}` },
    { desc: 'Determinant D = a₁b₂ − a₂b₁', expr: `D = ${fmt(a1)}×${fmt(b2)} − ${fmt(a2)}×${fmt(b1)} = ${fmt(det)}` },
  ];

  if (Math.abs(det) < 1e-12) {
    // Check consistency
    const ratio1 = Math.abs(a1) > 1e-12 ? c1 / a1 : null;
    const ratio2 = Math.abs(a2) > 1e-12 ? c2 / a2 : null;
    if (ratio1 !== null && ratio2 !== null && Math.abs(ratio1 - ratio2) < 1e-9)
      return { type: 'infinite', msg: 'Infinitely many solutions', steps };
    return { type: 'none', msg: 'No solution (parallel lines)', steps };
  }

  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  steps.push({ desc: "Cramer's rule — x = (c₁b₂ − c₂b₁) / D", expr: `x = ${fmt(c1 * b2 - c2 * b1)} / ${fmt(det)} = ${fmt(x)}` });
  steps.push({ desc: "Cramer's rule — y = (a₁c₂ − a₂c₁) / D", expr: `y = ${fmt(a1 * c2 - a2 * c1)} / ${fmt(det)} = ${fmt(y)}` });
  return { type: 'system', x, y, steps };
}

// ── UI helpers ────────────────────────────────────────────────
function StepList({ steps }) {
  if (!steps?.length) return null;
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
        Step-by-step solution
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
          }}>
            <span style={{
              minWidth: '22px', height: '22px', borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '1px',
            }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 }}>{s.desc}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre' }}>{s.expr}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultBadge({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--accent-light)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)', padding: '16px 20px', textAlign: 'center',
      minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
      <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', marginTop: '4px', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="output-area json-err" style={{ marginTop: '16px' }}>✗ {msg}</div>
  );
}

// ── Modes ─────────────────────────────────────────────────────

function LinearMode() {
  const [eq, setEq] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function solve() {
    try {
      if (!eq.trim()) { setError('Enter an equation'); return; }
      const r = solveLinear(eq);
      setResult(r); setError('');
    } catch (e) { setError(e.message); setResult(null); }
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Enter a linear equation with one variable x, e.g. <code>2x + 5 = 13</code> or <code>3x - 7 = 2x + 1</code>
      </p>
      <div className="form-group">
        <label>Equation</label>
        <input type="text" value={eq} onChange={e => setEq(e.target.value)}
          placeholder="e.g. 2x + 5 = 13"
          style={{ fontFamily: 'var(--mono)' }}
          onKeyDown={e => e.key === 'Enter' && solve()}
        />
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={solve}>Solve</button>
        <button className="btn btn-ghost" onClick={() => { setEq(''); setResult(null); setError(''); }}>Clear</button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && !error && (
        <div style={{ marginTop: '16px' }}>
          {result.type === 'linear' && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ResultBadge label="x =" value={fmt(result.x)} sub={result.x !== Math.round(result.x) ? `≈ ${result.x.toFixed(4)}` : null} />
            </div>
          )}
          {result.type === 'infinite' && <div className="output-area" style={{ marginTop: 0 }}>{result.msg}</div>}
          {result.type === 'none' && <ErrorBox msg={result.msg} />}
          {result.steps && <StepList steps={result.steps} />}
        </div>
      )}
    </div>
  );
}

function QuadraticMode() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function solve() {
    try {
      const r = solveQuadratic(a, b, c);
      setResult(r); setError('');
    } catch (e) { setError(e.message); setResult(null); }
  }

  const eqPreview = `${a || 'a'}x² + ${b || 'b'}x + ${c || 'c'} = 0`;

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Solve <strong>ax² + bx + c = 0</strong> using the quadratic formula. Enter the three coefficients below.
      </p>
      <div style={{
        background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
        padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: '0.9rem',
        color: 'var(--accent-hover)', marginBottom: '16px', letterSpacing: '0.02em',
      }}>
        {eqPreview}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>a (x² coefficient)</label>
          <input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="e.g. 1" />
        </div>
        <div className="form-group">
          <label>b (x coefficient)</label>
          <input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="e.g. -5" />
        </div>
        <div className="form-group">
          <label>c (constant)</label>
          <input type="number" value={c} onChange={e => setC(e.target.value)} placeholder="e.g. 6" />
        </div>
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={solve}>Solve</button>
        <button className="btn btn-ghost" onClick={() => { setA(''); setB(''); setC(''); setResult(null); setError(''); }}>Clear</button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && !error && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {result.type === 'two_real' && <>
              <ResultBadge label="x₁" value={fmt(result.x1)} />
              <ResultBadge label="x₂" value={fmt(result.x2)} />
              <ResultBadge label="Δ (discriminant)" value={fmt(result.disc)} sub="Two real roots" />
            </>}
            {result.type === 'one_real' && <>
              <ResultBadge label="x (repeated)" value={fmt(result.x)} />
              <ResultBadge label="Δ (discriminant)" value="0" sub="One repeated root" />
            </>}
            {result.type === 'complex' && <>
              <ResultBadge label="x₁" value={`${fmt(result.re)} + ${fmt(result.im)}i`} />
              <ResultBadge label="x₂" value={`${fmt(result.re)} − ${fmt(result.im)}i`} />
              <ResultBadge label="Δ (discriminant)" value={fmt(result.disc)} sub="Complex roots" />
            </>}
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

function SystemMode() {
  const [vals, setVals] = useState({ a1: '', b1: '', c1: '', a2: '', b2: '', c2: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const set = (k, v) => setVals(prev => ({ ...prev, [k]: v }));

  function solve() {
    try {
      const r = solveSystem(vals.a1, vals.b1, vals.c1, vals.a2, vals.b2, vals.c2);
      setResult(r); setError('');
    } catch (e) { setError(e.message); setResult(null); }
  }

  function clear() {
    setVals({ a1: '', b1: '', c1: '', a2: '', b2: '', c2: '' });
    setResult(null); setError('');
  }

  const row = (prefix, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', width: '52px', flexShrink: 0 }}>{label}</span>
      <input type="number" value={vals[`a${prefix}`]} onChange={e => set(`a${prefix}`, e.target.value)}
        placeholder="a" style={{ width: '70px', flex: '0 0 70px' }} />
      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>x +</span>
      <input type="number" value={vals[`b${prefix}`]} onChange={e => set(`b${prefix}`, e.target.value)}
        placeholder="b" style={{ width: '70px', flex: '0 0 70px' }} />
      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>y =</span>
      <input type="number" value={vals[`c${prefix}`]} onChange={e => set(`c${prefix}`, e.target.value)}
        placeholder="c" style={{ width: '70px', flex: '0 0 70px' }} />
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Solve a system of two linear equations with two unknowns (x and y).
      </p>
      {row(1, 'Eq. 1')}
      {row(2, 'Eq. 2')}
      <div className="btn-group">
        <button className="btn btn-primary" onClick={solve}>Solve</button>
        <button className="btn btn-ghost" onClick={clear}>Clear</button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && !error && (
        <div style={{ marginTop: '16px' }}>
          {result.type === 'system' && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ResultBadge label="x =" value={fmt(result.x)} />
              <ResultBadge label="y =" value={fmt(result.y)} />
            </div>
          )}
          {result.type === 'infinite' && <div className="output-area">{result.msg}</div>}
          {result.type === 'none' && <ErrorBox msg={result.msg} />}
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Exponent & Polynomial evaluator ──────────────────────────
function ExprMode() {
  const [expr, setExpr] = useState('');
  const [xVal, setXVal] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function evaluate() {
    try {
      if (!expr.trim()) { setError('Enter an expression'); return; }
      const x = parseFloat(xVal);
      if (isNaN(x)) { setError('Enter a value for x'); return; }
      // Safe eval: replace ^ with **, x with value, allow math functions
      let safe = expr
        .replace(/\^/g, '**')
        .replace(/\bx\b/g, `(${x})`)
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\blog\b/g, 'Math.log10')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/(\d)(x|\()/g, '$1*$2');
      // eslint-disable-next-line no-new-func
      const val = new Function(`return (${safe})`)();
      if (!isFinite(val)) { setError('Result is undefined or infinite'); return; }
      setResult({ val, expr, x });
      setError('');
    } catch (e) { setError('Invalid expression — check syntax'); setResult(null); }
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Evaluate any algebraic expression at a given value of x. Supports <code>^</code> for powers, <code>sqrt()</code>, <code>sin()</code>, <code>cos()</code>, <code>log()</code>, <code>abs()</code>.
      </p>
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Expression f(x)</label>
          <input type="text" value={expr} onChange={e => setExpr(e.target.value)}
            placeholder="e.g. 2x^2 + 3x - 5"
            style={{ fontFamily: 'var(--mono)' }}
            onKeyDown={e => e.key === 'Enter' && evaluate()}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>x =</label>
          <input type="number" value={xVal} onChange={e => setXVal(e.target.value)}
            placeholder="e.g. 3"
            onKeyDown={e => e.key === 'Enter' && evaluate()}
          />
        </div>
      </div>
      <div className="btn-group">
        <button className="btn btn-primary" onClick={evaluate}>Evaluate</button>
        <button className="btn btn-ghost" onClick={() => { setExpr(''); setXVal(''); setResult(null); setError(''); }}>Clear</button>
      </div>
      {error && <ErrorBox msg={error} />}
      {result && !error && (
        <div style={{ marginTop: '16px' }}>
          <ResultBadge
            label={`f(${result.x}) =`}
            value={fmt(result.val)}
            sub={`When x = ${result.x} in "${result.expr}"`}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
const MODES = [
  { label: 'Linear Equation', desc: 'ax + b = c', icon: '𝑥' },
  { label: 'Quadratic', desc: 'ax² + bx + c = 0', icon: '𝑥²' },
  { label: 'System of Equations', desc: '2 equations, 2 unknowns', icon: '𝑥𝑦' },
  { label: 'Evaluate Expression', desc: 'f(x) at any x', icon: 'f(x)' },
];

export default function AlgebraCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Algebra Calculator</span>
          </div>
          <h1>Algebra Calculator</h1>
          <p className="subtitle">Solve linear equations, quadratics, systems of equations and evaluate expressions — with step-by-step workings.</p>
        </div>

        {/* Tool Box */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px', marginBottom: '24px' }}>
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
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 700,
                  color: mode === i ? 'var(--accent-hover)' : 'var(--text)',
                  marginBottom: '2px',
                }}>{m.icon}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>{m.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '2px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {mode === 0 && <LinearMode />}
          {mode === 1 && <QuadraticMode />}
          {mode === 2 && <SystemMode />}
          {mode === 3 && <ExprMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>About This Algebra Calculator</h2>
          <p>
            This free algebra calculator covers the most common equation types you'll encounter in school, college, and everyday problem-solving — all running instantly in your browser with no sign-up required.
          </p>
          <p>
            The <strong>Linear Equation solver</strong> handles any equation of the form ax + b = c, including equations with x on both sides. Type your equation naturally — for example, <code>3x + 4 = 2x - 1</code> — and get the answer with a full step-by-step breakdown showing how the solution was reached.
          </p>
          <p>
            The <strong>Quadratic Equation solver</strong> uses the quadratic formula (−b ± √(b²−4ac)) / 2a to solve ax² + bx + c = 0. It handles all three discriminant cases: two distinct real roots, one repeated root, and complex (imaginary) roots. The discriminant value is always shown so you can confirm the nature of the roots at a glance.
          </p>
          <p>
            The <strong>System of Equations solver</strong> applies Cramer's Rule to solve two simultaneous linear equations with two unknowns (x and y) — ideal for mixture problems, rate problems, and geometry.
          </p>
          <p>
            The <strong>Expression Evaluator</strong> lets you substitute any value of x into a polynomial or function expression. It supports powers (<code>^</code>), trig functions, square roots, logarithms and absolute values.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Example Problems</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {[
              { label: 'Linear', expr: '2x + 5 = 13', answer: 'x = 4' },
              { label: 'Linear', expr: '3x − 7 = 2x + 1', answer: 'x = 8' },
              { label: 'Quadratic', expr: 'x² − 5x + 6 = 0', answer: 'x = 2, x = 3' },
              { label: 'Quadratic', expr: 'x² + 4 = 0', answer: 'x = ±2i' },
              { label: 'System', expr: '2x+y=5, x−y=1', answer: 'x=2, y=1' },
              { label: 'Evaluate', expr: 'f(3) = 2x²−x', answer: '15' },
            ].map(ex => (
              <div key={ex.expr} className="result-stat">
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '4px' }}>{ex.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '6px' }}>{ex.expr}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.answer}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="algebra-calculator" />
      </div>
    </div>
  );
}
