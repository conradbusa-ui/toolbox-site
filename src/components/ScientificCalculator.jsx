import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

// ── Button config ─────────────────────────────────────────────
const BUTTONS = [
  // Row 1 — modes & memory
  [
    { label: 'DEG', key: 'DEG', type: 'mode' },
    { label: 'RAD', key: 'RAD', type: 'mode' },
    { label: 'MC',  key: 'MC',  type: 'mem'  },
    { label: 'MR',  key: 'MR',  type: 'mem'  },
    { label: 'M+',  key: 'M+',  type: 'mem'  },
    { label: 'M−',  key: 'M-',  type: 'mem'  },
  ],
  // Row 2 — trig
  [
    { label: 'sin',  key: 'sin',  type: 'fn' },
    { label: 'cos',  key: 'cos',  type: 'fn' },
    { label: 'tan',  key: 'tan',  type: 'fn' },
    { label: 'sin⁻¹',key: 'asin', type: 'fn' },
    { label: 'cos⁻¹',key: 'acos', type: 'fn' },
    { label: 'tan⁻¹',key: 'atan', type: 'fn' },
  ],
  // Row 3 — powers & logs
  [
    { label: 'x²',   key: 'sq',   type: 'fn' },
    { label: 'x³',   key: 'cube', type: 'fn' },
    { label: 'xʸ',   key: '^',    type: 'op' },
    { label: '√x',   key: 'sqrt', type: 'fn' },
    { label: 'ln',   key: 'ln',   type: 'fn' },
    { label: 'log',  key: 'log',  type: 'fn' },
  ],
  // Row 4 — constants & exp
  [
    { label: 'π',    key: 'pi',   type: 'const' },
    { label: 'e',    key: 'e',    type: 'const' },
    { label: '1/x',  key: '1/x',  type: 'fn'    },
    { label: 'eˣ',   key: 'exp',  type: 'fn'    },
    { label: '10ˣ',  key: '10x',  type: 'fn'    },
    { label: '|x|',  key: 'abs',  type: 'fn'    },
  ],
  // Row 5 — brackets, %, CE, C
  [
    { label: '(',    key: '(',    type: 'bracket' },
    { label: ')',    key: ')',    type: 'bracket' },
    { label: '%',    key: '%',    type: 'op'      },
    { label: 'n!',   key: 'fact', type: 'fn'      },
    { label: 'CE',   key: 'CE',   type: 'clear'   },
    { label: 'C',    key: 'C',    type: 'clear'   },
  ],
  // Row 6 — digits & ops
  [
    { label: '7', key: '7', type: 'digit' },
    { label: '8', key: '8', type: 'digit' },
    { label: '9', key: '9', type: 'digit' },
    { label: '⌫', key: 'BS', type: 'clear' },
    { label: '÷', key: '/', type: 'op' },
    { label: '+/−', key: 'neg', type: 'fn' },
  ],
  // Row 7
  [
    { label: '4', key: '4', type: 'digit' },
    { label: '5', key: '5', type: 'digit' },
    { label: '6', key: '6', type: 'digit' },
    { label: '×', key: '*', type: 'op' },
    { label: '−', key: '-', type: 'op' },
    { label: 'EE', key: 'EE', type: 'fn' },
  ],
  // Row 8
  [
    { label: '1', key: '1', type: 'digit' },
    { label: '2', key: '2', type: 'digit' },
    { label: '3', key: '3', type: 'digit' },
    { label: '+', key: '+', type: 'op' },
    { label: '=', key: '=', type: 'equals', rowspan: 2 },
  ],
  // Row 9
  [
    { label: '0', key: '0', type: 'digit', wide: true },
    { label: '.', key: '.', type: 'digit' },
    { label: 'ANS', key: 'ANS', type: 'fn' },
  ],
];

