import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

function fmt(n, dp = 6) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(dp)).toString();
}

function parseNumbers(raw) {
  const tokens = raw
    .split(/[\s,;\t\n]+/)
    .map(t => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) throw new Error('Enter at least one number.');
  const nums = tokens.map(t => parseFloat(t));
  const bad = nums.findIndex(n => isNaN(n));
  if (bad !== -1) throw new Error(`"${tokens[bad]}" is not a valid number.`);
  return nums;
}

function calcMean(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calcVariance(nums, mean, population) {
  const denom = population ? nums.length : nums.length - 1;
  if (denom <= 0) return 0;
  return nums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / denom;
}

function computeStats(nums) {
  const n = nums.length;
  const sorted = [...nums].sort((a, b) => a - b);
  const mean = calcMean(nums);
  const sum = nums.reduce((a, b) => a + b, 0);
  const sumSq = nums.reduce((a, x) => a + x * x, 0);

  const popVar = calcVariance(nums, mean, true);
  const sampVar = n > 1 ? calcVariance(nums, mean, false) : null;
  const popSD = Math.sqrt(popVar);
  const sampSD = sampVar !== null ? Math.sqrt(sampVar) : null;

  // Deviations table
  const deviations = nums.map((x, i) => ({
    i: i + 1,
    x,
    dev: x - mean,
    devSq: Math.pow(x - mean, 2),
  }));

  const sumDevSq = deviations.reduce((s, d) => s + d.devSq, 0);

  return {
    nums, sorted, n, mean, sum, sumSq, sumDevSq,
    popVar, sampVar, popSD, sampSD, deviations,
    min: sorted[0], max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    cv: popSD / Math.abs(mean),         // coefficient of variation
  };
}

// ── UI helpers ────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, highlight }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1.5px solid ${accent ? 'var(--accent)' : highlight ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px 18px',
      textAlign: 'center',
      flex: '1 1 130px',
      minWidth: '115px',
    }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: accent ? 'var(--accent-hover)' : 'var(--text-3)',
        marginBottom: '5px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(1.1rem,3vw,1.75rem)', fontWeight: 700,
        fontFamily: 'var(--mono)', color: accent ? 'var(--accent-hover)' : 'var(--text)',
        lineHeight: 1.1, wordBreak: 'break-all',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>
      )}
    </div>
  );
}

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
  return (
    <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>
  );
}

// ── Deviations table ──────────────────────────────────────────

function DeviationsTable({ deviations, mean, type }) {
  const denom = type === 'population' ? deviations.length : deviations.length - 1;
  const sumDevSq = deviations.reduce((s, d) => s + d.devSq, 0);
  const variance = sumDevSq / denom;

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['#', 'Value (xᵢ)', 'Deviation (xᵢ − x̄)', 'Deviation² (xᵢ − x̄)²'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '7px 12px',
                fontSize: '0.68rem', fontWeight: 700,
                color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deviations.map(d => (
            <tr key={d.i} style={{
              borderBottom: '1px solid var(--border)',
              background: d.i % 2 === 0 ? 'var(--surface2)' : 'transparent',
            }}>
              <td style={{ padding: '7px 12px', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{d.i}</td>
              <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmt(d.x)}</td>
              <td style={{
                padding: '7px 12px', fontFamily: 'var(--mono)',
                color: d.dev >= 0 ? '#15803d' : '#dc2626',
              }}>
                {d.dev >= 0 ? '+' : ''}{fmt(d.dev)}
              </td>
              <td style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: 'var(--accent-hover)', fontWeight: 600 }}>
                {fmt(d.devSq)}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--accent-light)' }}>
            <td colSpan={2} style={{ padding: '8px 12px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-hover)' }}>
              Σ (mean = {fmt(mean)})
            </td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-3)', fontSize: '0.78rem' }}>
              ≈ 0
            </td>
            <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>
              {fmt(sumDevSq)}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{
        marginTop: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
        padding: '10px 14px', fontSize: '0.82rem', fontFamily: 'var(--mono)', color: 'var(--text)',
      }}>
        <div>Variance = {fmt(sumDevSq)} ÷ {denom} = <strong style={{ color: 'var(--accent-hover)' }}>{fmt(variance)}</strong></div>
        <div style={{ marginTop: '4px' }}>
          SD = √{fmt(variance)} = <strong style={{ color: 'var(--accent-hover)' }}>{fmt(Math.sqrt(variance))}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Step-by-step ──────────────────────────────────────────────

