import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

function fmt(n, dp = 10) {
  if (!isFinite(n)) return 'undefined';
  if (isNaN(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9 && Math.abs(n) < 1e15) return String(Math.round(n));
  if (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-6 && n !== 0) {
    return n.toExponential(6);
  }
  return parseFloat(n.toFixed(dp)).toString();
}

function isInt(n) { return Number.isInteger(n); }

function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

// Exponent laws labels
const LAWS = [
  { name: 'Product Rule',      expr: 'aᵐ × aⁿ = aᵐ⁺ⁿ' },
  { name: 'Quotient Rule',     expr: 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ' },
  { name: 'Power of a Power',  expr: '(aᵐ)ⁿ = aᵐˣⁿ' },
  { name: 'Zero Exponent',     expr: 'a⁰ = 1  (a ≠ 0)' },
  { name: 'Negative Exponent', expr: 'a⁻ⁿ = 1 / aⁿ' },
  { name: 'Fractional Exp.',   expr: 'a^(m/n) = ⁿ√(aᵐ)' },
];

// ── Shared UI ─────────────────────────────────────────────────

function ResultCard({ label, value, sub, wide }) {
  return (
    <div style={{
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
      padding: '16px 22px',
      textAlign: 'center',
      flex: wide ? '1 1 100%' : '1 1 140px',
      minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(1.2rem,3.5vw,1.9rem)', fontWeight: 700,
        fontFamily: 'var(--mono)', color: 'var(--accent-hover)',
        marginTop: '5px', lineHeight: 1.1, wordBreak: 'break-all',
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function StepList({ steps }) {
  if (!steps?.length) return null;
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

// ── Mode 1: Base^Exponent ─────────────────────────────────────

function EvaluateMode() {
  const [base, setBase]   = useState('');
  const [exp, setExp]     = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    const b = parseFloat(base);
    const e = parseFloat(exp);

    if (isNaN(b)) { setError('Enter a valid base.'); setResult(null); return; }
    if (isNaN(e)) { setError('Enter a valid exponent.'); setResult(null); return; }
    if (b === 0 && e <= 0) { setError('0 raised to a zero or negative power is undefined.'); setResult(null); return; }
    if (b < 0 && !isInt(e)) { setError('Negative base with fractional exponent yields a complex number. Try an integer exponent.'); setResult(null); return; }

    const val = Math.pow(b, e);

    const steps = [];

    // Special cases
    if (e === 0) {
      steps.push({ label: 'Zero exponent rule', expr: `Any non-zero number to the power 0 = 1` });
      steps.push({ label: 'Result', expr: `${fmt(b)}⁰ = 1` });
    } else if (e === 1) {
      steps.push({ label: 'Exponent of 1', expr: `Any number to the power 1 = itself` });
      steps.push({ label: 'Result', expr: `${fmt(b)}¹ = ${fmt(b)}` });
    } else if (e < 0) {
      steps.push({ label: 'Negative exponent rule', expr: `${fmt(b)}^${fmt(e)} = 1 / ${fmt(b)}^${fmt(-e)}` });
      steps.push({ label: `Calculate ${fmt(b)}^${fmt(-e)}`, expr: `= ${fmt(Math.pow(b, -e))}` });
      steps.push({ label: 'Take reciprocal', expr: `1 / ${fmt(Math.pow(b, -e))} = ${fmt(val)}` });
    } else if (isInt(e) && e > 0 && e <= 10) {
      // Show repeated multiplication for small integer exponents
      const terms = Array(e).fill(fmt(b)).join(' × ');
      steps.push({ label: `Repeated multiplication (${e} times)`, expr: `${fmt(b)}^${e} = ${terms}` });
      steps.push({ label: 'Result', expr: `= ${fmt(val)}` });
    } else if (!isInt(e)) {
      // Fractional exponent
      const [numStr, denStr] = String(e).split('.');
      // Interpret as x^(m/n) if possible
      steps.push({ label: 'Fractional exponent rule', expr: `${fmt(b)}^${fmt(e)} = e^(${fmt(e)} × ln(${fmt(b)}))` });
      steps.push({ label: `ln(${fmt(b)})`, expr: `= ${fmt(Math.log(b))}` });
      steps.push({ label: `Multiply`, expr: `${fmt(e)} × ${fmt(Math.log(b))} = ${fmt(e * Math.log(b))}` });
      steps.push({ label: `e^${fmt(e * Math.log(b))}`, expr: `= ${fmt(val)}` });
    } else {
      steps.push({ label: 'Formula', expr: `${fmt(b)}^${fmt(e)}` });
      steps.push({ label: 'Result', expr: `= ${fmt(val)}` });
    }

    // Scientific notation if large
    const sciNote = Math.abs(val) >= 1e6 ? val.toExponential(6) : null;

    setResult({ val, b, e, sciNote, steps });
    setError('');
  }

  const QUICK_EXPS = ['-2', '-1', '0', '0.5', '1', '2', '3', '4', '10'];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate <strong>base<sup>exponent</sup></strong> for any base and exponent — including negatives, decimals, and fractions.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Base</label>
          <input type="number" value={base}
            onChange={e => { setBase(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 2"
            style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
          ^
        </div>
        <div className="form-group">
          <label>Exponent</label>
          <input type="number" value={exp}
            onChange={e => { setExp(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 10"
            style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* Live preview */}
      {base && exp && (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '0.95rem',
          color: 'var(--accent-hover)', background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)', padding: '8px 14px',
          marginBottom: '14px', letterSpacing: '0.01em',
        }}>
          {base} ^ {exp} = ?
        </div>
      )}

      {/* Quick exponent presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Quick exponents
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUICK_EXPS.map(e => (
            <button
              key={e}
              className={`tag${exp === e ? ' active' : ''}`}
              onClick={() => { setExp(e); setResult(null); setError(''); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}
            >
              ^{e}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setBase(''); setExp(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label={`${fmt(result.b)} ^ ${fmt(result.e)}`}
              value={fmt(result.val)}
            />
            {result.sciNote && (
              <ResultCard label="Scientific notation" value={result.sciNote} />
            )}
            {result.e !== 0 && result.e !== 1 && (
              <ResultCard
                label="Reciprocal (1/result)"
                value={fmt(1 / result.val)}
                sub="inverse"
              />
            )}
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 2: Exponent Laws ─────────────────────────────────────

function LawsMode() {
  const [a, setA]     = useState('');
  const [m, setM]     = useState('');
  const [n, setN]     = useState('');
  const [op, setOp]   = useState('product');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const OPS = [
    { id: 'product',  label: 'Product',        desc: 'aᵐ × aⁿ' },
    { id: 'quotient', label: 'Quotient',        desc: 'aᵐ ÷ aⁿ' },
    { id: 'power',    label: 'Power of Power',  desc: '(aᵐ)ⁿ' },
    { id: 'negative', label: 'Negative Exp.',   desc: 'a⁻ⁿ' },
    { id: 'fraction', label: 'Fractional Exp.', desc: 'a^(m/n)' },
  ];

  function calculate() {
    const av = parseFloat(a);
    const mv = parseFloat(m);
    const nv = parseFloat(n);

    if (isNaN(av)) { setError('Enter a valid base (a).'); setResult(null); return; }
    if (isNaN(mv)) { setError('Enter a valid value for m.'); setResult(null); return; }

    if (op !== 'negative' && op !== 'fraction' && isNaN(nv)) {
      setError('Enter a valid value for n.'); setResult(null); return;
    }

    let val, steps, law;

    if (op === 'product') {
      val = Math.pow(av, mv + nv);
      law = `aᵐ × aⁿ = aᵐ⁺ⁿ`;
      steps = [
        { label: 'Product rule', expr: law },
        { label: 'Add exponents', expr: `${fmt(mv)} + ${fmt(nv)} = ${fmt(mv + nv)}` },
        { label: 'Calculate', expr: `${fmt(av)}^${fmt(mv + nv)} = ${fmt(val)}` },
        { label: 'Verify (LHS)', expr: `${fmt(av)}^${fmt(mv)} × ${fmt(av)}^${fmt(nv)} = ${fmt(Math.pow(av,mv))} × ${fmt(Math.pow(av,nv))} = ${fmt(val)}` },
      ];
    } else if (op === 'quotient') {
      if (nv === 0) { setError('Cannot divide by a⁰ exponent in this context.'); setResult(null); return; }
      val = Math.pow(av, mv - nv);
      law = `aᵐ ÷ aⁿ = aᵐ⁻ⁿ`;
      steps = [
        { label: 'Quotient rule', expr: law },
        { label: 'Subtract exponents', expr: `${fmt(mv)} − ${fmt(nv)} = ${fmt(mv - nv)}` },
        { label: 'Calculate', expr: `${fmt(av)}^${fmt(mv - nv)} = ${fmt(val)}` },
        { label: 'Verify (LHS)', expr: `${fmt(av)}^${fmt(mv)} ÷ ${fmt(av)}^${fmt(nv)} = ${fmt(Math.pow(av,mv))} ÷ ${fmt(Math.pow(av,nv))} = ${fmt(val)}` },
      ];
    } else if (op === 'power') {
      val = Math.pow(av, mv * nv);
      law = `(aᵐ)ⁿ = aᵐˣⁿ`;
      steps = [
        { label: 'Power of a power rule', expr: law },
        { label: 'Multiply exponents', expr: `${fmt(mv)} × ${fmt(nv)} = ${fmt(mv * nv)}` },
        { label: 'Calculate', expr: `${fmt(av)}^${fmt(mv * nv)} = ${fmt(val)}` },
        { label: 'Verify (LHS)', expr: `(${fmt(av)}^${fmt(mv)})^${fmt(nv)} = (${fmt(Math.pow(av,mv))})^${fmt(nv)} = ${fmt(val)}` },
      ];
    } else if (op === 'negative') {
      if (av === 0) { setError('Base cannot be 0 for negative exponent.'); setResult(null); return; }
      val = Math.pow(av, -mv);
      law = `a⁻ⁿ = 1 / aⁿ`;
      steps = [
        { label: 'Negative exponent rule', expr: law },
        { label: 'Rewrite', expr: `${fmt(av)}^(−${fmt(mv)}) = 1 / ${fmt(av)}^${fmt(mv)}` },
        { label: `Calculate ${fmt(av)}^${fmt(mv)}`, expr: `= ${fmt(Math.pow(av, mv))}` },
        { label: 'Reciprocal', expr: `1 / ${fmt(Math.pow(av, mv))} = ${fmt(val)}` },
      ];
    } else if (op === 'fraction') {
      if (isNaN(nv) || nv === 0) { setError('Enter a valid denominator (n) for the fractional exponent.'); setResult(null); return; }
      if (av < 0 && nv % 2 === 0) { setError('Even root of a negative base is complex.'); setResult(null); return; }
      val = Math.pow(Math.abs(av), mv / nv) * (av < 0 ? -1 : 1);
      law = `a^(m/n) = ⁿ√(aᵐ)`;
      steps = [
        { label: 'Fractional exponent rule', expr: law },
        { label: 'Interpret as nth root of a power', expr: `${fmt(av)}^(${fmt(mv)}/${fmt(nv)}) = ${fmt(nv)}√(${fmt(av)}^${fmt(mv)})` },
        { label: `Calculate ${fmt(av)}^${fmt(mv)}`, expr: `= ${fmt(Math.pow(av, mv))}` },
        { label: `Take the ${fmt(nv)}th root`, expr: `${fmt(nv)}√${fmt(Math.pow(av, mv))} = ${fmt(val)}` },
      ];
    }

    setResult({ val, law, steps });
    setError('');
  }

  const needsN = op !== 'negative';
  const mLabel = op === 'fraction' ? 'm (numerator)' : op === 'negative' ? 'n (exponent)' : 'm';
  const nLabel = op === 'fraction' ? 'n (denominator)' : 'n';

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '14px' }}>
        Apply and verify the core exponent laws — product, quotient, power of a power, negative, and fractional exponents.
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
              padding: '9px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
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
          <label>Base (a)</label>
          <input type="number" value={a}
            onChange={e => { setA(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 2" />
        </div>
        <div className="form-group">
          <label>{mLabel}</label>
          <input type="number" value={m}
            onChange={e => { setM(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 3" />
        </div>
        {needsN && (
          <div className="form-group">
            <label>{nLabel}</label>
            <input type="number" value={n}
              onChange={e => { setN(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 2" />
          </div>
        )}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Apply Law</button>
        <button className="btn btn-ghost" onClick={() => { setA(''); setM(''); setN(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 16px',
            fontFamily: 'var(--mono)', fontSize: '0.9rem', color: 'var(--accent-hover)',
            marginBottom: '14px',
          }}>
            Law: {result.law}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard label="Result" value={fmt(result.val)} />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Solve for exponent ────────────────────────────────
// b^x = y  →  x = log(y)/log(b)

function SolveExpMode() {
  const [base, setBase]   = useState('');
  const [res, setRes]     = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    const b = parseFloat(base);
    const y = parseFloat(res);

    if (isNaN(b) || b <= 0 || b === 1) { setError('Base must be a positive number other than 1.'); setResult(null); return; }
    if (isNaN(y) || y <= 0)             { setError('Result (y) must be a positive number.'); setResult(null); return; }

    const x = Math.log(y) / Math.log(b);
    const steps = [
      { label: 'Equation', expr: `${fmt(b)}^x = ${fmt(y)}` },
      { label: 'Take log of both sides', expr: `x × log(${fmt(b)}) = log(${fmt(y)})` },
      { label: 'Solve for x', expr: `x = log(${fmt(y)}) / log(${fmt(b)})` },
      { label: `log(${fmt(y)})`, expr: `= ${fmt(Math.log10(y))}` },
      { label: `log(${fmt(b)})`, expr: `= ${fmt(Math.log10(b))}` },
      { label: 'Divide', expr: `x = ${fmt(Math.log10(y))} / ${fmt(Math.log10(b))} = ${fmt(x)}` },
      { label: 'Verify', expr: `${fmt(b)}^${fmt(x)} = ${fmt(Math.pow(b, x))}  ✓` },
    ];

    setResult({ x, b, y, steps });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Find the exponent <strong>x</strong> when you know the base and result: <strong>b<sup>x</sup> = y</strong>.
      </p>
      <div className="form-row">
        <div className="form-group">
          <label>Base (b)</label>
          <input type="number" value={base}
            onChange={e => { setBase(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 2" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', fontSize: '1rem', color: 'var(--text-3)', flexShrink: 0 }}>
          ^ x =
        </div>
        <div className="form-group">
          <label>Result (y)</label>
          <input type="number" value={res}
            onChange={e => { setRes(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 1024" />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Solve for x</button>
        <button className="btn btn-ghost" onClick={() => { setBase(''); setRes(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <ResultCard
              label={`${fmt(result.b)} ^ x = ${fmt(result.y)}`}
              value={`x = ${fmt(result.x)}`}
            />
          </div>
          <StepList steps={result.steps} />
        </div>
      )}
    </div>
  );
}

// ── Mode 4: Power table ───────────────────────────────────────

function PowerTableMode() {
  const [base, setBase] = useState('2');
  const [maxExp, setMaxExp] = useState('16');

  const b = parseFloat(base);
  const maxE = Math.min(Math.max(parseInt(maxExp) || 10, 2), 30);
  const validBase = !isNaN(b) && b !== 0;

  const rows = validBase
    ? Array.from({ length: maxE + 1 }, (_, i) => ({
        exp: i,
        val: Math.pow(b, i),
      }))
    : [];

  const COMMON_BASES = ['2', '3', '5', '10'];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Generate a complete powers table for any base — useful for quick look-ups and spotting patterns.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Base</label>
          <input type="number" value={base}
            onChange={e => setBase(e.target.value)}
            placeholder="e.g. 2" />
        </div>
        <div className="form-group">
          <label>Max exponent</label>
          <input type="number" value={maxExp} min="2" max="30"
            onChange={e => setMaxExp(e.target.value)}
            placeholder="16" />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Common bases
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COMMON_BASES.map(cb => (
            <button
              key={cb}
              className={`tag${base === cb ? ' active' : ''}`}
              onClick={() => setBase(cb)}
            >
              Base {cb}
            </button>
          ))}
        </div>
      </div>

      {validBase && rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Exponent (n)', `${fmt(b)} ^ n`, 'Scientific'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 14px',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ exp: e, val: v }) => (
                <tr
                  key={e}
                  style={{ borderBottom: '1px solid var(--border)', background: e % 2 === 0 ? 'var(--surface2)' : 'transparent' }}
                >
                  <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>
                    {e}
                  </td>
                  <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)' }}>
                    {Math.abs(v) < 1e15 ? v.toLocaleString() : fmt(v)}
                  </td>
                  <td style={{ padding: '7px 14px', fontFamily: 'var(--mono)', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                    {v.toExponential(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs & main component ────────────────────────────────

const MODES = [
  { label: 'Evaluate bⁿ',     desc: 'base ^ exponent' },
  { label: 'Exponent Laws',   desc: 'product, power...' },
  { label: 'Solve for x',     desc: 'bˣ = y → find x' },
  { label: 'Powers Table',    desc: 'bⁿ reference chart' },
];

export default function ExponentCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a>
            <span>›</span>
            <span>Exponent Calculator</span>
          </div>
          <h1>Exponent Calculator</h1>
          <p className="subtitle">
            Evaluate powers, apply exponent laws, solve for unknown exponents, and generate powers tables — with step-by-step working.
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
                  padding: '10px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
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
          {mode === 1 && <LawsMode />}
          {mode === 2 && <SolveExpMode />}
          {mode === 3 && <PowerTableMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Exponent Calculator</h2>
          <p>
            This free exponent calculator handles every common power operation — all running instantly in your browser with full step-by-step working and no sign-up required.
          </p>
          <p>
            <strong>Evaluate bⁿ</strong> calculates any base raised to any exponent, including negative exponents (which return fractions), fractional exponents (which return roots), and zero as an exponent (always 1). Quick-select buttons let you instantly try the most common exponents. For large results, scientific notation is shown alongside the standard form.
          </p>
          <p>
            <strong>Exponent Laws</strong> demonstrates all five fundamental rules with numerical verification at every step: the <em>product rule</em> (aᵐ × aⁿ = aᵐ⁺ⁿ), <em>quotient rule</em> (aᵐ ÷ aⁿ = aᵐ⁻ⁿ), <em>power of a power</em> ((aᵐ)ⁿ = aᵐˣⁿ), <em>negative exponent rule</em> (a⁻ⁿ = 1/aⁿ), and <em>fractional exponents</em> (a^(m/n) = ⁿ√aᵐ).
          </p>
          <p>
            <strong>Solve for x</strong> finds the unknown exponent in bˣ = y using logarithms — for example, 2ˣ = 1024 gives x = 10. This is a common exam question type in GCSE and A-Level maths.
          </p>
          <p>
            <strong>Powers Table</strong> generates a complete reference chart of bⁿ for any base up to exponent 30, shown with both standard and scientific notation — useful for revision, computing, and spotting geometric sequence patterns.
          </p>
        </div>

        {/* Exponent Laws Reference */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Exponent Laws Reference</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {LAWS.map(law => (
              <div key={law.name} className="result-stat">
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {law.name}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', color: 'var(--accent-hover)', fontWeight: 700, lineHeight: 1.4 }}>
                  {law.expr}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Quick Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            {[
              { label: '2^10',       value: '1,024',      sub: 'binary kilo' },
              { label: '10^6',       value: '1,000,000',  sub: 'one million' },
              { label: '5^-2',       value: '0.04',       sub: 'negative exponent' },
              { label: '16^0.5',     value: '4',          sub: 'fractional = √' },
              { label: '3^0',        value: '1',          sub: 'zero exponent rule' },
              { label: '2^x = 1024', value: 'x = 10',     sub: 'solve for exponent' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="exponent-calculator" />
      </div>
    </div>
  );
}
