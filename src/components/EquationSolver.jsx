import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Utilities ─────────────────────────────────────────────────

function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function fmt(n, dp = 8) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(dp)).toString();
}

function fmtFrac(p, q) {
  if (Math.abs(q) < 1e-12) return 'undefined';
  if (Math.abs(p) < 1e-9) return '0';
  const g = gcd(Math.abs(Math.round(p)), Math.abs(Math.round(q)));
  const sign = q < 0 ? -1 : 1;
  const np = (sign * Math.round(p)) / g;
  const nq = (sign * Math.round(q)) / g;
  return nq === 1 ? `${np}` : `${np}/${nq}`;
}

function supScript(n) {
  const map = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return map[n] || `^${n}`;
}

// ── Polynomial Parser ─────────────────────────────────────────

function parsePolynomial(raw) {
  let expr = raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/\^/g, '**')
    .toLowerCase();

  const coeffs = {};
  const tokens = expr.split(/(?=[+-])/).filter(Boolean);

  for (let tok of tokens) {
    if (!tok) continue;
    let degree = 0;
    let coeff = 1;

    if (tok.includes('x')) {
      const powMatch = tok.match(/x\*\*(\d+)/);
      if (powMatch) degree = parseInt(powMatch[1]);
      else degree = 1;

      const coeffPart = tok.replace(/x\*\*\d+/, '').replace('x', '');
      if (coeffPart === '' || coeffPart === '+') coeff = 1;
      else if (coeffPart === '-') coeff = -1;
      else coeff = parseFloat(coeffPart);
    } else {
      degree = 0;
      coeff = parseFloat(tok);
    }

    if (isNaN(coeff)) coeff = 0;
    coeffs[degree] = (coeffs[degree] || 0) + coeff;
  }

  const maxDeg = Math.max(0, ...Object.keys(coeffs).map(Number));
  const arr = Array(maxDeg + 1).fill(0);
  for (const [deg, c] of Object.entries(coeffs)) arr[Number(deg)] = c;
  return arr;
}

function formatPoly(coeffs) {
  const parts = [];
  for (let i = coeffs.length - 1; i >= 0; i--) {
    const c = coeffs[i];
    if (Math.abs(c) < 1e-12) continue;
    const absC = Math.abs(c);
    const sign = c < 0 ? '−' : '+';
    let term;
    if (i === 0) term = fmt(absC);
    else if (i === 1) term = (absC === 1 ? '' : fmt(absC)) + 'x';
    else term = (absC === 1 ? '' : fmt(absC)) + 'x' + supScript(i);
    parts.push({ sign, term });
  }
  if (!parts.length) return '0';
  return parts
    .map((p, i) =>
      i === 0 ? (p.sign === '−' ? '−' : '') + p.term : ` ${p.sign} ${p.term}`
    )
    .join('');
}

// ── Solvers ───────────────────────────────────────────────────

function solveLinear(coeffs) {
  const [c, a] = coeffs;
  if (Math.abs(a) < 1e-12) {
    return Math.abs(c) < 1e-9
      ? { type: 'infinite', steps: [] }
      : { type: 'none', steps: [] };
  }
  const x = -c / a;
  return {
    type: 'linear',
    roots: [x],
    steps: [
      { label: 'Standard form', expr: `${fmt(a)}x + ${fmt(c)} = 0` },
      { label: 'Isolate x', expr: `${fmt(a)}x = ${fmt(-c)}` },
      { label: `Divide both sides by ${fmt(a)}`, expr: `x = ${fmtFrac(-c, a)} = ${fmt(x)}` },
    ],
  };
}

function solveQuadratic(coeffs) {
  const [c, b, a] = coeffs;
  const disc = b * b - 4 * a * c;
  const steps = [
    { label: 'Standard form', expr: `${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)} = 0` },
    { label: 'Discriminant  Δ = b² − 4ac', expr: `Δ = (${fmt(b)})² − 4(${fmt(a)})(${fmt(c)}) = ${fmt(disc)}` },
  ];

  if (disc > 1e-9) {
    const x1 = (-b + Math.sqrt(disc)) / (2 * a);
    const x2 = (-b - Math.sqrt(disc)) / (2 * a);
    steps.push({ label: 'Quadratic formula', expr: `x = (−${fmt(b)} ± √${fmt(disc)}) / ${fmt(2 * a)}` });
    steps.push({ label: 'Root 1', expr: `x₁ = ${fmt(x1)}` });
    steps.push({ label: 'Root 2', expr: `x₂ = ${fmt(x2)}` });
    return { type: 'real2', roots: [x1, x2], disc, steps };
  } else if (Math.abs(disc) < 1e-9) {
    const x = -b / (2 * a);
    steps.push({ label: 'Δ = 0 → one repeated root', expr: `x = −${fmt(b)} / ${fmt(2 * a)} = ${fmt(x)}` });
    return { type: 'real1', roots: [x], disc, steps };
  } else {
    const re = -b / (2 * a);
    const im = Math.sqrt(-disc) / (2 * a);
    steps.push({ label: 'Δ < 0 → complex roots', expr: `x = ${fmt(re)} ± ${fmt(im)}i` });
    return { type: 'complex', re, im, disc, steps };
  }
}