function Steps({ stats, type }) {
  const { nums, n, mean, sumDevSq, popVar, sampVar, popSD, sampSD } = stats;
  const isPopulation = type === 'population';
  const variance = isPopulation ? popVar : sampVar;
  const sd = isPopulation ? popSD : sampSD;
  const denom = isPopulation ? n : n - 1;
  const denomLabel = isPopulation ? 'N' : 'N − 1';

  if (sd === null) return (
    <div className="output-area" style={{ marginTop: '10px', color: '#fca5a5' }}>
      ⚠ Need at least 2 values for sample standard deviation.
    </div>
  );

  const steps = [
    {
      label: `Step 1: Find the mean  (x̄ = Σxᵢ / N)`,
      expr: `(${nums.map(fmt).join(' + ')}) / ${n} = ${fmt(mean)}`,
    },
    {
      label: `Step 2: Subtract the mean from each value`,
      expr: nums.map(x => `${fmt(x)} − ${fmt(mean)} = ${fmt(x - mean) >= 0 ? '+' : ''}${fmt(x - mean)}`).join('\n'),
    },
    {
      label: `Step 3: Square each deviation`,
      expr: nums.map(x => `(${fmt(x - mean)})² = ${fmt(Math.pow(x - mean, 2))}`).join('\n'),
    },
    {
      label: `Step 4: Sum of squared deviations  (Σ(xᵢ − x̄)²)`,
      expr: `${nums.map(x => fmt(Math.pow(x - mean, 2))).join(' + ')} = ${fmt(sumDevSq)}`,
    },
    {
      label: `Step 5: Divide by ${denomLabel} = ${denom}  (${isPopulation ? 'population' : 'sample'} variance)`,
      expr: `${fmt(sumDevSq)} ÷ ${denom} = ${fmt(variance)}`,
    },
    {
      label: `Step 6: Take the square root  (standard deviation)`,
      expr: `√${fmt(variance)} = ${fmt(sd)}`,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
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
            <div style={{
              fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text)',
              marginTop: '2px', whiteSpace: 'pre-wrap', lineHeight: 1.6,
            }}>{s.expr}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bell curve visual (SVG) ───────────────────────────────────

function BellCurve({ mean, sd }) {
  if (!isFinite(mean) || !isFinite(sd) || sd === 0) return null;

  const W = 360, H = 110;
  const xMin = mean - 4 * sd;
  const xMax = mean + 4 * sd;

  function toX(v) { return ((v - xMin) / (xMax - xMin)) * W; }

  function normal(x) {
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
  }

  const yMax = normal(mean);
  function toY(v) { return H - 10 - (v / yMax) * (H - 20); }

  // Build path
  const steps = 200;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const x = xMin + (i / steps) * (xMax - xMin);
    return `${toX(x).toFixed(1)},${toY(normal(x)).toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')} L ${W},${H} L 0,${H} Z`;
  const linePath = `M ${points.join(' L ')}`;

  // Shade ±1σ, ±2σ, ±3σ
  function shadePath(lo, hi) {
    const pts = Array.from({ length: 100 }, (_, i) => {
      const x = lo + (i / 99) * (hi - lo);
      return `${toX(x).toFixed(1)},${toY(normal(x)).toFixed(1)}`;
    });
    return `M ${toX(lo).toFixed(1)},${H} L ${pts.join(' L ')} L ${toX(hi).toFixed(1)},${H} Z`;
  }

  const bands = [
    { lo: mean - 3*sd, hi: mean + 3*sd, fill: 'rgba(13,148,136,0.08)' },
    { lo: mean - 2*sd, hi: mean + 2*sd, fill: 'rgba(13,148,136,0.14)' },
    { lo: mean - sd,   hi: mean + sd,   fill: 'rgba(13,148,136,0.22)' },
  ];

  const ticks = [
    { v: mean - 3*sd, label: 'μ−3σ' },
    { v: mean - 2*sd, label: 'μ−2σ' },
    { v: mean - sd,   label: 'μ−σ' },
    { v: mean,        label: 'μ' },
    { v: mean + sd,   label: 'μ+σ' },
    { v: mean + 2*sd, label: 'μ+2σ' },
    { v: mean + 3*sd, label: 'μ+3σ' },
  ];

  return (
    <div style={{ marginTop: '12px' }}>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', maxWidth: 520, display: 'block' }}>
        {/* Shaded bands */}
        {bands.map((b, i) => (
          <path key={i} d={shadePath(b.lo, b.hi)} fill={b.fill} />
        ))}
        {/* Curve fill */}
        <path d={pathD} fill="rgba(13,148,136,0.06)" />
        {/* Curve line */}
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {/* Mean line */}
        <line x1={toX(mean)} y1={toY(yMax) - 4} x2={toX(mean)} y2={H} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4,3" />
        {/* Tick labels */}
        {ticks.map(t => (
          <text key={t.label} x={toX(t.v)} y={H + 15}
            textAnchor="middle" fontSize="8" fill="var(--text-3)" fontFamily="monospace">
            {t.label}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(13,148,136,0.35)', borderRadius: 2, marginRight: 4 }} />±1σ ≈ 68.3%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(13,148,136,0.22)', borderRadius: 2, marginRight: 4 }} />±2σ ≈ 95.4%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(13,148,136,0.12)', borderRadius: 2, marginRight: 4 }} />±3σ ≈ 99.7%</span>
      </div>
    </div>
  );
}

// ── Sample datasets ───────────────────────────────────────────

const SAMPLES = [
  { label: 'Textbook',   data: '2, 4, 4, 4, 5, 5, 7, 9' },
  { label: 'Test scores',data: '72, 85, 91, 68, 79, 88, 95, 74, 82, 77' },
  { label: 'Small set',  data: '10, 20, 30, 40, 50' },
  { label: 'All equal',  data: '7, 7, 7, 7, 7' },
];

// ── Main component ────────────────────────────────────────────

export default function StandardDeviationCalculator() {
  const [input, setInput]       = useState('');
  const [type, setType]         = useState('population'); // 'population' | 'sample'
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [showTable, setShowTable] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showCurve, setShowCurve] = useState(true);
  const [toast, setToast]       = useState('');

  function runCalc(raw, t) {
    const target = (raw ?? input).trim();
    const mode   = t ?? type;
    if (!target) { setError('Enter at least one number.'); setResult(null); return; }
    try {
      const nums = parseNumbers(target);
      if (nums.length < 1) { setError('Enter at least one number.'); setResult(null); return; }
      if (mode === 'sample' && nums.length < 2) {
        setError('Sample standard deviation requires at least 2 values.');
        setResult(null); return;
      }
      setResult(computeStats(nums));
      setError('');
    } catch (e) {
      setError(e.message);
      setResult(null);
    }
  }

  function loadSample(data) {
    setInput(data);
    setError('');
    setResult(null);
    runCalc(data, type);
  }

  function handleTypeChange(t) {
    setType(t);
    if (result) runCalc(input, t);
  }

  function copyResults() {
    if (!result) return;
    const sd = type === 'population' ? result.popSD : result.sampSD;
    const v  = type === 'population' ? result.popVar : result.sampVar;
    const lines = [
      `Type: ${type}`,
      `Count (N): ${result.n}`,
      `Mean: ${fmt(result.mean)}`,
      `Standard Deviation: ${fmt(sd)}`,
      `Variance: ${fmt(v)}`,
      `Min: ${fmt(result.min)}`,
      `Max: ${fmt(result.max)}`,
      `Range: ${fmt(result.range)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const sd  = result ? (type === 'population' ? result.popSD  : result.sampSD)  : null;
  const v   = result ? (type === 'population' ? result.popVar : result.sampVar) : null;

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Standard Deviation Calculator</span>
          </div>
          <h1>Standard Deviation Calculator</h1>
          <p className="subtitle">
            Calculate population or sample standard deviation with a full deviation table, step-by-step working, and a normal distribution curve.
          </p>
        </div>

        {/* ── Tool ── */}
        <div className="tool-box">

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['population', 'sample'].map(t => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: type === t ? 'var(--accent-light)' : 'var(--surface2)',
                  color: type === t ? 'var(--accent-hover)' : 'var(--text)',
                  fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                  {t === 'population' ? 'Population (σ)' : 'Sample (s)'}
                </div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: type === t ? 'var(--accent-hover)' : 'var(--text-3)', marginTop: '2px' }}>
                  {t === 'population' ? 'divide by N' : 'divide by N−1'}
                </div>
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="form-group">
            <label>Enter your numbers</label>
            <textarea
              rows={4}
              value={input}
              onChange={e => { setInput(e.target.value); setResult(null); setError(''); }}
              placeholder={`Separate with commas, spaces or new lines\ne.g.  2, 4, 4, 4, 5, 5, 7, 9`}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '5px' }}>
              Accepts commas, spaces, semicolons, tabs or line breaks.
            </p>
          </div>

          {/* Sample presets */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Try a sample dataset
            </p>
            <div className="tag-row">
              {SAMPLES.map(s => (
                <button
                  key={s.label}
                  className={`tag${input === s.data ? ' active' : ''}`}
                  onClick={() => loadSample(s.data)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => runCalc()}>Calculate</button>
            <button className="btn btn-ghost" onClick={() => { setInput(''); setResult(null); setError(''); }}>Clear</button>
            {result && <button className="btn btn-secondary btn-sm" onClick={copyResults}>Copy results</button>}
          </div>

          {error && <ErrBox msg={error} />}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '24px' }}>

              {/* Primary results */}
              <SectionTitle>Result</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard
                  accent
                  label={type === 'population' ? 'Std Dev  σ' : 'Std Dev  s'}
                  value={sd !== null ? fmt(sd) : 'N/A'}
                  sub={type === 'population' ? 'population' : 'sample (n−1)'}
                />
                <StatCard
                  accent
                  label="Variance"
                  value={v !== null ? fmt(v) : 'N/A'}
                  sub={type === 'population' ? 'σ²' : 's²'}
                />
                <StatCard accent label="Mean  x̄" value={fmt(result.mean)} sub={`sum / ${result.n}`} />
                <StatCard accent label="Count  N" value={result.n} />
              </div>

              {/* Also show both */}
              <SectionTitle>Both Versions</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Population SD  σ" value={fmt(result.popSD)}   sub="÷ N" />
                <StatCard label="Pop. Variance  σ²" value={fmt(result.popVar)} sub="÷ N" />
                {result.sampSD !== null ? <>
                  <StatCard label="Sample SD  s"      value={fmt(result.sampSD)}  sub="÷ N−1" />
                  <StatCard label="Sample Variance s²" value={fmt(result.sampVar)} sub="÷ N−1" />
                </> : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', alignSelf: 'center', padding: '0 8px' }}>
                    Need ≥ 2 values for sample SD
                  </div>
                )}
              </div>

              {/* More summary stats */}
              <SectionTitle>Summary Statistics</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Sum"    value={fmt(result.sum)}   />
                <StatCard label="Min"    value={fmt(result.min)}   />
                <StatCard label="Max"    value={fmt(result.max)}   />
                <StatCard label="Range"  value={fmt(result.range)} />
                <StatCard label="CV"     value={isFinite(result.cv) ? (fmt(result.cv * 100)) + '%' : 'N/A'} sub="coeff. of variation" />
                <StatCard label="Σx²"   value={fmt(result.sumSq)} sub="sum of squares" />
              </div>

              {/* Normal distribution curve */}
              {showCurve && result.popSD > 0 && (
                <>
                  <SectionTitle>Normal Distribution Curve</SectionTitle>
                  <BellCurve mean={result.mean} sd={type === 'population' ? result.popSD : (result.sampSD ?? result.popSD)} />
                </>
              )}

              {/* Toggle buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
                  {showTable ? 'Hide' : 'Show'} deviation table
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSteps(v => !v)}>
                  {showSteps ? 'Hide' : 'Show'} step-by-step
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCurve(v => !v)}>
                  {showCurve ? 'Hide' : 'Show'} bell curve
                </button>
              </div>

              {/* Deviation table */}
              {showTable && (
                <>
                  <SectionTitle>Deviation Table</SectionTitle>
                  <DeviationsTable deviations={result.deviations} mean={result.mean} type={type} />
                </>
              )}

              {/* Step-by-step */}
              {showSteps && (
                <>
                  <SectionTitle>Step-by-step Working</SectionTitle>
                  <Steps stats={result} type={type} />
                </>
              )}
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Standard Deviation Calculator</h2>
          <p>
            Enter your numbers — separated by commas, spaces, or new lines — select whether you're working with a population or a sample, and press Calculate. You'll instantly get the standard deviation, variance, mean, and a full set of summary statistics, along with a step-by-step breakdown and a deviation table showing how each value contributes to the result.
          </p>
          <p>
            <strong>Population standard deviation (σ)</strong> is used when your dataset represents the entire population. It divides the sum of squared deviations by N. <strong>Sample standard deviation (s)</strong> is used when your data is a sample drawn from a larger population — it divides by N−1 (Bessel's correction) to give an unbiased estimate. If you're not sure which to use: choose sample for survey data, test scores, or any subset; choose population only when you have data on every member of a group.
          </p>
          <p>
            The <strong>deviation table</strong> shows every value, its deviation from the mean (xᵢ − x̄), and the squared deviation — making it easy to follow the calculation by hand or check your working. The <strong>normal distribution curve</strong> plots a bell curve using your calculated mean and standard deviation, with the ±1σ (68.3%), ±2σ (95.4%), and ±3σ (99.7%) bands shaded — a visual reminder of the empirical rule.
          </p>
          <p>
            The <strong>coefficient of variation (CV)</strong> expresses the standard deviation as a percentage of the mean, useful for comparing variability across datasets with different units or scales.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Worked Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {[
              { label: '[2,4,4,4,5,5,7,9]',      sd: 'σ = 2',       note: 'classic textbook example' },
              { label: '[1,2,3,4,5]',             sd: 'σ ≈ 1.414',   note: 'population SD = √2' },
              { label: '[7,7,7,7,7]',             sd: 'σ = 0',       note: 'no variation' },
              { label: '[10,20,30,40,50,60]',     sd: 'σ ≈ 17.08',   note: 'evenly spaced' },
              { label: '[72,85,91,68,79,88,95]',  sd: 's ≈ 9.97',    note: 'sample of test scores' },
              { label: '[100,200,300]',            sd: 'σ ≈ 81.65',   note: 'CV = 40.8%' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: '4px' }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.sd}</div>
                <div className="stat-label">{ex.note}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="standard-deviation-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