function factorial(n) {
  n = Math.floor(Math.abs(n));
  if (n > 170) return Infinity;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function fmtResult(val) {
  if (val === null) return '';
  if (!isFinite(val)) return val > 0 ? 'Infinity' : val < 0 ? '-Infinity' : 'Error';
  if (isNaN(val)) return 'Error';
  // Use toPrecision for clean display but avoid scientific notation for moderate numbers
  const abs = Math.abs(val);
  if (abs === 0) return '0';
  if (abs >= 1e-7 && abs < 1e13) {
    const str = parseFloat(val.toPrecision(12)).toString();
    return str;
  }
  return val.toExponential(8);
}

function toRad(val, isDeg) {
  return isDeg ? (val * Math.PI) / 180 : val;
}

function fromRad(val, isDeg) {
  return isDeg ? (val * 180) / Math.PI : val;
}

export default function ScientificCalculator() {
  const [display, setDisplay]   = useState('0');
  const [expression, setExpr]   = useState('');
  const [memory, setMemory]     = useState(0);
  const [isDeg, setIsDeg]       = useState(true);
  const [justEvaled, setJustEvaled] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [history, setHistory]   = useState([]);

  const appendToDisplay = useCallback((val) => {
    setDisplay(prev => {
      if (justEvaled && /[\d.]/.test(val)) {
        setJustEvaled(false);
        return val;
      }
      setJustEvaled(false);
      if (prev === '0' && /^\d$/.test(val)) return val;
      if (prev === 'Error' || prev === 'Infinity') return val;
      return prev + val;
    });
    setExpr(prev => prev + val);
  }, [justEvaled]);

  const evaluate = useCallback(() => {
    let expr = display;
    if (expr === '' || expr === 'Error') return;

    try {
      // Replace visual operators with JS operators
      let js = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, `(${Math.PI})`)
        .replace(/\be\b/g, `(${Math.E})`)
        .replace(/\^/g, '**');

      const result = Function('"use strict"; return (' + js + ')')();
      const formatted = fmtResult(result);
      setHistory(h => [`${expr} = ${formatted}`, ...h].slice(0, 10));
      setLastAnswer(result);
      setDisplay(formatted);
      setExpr(formatted);
      setJustEvaled(true);
    } catch {
      setDisplay('Error');
      setExpr('');
    }
  }, [display]);

  const applyFn = useCallback((key) => {
    const current = parseFloat(display);
    let result;

    switch (key) {
      case 'sin':  result = isDeg ? Math.sin(toRad(current, true)) : Math.sin(current); break;
      case 'cos':  result = isDeg ? Math.cos(toRad(current, true)) : Math.cos(current); break;
      case 'tan':  result = isDeg ? Math.tan(toRad(current, true)) : Math.tan(current); break;
      case 'asin': result = fromRad(Math.asin(current), isDeg); break;
      case 'acos': result = fromRad(Math.acos(current), isDeg); break;
      case 'atan': result = fromRad(Math.atan(current), isDeg); break;
      case 'sqrt': result = Math.sqrt(current); break;
      case 'sq':   result = current * current; break;
      case 'cube': result = current * current * current; break;
      case 'ln':   result = Math.log(current); break;
      case 'log':  result = Math.log10(current); break;
      case '1/x':  result = 1 / current; break;
      case 'exp':  result = Math.exp(current); break;
      case '10x':  result = Math.pow(10, current); break;
      case 'abs':  result = Math.abs(current); break;
      case 'fact': result = factorial(current); break;
      case 'neg':  result = -current; break;
      case 'EE':   appendToDisplay('e'); return;
      case 'ANS':
        if (lastAnswer !== null) {
          const ans = fmtResult(lastAnswer);
          setDisplay(prev => (prev === '0' || justEvaled ? ans : prev + ans));
          setExpr(prev => (justEvaled ? ans : prev + ans));
          setJustEvaled(false);
        }
        return;
      default: return;
    }

    const formatted = fmtResult(result);
    setHistory(h => [`${key}(${current}) = ${formatted}`, ...h].slice(0, 10));
    setLastAnswer(result);
    setDisplay(formatted);
    setExpr(formatted);
    setJustEvaled(true);
  }, [display, isDeg, lastAnswer, justEvaled, appendToDisplay]);

  const handleButton = useCallback((key, type) => {
    switch (type) {
      case 'digit':
        appendToDisplay(key);
        break;
      case 'op':
        if (key === '%') {
          const v = parseFloat(display);
          const pct = fmtResult(v / 100);
          setDisplay(pct);
          setExpr(prev => prev.slice(0, -display.length) + pct);
        } else {
          if (justEvaled) setJustEvaled(false);
          setDisplay(prev => {
            const last = prev.slice(-1);
            if (['+', '-', '*', '/'].includes(last)) {
              return prev.slice(0, -1) + key;
            }
            return prev + key;
          });
          setExpr(prev => {
            const last = prev.slice(-1);
            if (['+', '-', '*', '/'].includes(last)) return prev.slice(0, -1) + key;
            return prev + key;
          });
        }
        break;
      case 'fn':
        applyFn(key);
        break;
      case 'const':
        if (key === 'pi') appendToDisplay('π');
        else if (key === 'e') appendToDisplay('e');
        break;
      case 'bracket':
        appendToDisplay(key);
        break;
      case 'equals':
        evaluate();
        break;
      case 'clear':
        if (key === 'C') {
          setDisplay('0');
          setExpr('');
          setJustEvaled(false);
        } else if (key === 'CE') {
          setDisplay('0');
          setExpr(prev => {
            // remove last token
            const trimmed = prev.trimEnd();
            const match = trimmed.match(/^(.*?)([^+\-*/()^%]+)$/);
            return match ? match[1] : '';
          });
        } else if (key === 'BS') {
          setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
          setExpr(prev => prev.slice(0, -1));
        }
        break;
      case 'mode':
        setIsDeg(key === 'DEG');
        break;
      case 'mem':
        const cur = parseFloat(display);
        if (key === 'MC') setMemory(0);
        else if (key === 'MR') {
          const m = fmtResult(memory);
          setDisplay(m);
          setExpr(prev => justEvaled ? m : prev + m);
          setJustEvaled(false);
        }
        else if (key === 'M+') setMemory(m => m + cur);
        else if (key === 'M-') setMemory(m => m - cur);
        break;
      default:
        break;
    }
  }, [appendToDisplay, applyFn, evaluate, display, justEvaled, memory]);

  const btnColor = (type) => {
    switch (type) {
      case 'equals':  return { background: 'var(--accent)', color: 'white', border: '1px solid var(--accent-hover)' };
      case 'clear':   return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      case 'op':      return { background: '#1e293b', color: '#5eead4', border: '1px solid #334155' };
      case 'fn':
      case 'trig':    return { background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' };
      case 'mode':    return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
      case 'mem':     return { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' };
      case 'const':   return { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
      case 'bracket': return { background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' };
      default:        return { background: 'white',   color: '#0f172a', border: '1px solid #e2e8f0' };
    }
  };

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Scientific Calculator</span>
          </div>
          <h1>Scientific Calculator</h1>
          <p className="subtitle">
            A full-featured scientific calculator with trig functions, logarithms, powers, memory, and degree/radian mode.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box" style={{ padding: '20px' }}>
          <h2 className="tool-box-title">Calculator</h2>

          {/* Mode indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                background: isDeg ? 'var(--accent)' : 'var(--surface2)',
                color: isDeg ? 'white' : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}>DEG</span>
              <span style={{
                padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                background: !isDeg ? 'var(--accent)' : 'var(--surface2)',
                color: !isDeg ? 'white' : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}>RAD</span>
              {memory !== 0 && (
                <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                  M: {fmtResult(memory)}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
              {expression !== fmtResult(lastAnswer) ? expression : ''}
            </span>
          </div>

          {/* Display */}
          <div style={{
            background: '#0f172a',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            marginBottom: '12px',
            minHeight: '64px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
          }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: display.length > 14 ? '1.2rem' : display.length > 10 ? '1.6rem' : '2rem',
              fontWeight: 600,
              color: display === 'Error' ? '#fca5a5' : '#5eead4',
              letterSpacing: '-0.02em',
              wordBreak: 'break-all',
              textAlign: 'right',
            }}>
              {display}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
            {BUTTONS.map((row, ri) =>
              row.map((btn) => {
                const colors = btnColor(btn.type);
                return (
                  <button
                    key={`${ri}-${btn.key}`}
                    onClick={() => handleButton(btn.key, btn.type)}
                    style={{
                      ...colors,
                      gridColumn: btn.wide ? 'span 2' : btn.rowspan ? '5 / 7' : 'span 1',
                      gridRow: btn.rowspan ? `${ri + 1} / ${ri + 3}` : 'auto',
                      padding: '11px 4px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: btn.type === 'digit' || btn.type === 'op' ? 'var(--mono)' : 'var(--font)',
                      transition: 'opacity 0.1s, transform 0.08s',
                      lineHeight: 1.2,
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title={btn.key}
                  >
                    {btn.label}
                  </button>
                );
              })
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '6px' }}>
                History
              </p>
              <div style={{
                background: '#0f172a',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                maxHeight: '130px',
                overflowY: 'auto',
              }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '0.78rem',
                    color: i === 0 ? '#5eead4' : '#64748b',
                    padding: '2px 0',
                    borderBottom: i < history.length - 1 ? '1px solid #1e293b' : 'none',
                  }}>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Scientific Calculator</h2>
          <p>
            This scientific calculator handles everything from basic arithmetic to advanced
            mathematical functions used in science, engineering, and academia. It supports
            trigonometric functions (sin, cos, tan and their inverses), logarithms (natural log
            and base-10 log), exponential functions, powers, square roots, factorials, and
            absolute values — all accessible with a single tap or click.
          </p>
          <p>
            Switch between Degree and Radian mode at the top to control how trigonometric
            functions interpret angles. Degree mode is the default and is used in most everyday
            calculations. Radian mode is required for calculus and many physics applications.
            The memory buttons (MC, MR, M+, M−) let you store and recall intermediate results
            across calculations without retyping them. The ANS button recalls the last computed
            result, and a 10-entry history log shows your recent calculations for easy reference.
          </p>
          <p>
            The calculator supports chained expressions using standard order of operations with
            parentheses for grouping. Use π and e for the mathematical constants, and xʸ for
            arbitrary powers. The CE button clears only the last entry, while C resets the
            entire calculation. All processing happens instantly in your browser — nothing is
            sent to any server.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Scientific Calculator Examples</h2>
          <p>
            <strong>Trigonometry (degrees):</strong> sin(30) = 0.5 · cos(60) = 0.5 · tan(45) = 1.
            Switch to RAD mode for radian inputs: sin(π/2) = 1.
          </p>
          <p>
            <strong>Powers and roots:</strong> 2 xʸ 10 = 1024 · √144 = 12 · 5³ = 125.
            Use the x² button to square a number instantly.
          </p>
          <p>
            <strong>Logarithms:</strong> log(1000) = 3 (base 10) · ln(e) = 1 ·
            ln(100) ≈ 4.605.
          </p>
          <p>
            <strong>Factorials and combinations:</strong> 5! = 120 · 10! = 3,628,800.
            Use parentheses for complex expressions: (3 + 4) × (8 − 2) = 42.
          </p>
          <p>
            <strong>Constants:</strong> π ≈ 3.14159265 · e ≈ 2.71828182.
            Example: 2 × π × 5 = 31.4159 (circumference of a circle with radius 5).
          </p>
        </div>

        <RelatedTools currentId="scientific-calculator" />
      </div>
    </div>
  );
}