function evalPoly(cs, x) {
  return cs.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
}

function evalDeriv(cs, x) {
  return cs.slice(1).reduce((s, c, i) => s + c * (i + 1) * Math.pow(x, i), 0);
}

function deflate(cs, r) {
  const out = [];
  let rem = 0;
  for (let i = cs.length - 1; i >= 0; i--) {
    rem = cs[i] + rem * r;
    if (i > 0) out.unshift(rem);
  }
  return out;
}

function findOneRoot(cs, start) {
  let x = start;
  for (let i = 0; i < 300; i++) {
    const fx = evalPoly(cs, x);
    const dfx = evalDeriv(cs, x);
    if (Math.abs(dfx) < 1e-14) break;
    const nx = x - fx / dfx;
    if (Math.abs(nx - x) < 1e-10) return nx;
    x = nx;
  }
  return null;
}

function solveNumerical(coeffs) {
  const roots = [];
  let remaining = [...coeffs];
  const starts = [-1000, -100, -20, -7, -3, -1, 0, 1, 3, 7, 20, 100, 1000];

  while (remaining.length >= 3) {
    let found = null;
    for (const s of starts) {
      const r = findOneRoot(remaining, s);
      if (r !== null && Math.abs(evalPoly(remaining, r)) < 1e-5) {
        found = r;
        break;
      }
    }
    if (found === null) break;
    roots.push(found);
    remaining = deflate(remaining, found);
    if (remaining.length < 2) break;
  }

  if (remaining.length === 2 && Math.abs(remaining[1]) > 1e-12) {
    roots.push(-remaining[0] / remaining[1]);
  }

  return roots.filter(
    (r, i, arr) => arr.findIndex(r2 => Math.abs(r2 - r) < 1e-5) === i
  );
}

// ── Master solver ─────────────────────────────────────────────

function solveEquation(raw) {
  const normalised = raw.replace(/[−–]/g, '-').replace(/\s+/g, '');
  const parts = normalised.split('=');
  if (parts.length !== 2) throw new Error('Equation must contain exactly one "=" sign.');

  const L = parsePolynomial(parts[0]);
  const R = parsePolynomial(parts[1]);
  const len = Math.max(L.length, R.length);
  const coeffs = Array.from({ length: len }, (_, i) => (L[i] || 0) - (R[i] || 0));

  while (coeffs.length > 1 && Math.abs(coeffs[coeffs.length - 1]) < 1e-12) coeffs.pop();

  const degree = coeffs.length - 1;

  if (degree === 0) {
    return Math.abs(coeffs[0]) < 1e-9
      ? { type: 'infinite', degree, coeffs, steps: [] }
      : { type: 'none', degree, coeffs, steps: [] };
  }
  if (degree === 1) return { degree, coeffs, ...solveLinear(coeffs) };
  if (degree === 2) return { degree, coeffs, ...solveQuadratic(coeffs) };

  const roots = solveNumerical(coeffs);
  const steps = [
    { label: 'Rearranged to standard form', expr: `${formatPoly(coeffs)} = 0` },
    { label: 'Method', expr: 'Numerical — Newton-Raphson with polynomial deflation' },
    {
      label: roots.length ? 'Real roots found' : 'No real roots found',
      expr: roots.length
        ? roots.map((r, i) => `x${roots.length > 1 ? (['₁','₂','₃','₄'][i] || i + 1) : ''} ≈ ${fmt(r, 6)}`).join('   ')
        : '—',
    },
  ];
  return { type: roots.length ? 'numerical' : 'none', degree, coeffs, roots, steps };
}

// ── UI Sub-components ─────────────────────────────────────────

