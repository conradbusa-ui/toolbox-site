import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Numerical integration (fallback / definite integrals) ─────

// Simpson's rule for numerical definite integration
function simpsonIntegrate(fn, a, b, n = 10000) {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * fn(x);
  }
  return (h / 3) * sum;
}

// Safe expression evaluator using Function constructor
function makeFunction(expr) {
  try {
    const sanitised = expr
      .replace(/\^/g, '**')
      .replace(/(\d)(x)/g, '$1*$2')
      .replace(/(\))(x|\()/g, '$1*$2')
      .replace(/(x)(\()/g, '$1*$2')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');
    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict"; return (${sanitised});`);
  } catch {
    return null;
  }
}

function fmt(n, dp = 6) {
  if (!isFinite(n) || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1e10 || (abs < 1e-4 && abs > 0)) return n.toExponential(4);
  return parseFloat(n.toFixed(dp)).toString();
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

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
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

// ── Loading spinner ────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', color: 'var(--text-3)', fontSize: '0.85rem' }}>
      <div style={{
        width: 18, height: 18, border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Computing…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Rendered result card ──────────────────────────────────────

function ResultCard({ result, onCopy, copied }) {
  if (!result) return null;

  return (
    <div style={{
      background: 'var(--accent-light)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)', padding: '18px 22px', marginTop: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {result.type === 'indefinite' ? 'Antiderivative' : 'Definite Integral'}
        </div>
        <button onClick={onCopy} className="btn btn-ghost btn-sm" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Main result */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 'clamp(0.9rem,2.5vw,1.2rem)',
        fontWeight: 700, color: 'var(--accent-hover)', lineHeight: 1.6,
        background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
        padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {result.answer}
      </div>

      {/* Steps if available */}
      {result.steps && result.steps.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Solution steps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px', background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                fontSize: '0.84rem',
              }}>
                <span style={{ flex: '0 0 20px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-3)', fontSize: '0.75rem' }}>{i + 1}.</span>
                <span style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {result.notes && (
        <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {result.notes}
        </div>
      )}
    </div>
  );
}

// ── Common integrals reference ────────────────────────────────

const COMMON_INTEGRALS = [
  { expr: 'xⁿ',            result: 'xⁿ⁺¹/(n+1) + C',          note: 'power rule (n ≠ −1)' },
  { expr: '1/x',           result: 'ln|x| + C',                 note: 'reciprocal' },
  { expr: 'eˣ',            result: 'eˣ + C',                    note: 'exponential' },
  { expr: 'sin(x)',         result: '−cos(x) + C',               note: 'trig' },
  { expr: 'cos(x)',         result: 'sin(x) + C',                note: 'trig' },
  { expr: 'tan(x)',         result: 'ln|sec(x)| + C',            note: 'trig' },
  { expr: '1/√(1−x²)',     result: 'arcsin(x) + C',             note: 'inverse trig' },
  { expr: '1/(1+x²)',      result: 'arctan(x) + C',             note: 'inverse trig' },
  { expr: 'ln(x)',          result: 'x·ln(x) − x + C',           note: 'by parts' },
  { expr: '√x',            result: '(2/3)x^(3/2) + C',          note: 'power rule' },
  { expr: 'sec²(x)',        result: 'tan(x) + C',                note: 'trig' },
  { expr: 'aˣ',            result: 'aˣ/ln(a) + C',              note: 'exponential' },
];

// ── Mode 1: Symbolic (AI-powered) integral ────────────────────

function SymbolicMode() {
  const [expr,    setExpr]    = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  const EXAMPLE_EXPRS = [
    { label: 'x²',           expr: 'x^2'            },
    { label: 'sin(x)',        expr: 'sin(x)'          },
    { label: 'eˣ',           expr: 'e^x'             },
    { label: 'ln(x)',         expr: 'ln(x)'           },
    { label: '1/x',           expr: '1/x'             },
    { label: 'x·cos(x)',      expr: 'x*cos(x)'        },
    { label: 'x²·eˣ',        expr: 'x^2*e^x'         },
    { label: '1/(1+x²)',      expr: '1/(1+x^2)'       },
    { label: '√(1−x²)',      expr: 'sqrt(1-x^2)'     },
    { label: 'sin²(x)',       expr: 'sin(x)^2'        },
  ];

  async function calculate() {
    if (!expr.trim()) { setError('Enter an expression to integrate.'); return; }
    setLoading(true); setError(''); setResult(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Compute the indefinite integral of: ${expr}

Respond ONLY with valid JSON in this exact format, no markdown, no explanation outside the JSON:
{
  "answer": "the antiderivative expression with + C",
  "steps": ["step 1 description", "step 2 description"],
  "notes": "any important notes or conditions (or empty string)",
  "method": "the integration technique used (e.g. power rule, integration by parts, substitution)"
}

Rules:
- answer must be a clean mathematical expression (use ^ for powers, * for multiplication)
- steps should be 2-5 concise steps explaining the method
- if the integral has no closed form, say so in answer and explain in notes
- include + C for indefinite integrals
- be mathematically precise`
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(c => c.type === 'text')?.text || '';

      // Parse JSON from response
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);

      setResult({
        type: 'indefinite',
        answer: parsed.answer || '—',
        steps:  parsed.steps  || [],
        notes:  parsed.notes  || '',
        method: parsed.method || '',
      });
    } catch (err) {
      setError('Could not compute the integral. Please check your expression and try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.answer).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Enter any function of x to compute its antiderivative. Supports polynomials, trig, exponentials, logarithms, and more.
      </p>

      <div className="form-group">
        <label>∫ f(x) dx — enter f(x)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text" value={expr}
            onChange={e => { setExpr(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !loading && calculate()}
            placeholder="e.g. x^2, sin(x), x*e^x, 1/(x^2+1)"
            style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: '1.05rem' }}
            autoFocus
          />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Use: <code style={{ fontFamily: 'var(--mono)' }}>^</code> for powers · <code style={{ fontFamily: 'var(--mono)' }}>*</code> for multiply · <code style={{ fontFamily: 'var(--mono)' }}>sin, cos, tan, ln, sqrt, e^x</code>
        </p>
      </div>

      {/* Quick examples */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Examples</p>
        <div className="tag-row">
          {EXAMPLE_EXPRS.map(e => (
            <button key={e.expr} className="tag"
              onClick={() => { setExpr(e.expr); setResult(null); setError(''); }}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate} disabled={loading}>
          {loading ? 'Computing…' : '∫ Integrate'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setExpr(''); setResult(null); setError(''); }} disabled={loading}>
          Clear
        </button>
      </div>

      {loading && <Spinner />}
      {error   && !loading && <ErrBox msg={error} />}
      {result  && !loading && <ResultCard result={result} onCopy={copy} copied={copied} />}

      {result?.method && (
        <div style={{ marginTop: '10px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          Method: <strong style={{ color: 'var(--text-2)' }}>{result.method}</strong>
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Definite integral (numerical) ─────────────────────

function DefiniteMode() {
  const [expr,     setExpr]     = useState('');
  const [lower,    setLower]    = useState('');
  const [upper,    setUpperB]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [numResult,setNumResult]= useState(null);
  const [error,    setError]    = useState('');
  const [copied,   setCopied]   = useState(false);

  const PRESETS = [
    { label: '∫₀¹ x²',        expr: 'x^2',   a: '0', b: '1'         },
    { label: '∫₀π sin(x)',     expr: 'sin(x)', a: '0', b: 'Math.PI'  },
    { label: '∫₀¹ eˣ',        expr: 'e^x',   a: '0', b: '1'         },
    { label: '∫₁ᵉ ln(x)',      expr: 'ln(x)',  a: '1', b: 'Math.E'   },
    { label: '∫₋₁¹ √(1−x²)', expr: 'sqrt(1-x^2)', a: '-1', b: '1'  },
  ];

  async function calculate() {
    const a = lower.trim(), b = upper.trim();
    if (!expr.trim()) { setError('Enter an expression.'); return; }
    if (!a)           { setError('Enter the lower bound.'); return; }
    if (!b)           { setError('Enter the upper bound.'); return; }

    // Numerical result first (instant)
    try {
      const fn = makeFunction(expr);
      const aVal = Function('"use strict"; return (' + a.replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/, 'Math.E') + ')')();
      const bVal = Function('"use strict"; return (' + b.replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/, 'Math.E') + ')')();
      if (fn && isFinite(aVal) && isFinite(bVal)) {
        const numerical = simpsonIntegrate(fn, aVal, bVal);
        setNumResult({ value: numerical, a: aVal, b: bVal });
      }
    } catch { /* skip if parse fails */ }

    // AI for symbolic result
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Compute the definite integral: ∫ from ${a} to ${b} of (${expr}) dx

Respond ONLY with valid JSON, no markdown:
{
  "answer": "the exact numerical or symbolic result (e.g. '1/3' or 'π/4' or '2')",
  "antiderivative": "the antiderivative F(x)",
  "steps": ["step 1", "step 2", "step 3"],
  "notes": "any conditions or notes",
  "method": "technique used"
}`
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(c => c.type === 'text')?.text || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);

      setResult({
        type:          'definite',
        answer:        parsed.answer || '—',
        antiderivative:parsed.antiderivative || '',
        steps:         parsed.steps  || [],
        notes:         parsed.notes  || '',
        method:        parsed.method || '',
      });
    } catch {
      setError('Could not compute the integral. Try a simpler expression or check your bounds.');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.answer).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Compute a definite integral ∫ₐᵇ f(x) dx — returns the exact symbolic result and a numerical approximation.
      </p>

      <div className="form-group">
        <label>f(x) — integrand</label>
        <input type="text" value={expr}
          onChange={e => { setExpr(e.target.value); setResult(null); setNumResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && !loading && calculate()}
          placeholder="e.g. x^2, sin(x), e^x"
          style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Lower bound (a)</label>
          <input type="text" value={lower}
            onChange={e => { setLower(e.target.value); setResult(null); setNumResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !loading && calculate()}
            placeholder="e.g. 0, -1, pi"
            style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Upper bound (b)</label>
          <input type="text" value={upper}
            onChange={e => { setUpperB(e.target.value); setResult(null); setNumResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !loading && calculate()}
            placeholder="e.g. 1, pi, e"
            style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Examples</p>
        <div className="tag-row">
          {PRESETS.map(p => (
            <button key={p.label} className="tag"
              onClick={() => { setExpr(p.expr); setLower(p.a); setUpperB(p.b); setResult(null); setNumResult(null); setError(''); }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate} disabled={loading}>
          {loading ? 'Computing…' : '∫ Compute'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setExpr(''); setLower(''); setUpperB(''); setResult(null); setNumResult(null); setError(''); }} disabled={loading}>
          Clear
        </button>
      </div>

      {loading && <Spinner />}
      {error   && !loading && <ErrBox msg={error} />}

      {/* Numerical result shows instantly */}
      {numResult && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <StatCard accent label="Numerical result" value={fmt(numResult.value)} sub="Simpson's rule (10,000 intervals)" />
          <StatCard label="Bounds" value={`[${fmt(numResult.a, 3)}, ${fmt(numResult.b, 3)}]`} />
        </div>
      )}

      {result && !loading && (
        <>
          <ResultCard result={result} onCopy={copy} copied={copied} />
          {result.antiderivative && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>F(x) = </span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-hover)', fontWeight: 700 }}>{result.antiderivative}</span>
            </div>
          )}
          {result.method && (
            <div style={{ marginTop: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              Method: <strong style={{ color: 'var(--text-2)' }}>{result.method}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Mode 3: Common integrals reference ────────────────────────

function ReferenceMode() {
  const [filter, setFilter] = useState('all');
  const CATEGORIES = ['all', 'power', 'trig', 'exponential', 'log', 'inverse trig'];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        A quick-reference table of standard integrals and their antiderivatives.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '0' }}>
          {/* Header */}
          {['f(x)', '∫ f(x) dx', 'Type'].map(h => (
            <div key={h} style={{
              padding: '8px 14px', background: 'var(--accent-hover)',
              color: 'white', fontWeight: 700, fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              borderRight: '1px solid rgba(255,255,255,0.2)',
            }}>{h}</div>
          ))}
        </div>

        {COMMON_INTEGRALS.map((item, i) => (
          <div key={item.expr} style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr',
            background: i % 2 === 0 ? 'var(--surface2)' : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: i === 0 ? '0 0 0 0' : 'var(--radius-sm)',
          }}>
            <div style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)', fontSize: '0.9rem', borderRight: '1px solid var(--border)' }}>
              {item.expr}
            </div>
            <div style={{ padding: '10px 14px', fontFamily: 'var(--mono)', color: 'var(--text)', fontSize: '0.88rem', borderRight: '1px solid var(--border)' }}>
              {item.result}
            </div>
            <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
              {item.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
        <strong>Key integration techniques:</strong><br />
        <strong>Power rule:</strong> ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1)<br />
        <strong>Substitution:</strong> ∫f(g(x))g′(x) dx = F(g(x)) + C<br />
        <strong>Integration by parts:</strong> ∫u dv = uv − ∫v du<br />
        <strong>Partial fractions:</strong> decompose rational functions before integrating
      </div>
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Indefinite Integral', desc: '∫ f(x) dx + C'     },
  { label: 'Definite Integral',   desc: '∫ₐᵇ f(x) dx'       },
  { label: 'Reference Table',     desc: 'standard integrals' },
];

export default function IntegralCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Integral Calculator</span>
          </div>
          <h1>Integral Calculator</h1>
          <p className="subtitle">
            Compute indefinite and definite integrals with step-by-step solutions — polynomials, trig, exponentials, logarithms, and more.
          </p>
        </div>

        <div className="tool-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px,1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <SymbolicMode />}
          {mode === 1 && <DefiniteMode />}
          {mode === 2 && <ReferenceMode />}
        </div>

        <div className="seo-content">
          <h2>How the Integral Calculator Works</h2>
          <p>
            Integration is the reverse of differentiation — it finds the antiderivative of a function, or the area under a curve between two points. This calculator handles both indefinite integrals (general antiderivatives expressed as +C) and definite integrals (a specific numerical value over an interval).
          </p>
          <p>
            The <strong>Indefinite Integral</strong> mode uses AI to compute the antiderivative symbolically, step by step. Enter any function of x — from simple polynomials like x² to complex expressions like x²·eˣ or sin²(x) — and it identifies the correct integration technique automatically. Supported methods include the power rule, substitution, integration by parts, trigonometric identities, and partial fractions.
          </p>
          <p>
            The <strong>Definite Integral</strong> mode computes ∫ₐᵇ f(x) dx, returning both the exact symbolic result (via the Fundamental Theorem of Calculus: F(b) − F(a)) and a highly accurate numerical approximation using Simpson's rule with 10,000 intervals. Bounds can be entered as numbers or constants like <code>pi</code> or <code>e</code>.
          </p>
          <p>
            The <strong>Reference Table</strong> lists the 12 most important standard integrals — from the power rule and reciprocal, to trig, exponential, inverse trig, and log — alongside the four key integration techniques.
          </p>
          <p>
            Input format: use <code>^</code> for powers (x^2), <code>*</code> for multiplication (2*x), and standard function names (sin, cos, tan, ln, sqrt, exp). The constant <code>e</code> refers to Euler's number and <code>pi</code> to π.
          </p>
        </div>

        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Integral Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '∫ x² dx',             value: 'x³/3 + C',       sub: 'power rule'         },
              { label: '∫ sin(x) dx',          value: '−cos(x) + C',    sub: 'trig integral'      },
              { label: '∫ x·eˣ dx',            value: 'eˣ(x−1) + C',   sub: 'integration by parts'},
              { label: '∫₀¹ x² dx',            value: '1/3',             sub: 'definite: F(1)−F(0)'},
              { label: '∫₀π sin(x) dx',        value: '2',               sub: '[−cos(x)]₀π'       },
              { label: '∫ 1/(1+x²) dx',        value: 'arctan(x) + C',  sub: 'inverse trig'       },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.05rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="integral-calculator" />
      </div>
    </div>
  );
}
