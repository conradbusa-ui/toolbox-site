import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

function fmt(n, dp = 10) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(dp)).toString();
}

function logBase(x, base) {
  return Math.log(x) / Math.log(base);
}

// ── Shared UI ─────────────────────────────────────────────────

function ResultCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
      padding: '16px 22px',
      textAlign: 'center',
      minWidth: '130px',
      flex: '1 1 130px',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', marginTop: '5px', lineHeight: 1.1, wordBreak: 'break-all' }}>
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

// ── Mode 1: Evaluate log ──────────────────────────────────────
// log_b(x) = ?

function EvaluateMode() {
  const [x, setX] = useState('');
  const [base, setBase] = useState('10');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const xv = parseFloat(x);
    const bv = parseFloat(base);

    if (isNaN(xv)) { setError('Enter a valid number for x.'); setResult(null); return; }
    if (xv <= 0)   { setError('x must be greater than 0.'); setResult(null); return; }
    if (isNaN(bv)) { setError('Enter a valid base.'); setResult(null); return; }
    if (bv <= 0 || bv === 1) { setError('Base must be > 0 and ≠ 1.'); setResult(null); return; }

    const val = logBase(xv, bv);
    const baseLabel = bv === Math.E ? 'e' : fmt(bv);

    const steps = [
      { label: 'Formula', expr: `log_${baseLabel}(${fmt(xv)}) = ln(${fmt(xv)}) / ln(${baseLabel})` },
      { label: 'Natural log of x', expr: `ln(${fmt(xv)}) = ${fmt(Math.log(xv))}` },
      { label: `Natural log of base (${baseLabel})`, expr: `ln(${baseLabel}) = ${fmt(Math.log(bv))}` },
      { label: 'Divide', expr: `${fmt(Math.log(xv))} / ${fmt(Math.log(bv))} = ${fmt(val)}` },
    ];

    setResult({ val, baseLabel, xv, steps });
    setError('');
  }

  const BASE_PRESETS = [
    { label: '10 (common)', val: '10' },
    { label: 'e (natural)', val: String(Math.E) },
    { label: '2 (binary)', val: '2' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate <strong>log<sub>b</sub>(x)</strong> — the logarithm of x in any base.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>x (argument)</label>
          <input
            type="number"
            value={x}
            onChange={e => { setX(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 1000"
          />
        </div>
        <div className="form-group">
          <label>Base (b)</label>
          <input
            type="number"
            value={base}
            onChange={e => { setBase(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 10"
          />
        </div>
      </div>

      {/* Base presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Common bases
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {BASE_PRESETS.map(p => (
            <button
              key={p.label}
              className={`tag${base === p.val ? ' active' : ''}`}
              onClick={() => { setBase(p.val); setResult(null); setError(''); }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setX(''); setBase('10'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label={`log${result.baseLabel === '10' ? '' : '_' + result.baseLabel}(${fmt(result.xv)})`}
              value={fmt(result.val)}
            />
            <ResultCard
              label="ln(x)"
              value={fmt(Math.log(result.xv))}
              sub="natural log"
            />
            <ResultCard
              label="log₁₀(x)"
              value={fmt(Math.log10(result.xv))}
              sub="common log"
            />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Solve for x ───────────────────────────────────────
// log_b(x) = y  →  x = b^y

function SolveXMode() {
  const [base, setBase] = useState('10');
  const [y, setY] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const bv = parseFloat(base);
    const yv = parseFloat(y);

    if (isNaN(bv) || bv <= 0 || bv === 1) { setError('Base must be > 0 and ≠ 1.'); setResult(null); return; }
    if (isNaN(yv)) { setError('Enter a valid value for the result (y).'); setResult(null); return; }

    const x = Math.pow(bv, yv);
    const baseLabel = bv === Math.E ? 'e' : fmt(bv);

    const steps = [
      { label: 'Equation', expr: `log_${baseLabel}(x) = ${fmt(yv)}` },
      { label: 'Rewrite in exponential form', expr: `x = ${baseLabel}^${fmt(yv)}` },
      { label: 'Calculate', expr: `x = ${fmt(bv)}^${fmt(yv)} = ${fmt(x)}` },
    ];

    setResult({ x, baseLabel, yv, steps });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find <strong>x</strong> when you know <strong>log<sub>b</sub>(x) = y</strong>.
        Equivalent to calculating <strong>b<sup>y</sup></strong>.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>Base (b)</label>
          <input type="number" value={base}
            onChange={e => { setBase(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 10" />
        </div>
        <div className="form-group">
          <label>Result (y)</label>
          <input type="number" value={y}
            onChange={e => { setY(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Solve for x</button>
        <button className="btn btn-ghost" onClick={() => { setBase('10'); setY(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label={`x = ${result.baseLabel}^${fmt(result.yv)}`}
              value={fmt(result.x)}
            />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Solve for base ────────────────────────────────────
// log_b(x) = y  →  b = x^(1/y)

function SolveBaseMode() {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    const xv = parseFloat(x);
    const yv = parseFloat(y);

    if (isNaN(xv) || xv <= 0)  { setError('x must be a positive number.'); setResult(null); return; }
    if (isNaN(yv) || yv === 0) { setError('y (result) cannot be zero.'); setResult(null); return; }

    const b = Math.pow(xv, 1 / yv);

    if (b <= 0 || b === 1 || !isFinite(b)) {
      setError('No valid base exists for these values.');
      setResult(null);
      return;
    }

    const steps = [
      { label: 'Equation', expr: `log_b(${fmt(xv)}) = ${fmt(yv)}` },
      { label: 'Rewrite in exponential form', expr: `b^${fmt(yv)} = ${fmt(xv)}` },
      { label: 'Raise both sides to power 1/y', expr: `b = ${fmt(xv)}^(1/${fmt(yv)})` },
      { label: 'Calculate', expr: `b = ${fmt(b)}` },
    ];

    setResult({ b, xv, yv, steps });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find the <strong>base b</strong> when you know <strong>log<sub>b</sub>(x) = y</strong>.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>x (argument)</label>
          <input type="number" value={x}
            onChange={e => { setX(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 1000" />
        </div>
        <div className="form-group">
          <label>Result (y)</label>
          <input type="number" value={y}
            onChange={e => { setY(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Solve for base</button>
        <button className="btn btn-ghost" onClick={() => { setX(''); setY(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label="Base (b)"
              value={fmt(result.b)}
              sub={`log_${fmt(result.b)}(${fmt(result.xv)}) = ${fmt(result.yv)}`}
            />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Log laws / simplify ───────────────────────────────

function LogLawsMode() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [base, setBase] = useState('10');
  const [op, setOp] = useState('product');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const OPS = [
    { id: 'product',   label: 'Product',   desc: 'log(a × b)' },
    { id: 'quotient',  label: 'Quotient',  desc: 'log(a / b)' },
    { id: 'power',     label: 'Power',     desc: 'log(aⁿ)' },
    { id: 'change',    label: 'Change of Base', desc: 'logₙ(a)' },
  ];

  function calculate() {
    const av = parseFloat(a);
    const bv = parseFloat(b);
    const basev = parseFloat(base);

    if (isNaN(basev) || basev <= 0 || basev === 1) { setError('Enter a valid base.'); setResult(null); return; }

    const baseLabel = basev === Math.E ? 'e' : fmt(basev);
    const logFn = (v) => logBase(v, basev);

    if (op === 'product') {
      if (isNaN(av) || av <= 0) { setError('a must be a positive number.'); setResult(null); return; }
      if (isNaN(bv) || bv <= 0) { setError('b must be a positive number.'); setResult(null); return; }
      const lhs = logFn(av * bv);
      const rhs = logFn(av) + logFn(bv);
      setResult({
        answer: fmt(lhs),
        steps: [
          { label: 'Product rule', expr: `log_${baseLabel}(${fmt(av)} × ${fmt(bv)}) = log_${baseLabel}(${fmt(av)}) + log_${baseLabel}(${fmt(bv)})` },
          { label: 'log_' + baseLabel + '(' + fmt(av) + ')', expr: `= ${fmt(logFn(av))}` },
          { label: 'log_' + baseLabel + '(' + fmt(bv) + ')', expr: `= ${fmt(logFn(bv))}` },
          { label: 'Sum', expr: `${fmt(logFn(av))} + ${fmt(logFn(bv))} = ${fmt(rhs)}` },
        ],
      });
    } else if (op === 'quotient') {
      if (isNaN(av) || av <= 0) { setError('a must be a positive number.'); setResult(null); return; }
      if (isNaN(bv) || bv <= 0) { setError('b must be a positive number.'); setResult(null); return; }
      const val = logFn(av / bv);
      setResult({
        answer: fmt(val),
        steps: [
          { label: 'Quotient rule', expr: `log_${baseLabel}(${fmt(av)} / ${fmt(bv)}) = log_${baseLabel}(${fmt(av)}) − log_${baseLabel}(${fmt(bv)})` },
          { label: 'log_' + baseLabel + '(' + fmt(av) + ')', expr: `= ${fmt(logFn(av))}` },
          { label: 'log_' + baseLabel + '(' + fmt(bv) + ')', expr: `= ${fmt(logFn(bv))}` },
          { label: 'Difference', expr: `${fmt(logFn(av))} − ${fmt(logFn(bv))} = ${fmt(val)}` },
        ],
      });
    } else if (op === 'power') {
      if (isNaN(av) || av <= 0) { setError('a must be a positive number (the base of the power).'); setResult(null); return; }
      if (isNaN(bv)) { setError('Enter n (the exponent).'); setResult(null); return; }
      const val = bv * logFn(av);
      setResult({
        answer: fmt(val),
        steps: [
          { label: 'Power rule', expr: `log_${baseLabel}(${fmt(av)}^${fmt(bv)}) = ${fmt(bv)} × log_${baseLabel}(${fmt(av)})` },
          { label: 'log_' + baseLabel + '(' + fmt(av) + ')', expr: `= ${fmt(logFn(av))}` },
          { label: 'Multiply by exponent', expr: `${fmt(bv)} × ${fmt(logFn(av))} = ${fmt(val)}` },
        ],
      });
    } else if (op === 'change') {
      // Change of base: log_b(a) = log_base(a) / log_base(b)
      if (isNaN(av) || av <= 0) { setError('a must be a positive number.'); setResult(null); return; }
      if (isNaN(bv) || bv <= 0 || bv === 1) { setError('New base must be > 0 and ≠ 1.'); setResult(null); return; }
      const newBaseLabel = bv === Math.E ? 'e' : fmt(bv);
      const val = logBase(av, bv);
      setResult({
        answer: fmt(val),
        steps: [
          { label: 'Change of base formula', expr: `log_${newBaseLabel}(${fmt(av)}) = log_${baseLabel}(${fmt(av)}) / log_${baseLabel}(${newBaseLabel})` },
          { label: `log_${baseLabel}(${fmt(av)})`, expr: `= ${fmt(logFn(av))}` },
          { label: `log_${baseLabel}(${newBaseLabel})`, expr: `= ${fmt(logFn(bv))}` },
          { label: 'Divide', expr: `${fmt(logFn(av))} / ${fmt(logFn(bv))} = ${fmt(val)}` },
        ],
      });
    }

    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Apply logarithm laws step-by-step: product, quotient, power, and change of base.
      </p>

      {/* Op selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '18px' }}>
        {OPS.map(o => (
          <button
            key={o.id}
            onClick={() => { setOp(o.id); setResult(null); setError(''); }}
            style={{
              background: op === o.id ? 'var(--accent-light)' : 'var(--surface2)',
              border: `1.5px solid ${op === o.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '9px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: op === o.id ? 'var(--accent-hover)' : 'var(--text)' }}>
              {o.label}
            </div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '2px' }}>
              {o.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{op === 'change' ? 'a (argument)' : op === 'power' ? 'a (base of power)' : 'a'}</label>
          <input type="number" value={a}
            onChange={e => { setA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 100" />
        </div>
        <div className="form-group">
          <label>{op === 'power' ? 'n (exponent)' : op === 'change' ? 'New base' : 'b'}</label>
          <input type="number" value={b}
            onChange={e => { setB(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={op === 'power' ? 'e.g. 3' : op === 'change' ? 'e.g. 2' : 'e.g. 10'} />
        </div>
        {op !== 'change' && (
          <div className="form-group">
            <label>Log base</label>
            <input type="number" value={base}
              onChange={e => { setBase(e.target.value); setResult(null); setError(''); }}
              placeholder="e.g. 10" />
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setA(''); setB(''); setBase('10'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard label="Result" value={result.answer} />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode tabs & main component ────────────────────────────────

const MODES = [
  { label: 'Evaluate log',    desc: 'log_b(x) = ?' },
  { label: 'Solve for x',     desc: 'find x from result' },
  { label: 'Solve for base',  desc: 'find b' },
  { label: 'Log Laws',        desc: 'product, quotient, power' },
];

export default function LogarithmCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Logarithm Calculator</span>
          </div>
          <h1>Logarithm Calculator</h1>
          <p className="subtitle">
            Evaluate logarithms in any base, solve for unknowns, and apply log laws — with step-by-step working.
          </p>
        </div>

        {/* Tool Box */}
        <div className="tool-box">

          {/* Mode selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '24px' }}>
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

          {mode === 0 && <EvaluateMode />}
          {mode === 1 && <SolveXMode />}
          {mode === 2 && <SolveBaseMode />}
          {mode === 3 && <LogLawsMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Logarithm Calculator</h2>
          <p>
            This free logarithm calculator covers every common log operation you'll encounter in maths, science, engineering, and computing — all running instantly in your browser with no sign-up required. Switch between four modes using the tabs above.
          </p>
          <p>
            <strong>Evaluate log</strong> computes log<sub>b</sub>(x) for any positive base and argument. Quick-select buttons let you switch instantly between the three most common logarithms: log base 10 (the common logarithm, written log), log base e (the natural logarithm, written ln), and log base 2 (the binary logarithm used in computing and information theory). All three values are shown simultaneously so you can compare them at a glance.
          </p>
          <p>
            <strong>Solve for x</strong> answers the question: if log<sub>b</sub>(x) = y, what is x? This is equivalent to computing b<sup>y</sup> — the inverse operation of a logarithm.
          </p>
          <p>
            <strong>Solve for base</strong> finds the base b given that log<sub>b</sub>(x) = y, solving b = x<sup>1/y</sup> with full working shown.
          </p>
          <p>
            <strong>Log Laws</strong> demonstrates the three fundamental logarithm rules — the product rule (log(ab) = log a + log b), quotient rule (log(a/b) = log a − log b), power rule (log(aⁿ) = n log a), and the change of base formula — all with step-by-step numerical working.
          </p>
          <p>
            Every mode shows its working so you can follow the logic, not just get an answer — making this an ideal revision tool alongside a fast calculator.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Logarithm Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {[
              { label: 'log₁₀(1000)',   value: '3',           sub: 'because 10³ = 1000' },
              { label: 'log₂(256)',      value: '8',           sub: 'because 2⁸ = 256' },
              { label: 'ln(e²)',         value: '2',           sub: 'natural log, base e' },
              { label: 'log₁₀(0.001)',   value: '−3',          sub: 'because 10⁻³ = 0.001' },
              { label: 'log₂(1)',        value: '0',           sub: 'log of 1 is always 0' },
              { label: 'log₅(125)',      value: '3',           sub: 'because 5³ = 125' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value">{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="logarithm-calculator" />
      </div>
    </div>
  );
}