function StepList({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div style={{ marginTop: '20px' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
        Step-by-step solution
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
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                {s.expr}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RootBadge({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--accent-light)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)', padding: '14px 20px', textAlign: 'center', minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.2rem,3.5vw,1.8rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', marginTop: '4px', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

function VerifyRow({ roots, coeffs }) {
  if (!roots || roots.length === 0 || !coeffs) return null;
  return (
    <div style={{ marginTop: '12px' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>
        Verification
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {roots.map((r, i) => {
          const val = evalPoly(coeffs, r);
          const ok = Math.abs(val) < 1e-5;
          return (
            <div key={i} style={{
              background: ok ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`,
              borderRadius: 'var(--radius-sm)', padding: '5px 12px',
              fontSize: '0.78rem', fontFamily: 'var(--mono)',
              color: ok ? '#15803d' : '#dc2626',
            }}>
              {ok ? '✓' : '✗'} f({fmt(r, 4)}) = {fmt(val, 6)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// TableRow extracted as its own component — fixes the duplicate style prop crash
function TableRow({ type, eq, sol, onLoad }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={() => onLoad(eq)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: hovered ? 'var(--surface2)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <td style={{ padding: '9px 14px' }}>
        <span style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '99px', padding: '2px 10px',
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)',
        }}>
          {type}
        </span>
      </td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>
        {eq}
      </td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', color: 'var(--accent-hover)', fontWeight: 600 }}>
        {sol}
      </td>
    </tr>
  );
}

// ── Data ──────────────────────────────────────────────────────

const EXAMPLES = [
  { label: 'Linear',            eq: '3x + 7 = 22'              },
  { label: 'Linear',            eq: '5x - 3 = 2x + 9'          },
  { label: 'Quadratic',         eq: 'x^2 - 5x + 6 = 0'         },
  { label: 'Quadratic',         eq: 'x^2 + 2x = 8'             },
  { label: 'Quadratic (complex)',eq: 'x^2 + 4 = 0'              },
  { label: 'Cubic',             eq: 'x^3 - 6x^2 + 11x - 6 = 0' },
  { label: 'Cubic',             eq: 'x^3 = 8'                   },
  { label: 'Quartic',           eq: 'x^4 - 5x^2 + 4 = 0'       },
];

const TABLE_EXAMPLES = [
  { type: 'Linear',    eq: '3x + 7 = 22',               sol: 'x = 5'         },
  { type: 'Linear',    eq: '5x - 3 = 2x + 9',           sol: 'x = 4'         },
  { type: 'Quadratic', eq: 'x^2 - 5x + 6 = 0',          sol: 'x = 2, x = 3'  },
  { type: 'Quadratic', eq: 'x^2 + 2x = 8',              sol: 'x = 2, x = -4' },
  { type: 'Quadratic', eq: 'x^2 + 4 = 0',               sol: 'x = ±2i'       },
  { type: 'Cubic',     eq: 'x^3 - 6x^2 + 11x - 6 = 0', sol: 'x = 1, 2, 3'   },
  { type: 'Cubic',     eq: 'x^3 = 8',                   sol: 'x = 2'         },
  { type: 'Quartic',   eq: 'x^4 - 5x^2 + 4 = 0',        sol: 'x = ±1, ±2'   },
];

const DEGREE_NAMES = ['', 'Linear', 'Quadratic', 'Cubic', 'Quartic', 'Quintic'];

// ── Main Component ────────────────────────────────────────────

export default function EquationSolver() {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [toast, setToast]   = useState('');

  // Core solve — always takes the equation string directly (no stale state)
  function runSolve(eq) {
    const target = (eq || '').trim();
    if (!target) { setError('Please enter an equation.'); setResult(null); return; }
    try {
      const r = solveEquation(target);
      setResult(r);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not parse — check your syntax.');
      setResult(null);
    }
  }

  // Load an example: set state AND solve immediately from the string
  function loadExample(eq) {
    setInput(eq);
    setError('');
    setResult(null);
    runSolve(eq);
  }

  function copyRoots() {
    if (!result || !result.roots || result.roots.length === 0) return;
    const text = result.roots.map((r, i) => `x${result.roots.length > 1 ? i + 1 : ''} = ${fmt(r)}`).join(', ');
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copied!');
      setTimeout(() => setToast(''), 2000);
    });
  }

  const degreeLabel = result ? DEGREE_NAMES[result.degree] || `Degree ${result.degree}` : '';
  const hasRealRoots = result &&
    ['linear', 'real2', 'real1', 'numerical'].includes(result.type) &&
    result.roots && result.roots.length > 0;

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Equation Solver</span>
          </div>
          <h1>Equation Solver</h1>
          <p className="subtitle">
            Solve linear, quadratic, cubic and higher-degree equations — with step-by-step working.
          </p>
        </div>

        {/* Tool Box */}
        <div className="tool-box">

          {/* Input */}
          <div className="form-group">
            <label>Enter your equation</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setResult(null); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') runSolve(input); }}
                placeholder="e.g.  x^2 - 5x + 6 = 0"
                style={{ fontFamily: 'var(--mono)', fontSize: '1rem', flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => runSolve(input)}
                style={{ flexShrink: 0 }}
              >
                Solve
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setInput(''); setResult(null); setError(''); }}
                style={{ flexShrink: 0 }}
              >
                Reset
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '6px' }}>
              Use <code>^</code> for powers. Both sides supported: <code>x^2 + 2x = 8</code>
            </p>
          </div>

          {/* Quick examples */}
          <div style={{ marginBottom: '4px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Try an example
            </p>
            <div className="tag-row">
              {EXAMPLES.map(ex => (
                <button
                  key={ex.eq}
                  className={`tag${input === ex.eq ? ' active' : ''}`}
                  onClick={() => loadExample(ex.eq)}
                >
                  <span style={{ fontWeight: 600 }}>{ex.label}:</span>{' '}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>{ex.eq}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="output-area json-err" style={{ marginTop: '16px' }}>
              ✗ {error}
            </div>
          )}

          {/* Results */}
          {result && !error && (
            <div style={{ marginTop: '24px' }}>

              {/* Type badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)',
                  fontFamily: 'var(--mono)',
                }}>
                  {degreeLabel} equation
                </span>
                {result.coeffs && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    {formatPoly(result.coeffs)} = 0
                  </span>
                )}
              </div>

              {/* Real roots */}
              {hasRealRoots && (
                <>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {result.roots.map((r, i) => (
                      <RootBadge
                        key={i}
                        label={result.roots.length > 1 ? `x${['₁','₂','₃','₄'][i] || i + 1}` : 'x ='}
                        value={fmt(r)}
                        sub={Math.abs(r - Math.round(r)) > 1e-9 ? `≈ ${r.toFixed(4)}` : null}
                      />
                    ))}
                    <button className="btn btn-ghost btn-sm" onClick={copyRoots} style={{ alignSelf: 'center' }}>
                      Copy roots
                    </button>
                  </div>
                  <VerifyRow roots={result.roots} coeffs={result.coeffs} />
                </>
              )}

              {/* Complex roots */}
              {result.type === 'complex' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <RootBadge label="x₁" value={`${fmt(result.re)} + ${fmt(result.im)}i`} sub="complex" />
                  <RootBadge label="x₂" value={`${fmt(result.re)} − ${fmt(result.im)}i`} sub="complex" />
                </div>
              )}

              {/* Special cases */}
              {result.type === 'infinite' && (
                <div className="output-area" style={{ marginTop: 0, color: '#86efac' }}>
                  ∞  Infinitely many solutions — this is an identity.
                </div>
              )}
              {result.type === 'none' && (
                <div className="output-area json-err" style={{ marginTop: 0 }}>
                  ✗  No real solution exists for this equation.
                </div>
              )}

              {/* Steps */}
              {result.steps && <StepList steps={result.steps} />}
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Equation Solver</h2>
          <p>
            This free equation solver handles any single-variable polynomial equation from linear all the way up to quartic (degree 4) and beyond — running entirely in your browser with no sign-up needed. Type your equation using standard notation, press Solve, and get the answer with a full step-by-step breakdown.
          </p>
          <p>
            <strong>What it solves:</strong> Enter any equation of the form <em>expression = expression</em>. The solver automatically moves everything to one side and detects the degree. <strong>Linear equations</strong> (e.g. <code>3x + 7 = 22</code>) are solved by isolation. <strong>Quadratic equations</strong> use the quadratic formula and correctly handle complex roots when the discriminant is negative. <strong>Cubic and quartic equations</strong> are solved numerically using Newton-Raphson root-finding with polynomial deflation.
          </p>
          <p>
            <strong>Input format:</strong> Use <code>^</code> for powers — for example <code>x^3</code> or <code>2x^2</code>. No multiplication sign is needed between a number and x. Variables can appear on both sides: <code>x^2 + 2x = 8</code> is handled just as well as standard form. Every real root is verified by substitution so you can instantly confirm the result.
          </p>
          <p>
            Click any row in the examples table below to load it directly into the solver. Ideal for students checking homework, teachers preparing examples, or anyone who needs a quick, reliable algebra answer with visible working.
          </p>
        </div>

        {/* Examples Table */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Example Equations &amp; Solutions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Type', 'Equation', 'Solution'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 14px',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_EXAMPLES.map(({ type, eq, sol }) => (
                  <TableRow key={eq} type={type} eq={eq} sol={sol} onLoad={loadExample} />
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '8px', padding: '0 4px' }}>
              ↑ Click any row to load it into the solver
            </p>
          </div>
        </div>

        <RelatedTools currentId="equation-solver" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
