import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Math helpers ──────────────────────────────────────────────

function fmt(n, dp = 6) {
  if (!isFinite(n)) return 'undefined';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return parseFloat(n.toFixed(dp)).toString();
}

function parseNumbers(raw) {
  // Accept comma, space, newline, semicolon, tab delimiters
  const tokens = raw
    .split(/[\s,;\t\n]+/)
    .map(t => t.trim())
    .filter(Boolean);
  const nums = tokens.map(t => parseFloat(t));
  const invalid = nums.findIndex(n => isNaN(n));
  if (invalid !== -1) throw new Error(`"${tokens[invalid]}" is not a valid number.`);
  return nums;
}

function gcd(a, b) {
  a = Math.abs(Math.round(a * 1e9));
  b = Math.abs(Math.round(b * 1e9));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function fmtFrac(p, q) {
  if (q === 0) return 'undefined';
  const g = gcd(p, q);
  return `${Math.round(p * 1e9 / g) / 1e9}/${Math.round(q * 1e9 / g) / 1e9}`;
}

// ── Core statistics ───────────────────────────────────────────

function calcMean(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calcMedian(sorted) {
  const n = sorted.length;
  if (n % 2 === 1) return { value: sorted[Math.floor(n / 2)], type: 'middle' };
  const lo = sorted[n / 2 - 1];
  const hi = sorted[n / 2];
  return { value: (lo + hi) / 2, lo, hi, type: 'average' };
}

function calcMode(nums) {
  const freq = {};
  for (const n of nums) freq[n] = (freq[n] || 0) + 1;
  const maxFreq = Math.max(...Object.values(freq));
  if (maxFreq === 1) return { values: [], freq: 1, type: 'none' };
  const modes = Object.entries(freq)
    .filter(([, f]) => f === maxFreq)
    .map(([v]) => parseFloat(v))
    .sort((a, b) => a - b);
  return { values: modes, freq: maxFreq, type: modes.length === 1 ? 'uni' : 'multi' };
}

function calcRange(sorted) {
  return sorted[sorted.length - 1] - sorted[0];
}

function calcVariance(nums, mean, population = false) {
  const n = population ? nums.length : nums.length - 1;
  if (n <= 0) return 0;
  return nums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
}

function calcQ1Q3(sorted) {
  const n = sorted.length;
  const lower = sorted.slice(0, Math.floor(n / 2));
  const upper = n % 2 === 0 ? sorted.slice(n / 2) : sorted.slice(Math.ceil(n / 2));
  const q1 = calcMedian(lower).value;
  const q3 = calcMedian(upper).value;
  return { q1, q3, iqr: q3 - q1 };
}

function computeAll(nums) {
  if (nums.length === 0) throw new Error('No numbers to calculate.');
  const sorted = [...nums].sort((a, b) => a - b);
  const mean = calcMean(nums);
  const median = calcMedian(sorted);
  const mode = calcMode(nums);
  const range = calcRange(sorted);
  const variance = calcVariance(nums, mean, false);
  const popVariance = calcVariance(nums, mean, true);
  const stdDev = Math.sqrt(variance);
  const popStdDev = Math.sqrt(popVariance);
  const { q1, q3, iqr } = nums.length >= 4 ? calcQ1Q3(sorted) : { q1: null, q3: null, iqr: null };
  const sum = nums.reduce((a, b) => a + b, 0);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Frequency map
  const freq = {};
  for (const n of nums) freq[n] = (freq[n] || 0) + 1;

  return {
    nums, sorted, mean, median, mode, range,
    variance, popVariance, stdDev, popStdDev,
    q1, q3, iqr, sum, min, max, freq,
    n: nums.length,
  };
}

// ── UI helpers ────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px 18px',
      textAlign: 'center',
      flex: '1 1 120px',
      minWidth: '110px',
    }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)',
        marginBottom: '5px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(1.1rem, 3vw, 1.7rem)', fontWeight: 700,
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
      marginTop: '24px', marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

// ── Frequency bar chart (pure CSS) ───────────────────────────

function FreqChart({ freq, sorted }) {
  const unique = [...new Set(sorted)];
  const maxF = Math.max(...Object.values(freq));
  if (unique.length > 30) return (
    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '8px' }}>
      Chart hidden — more than 30 unique values.
    </p>
  );
  return (
    <div style={{ marginTop: '12px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', minWidth: unique.length * 40 }}>
        {unique.map(v => {
          const f = freq[v];
          const pct = (f / maxF) * 100;
          return (
            <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 32px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-hover)', fontWeight: 700, marginBottom: '2px' }}>
                {f}
              </span>
              <div style={{
                width: '100%', height: `${Math.max(pct * 1.2, 4)}px`,
                background: f === maxF ? 'var(--accent)' : 'var(--border-strong)',
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.3s',
              }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-2)', marginTop: '3px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                {fmt(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sorted list with highlights ───────────────────────────────

function SortedList({ sorted, median, mode }) {
  const modeSet = new Set(mode.values.map(String));
  const n = sorted.length;
  const midLo = n % 2 === 1 ? Math.floor(n / 2) : n / 2 - 1;
  const midHi = n % 2 === 1 ? Math.floor(n / 2) : n / 2;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
      {sorted.map((v, i) => {
        const isMedian = i === midLo || i === midHi;
        const isMode = modeSet.has(String(v));
        return (
          <span key={i} style={{
            fontFamily: 'var(--mono)', fontSize: '0.82rem',
            padding: '4px 10px', borderRadius: '99px',
            background: isMedian
              ? 'var(--accent-light)'
              : isMode
              ? '#fef9c3'
              : 'var(--surface2)',
            border: `1px solid ${isMedian ? 'var(--accent)' : isMode ? '#fbbf24' : 'var(--border)'}`,
            color: isMedian ? 'var(--accent-hover)' : isMode ? '#92400e' : 'var(--text)',
            fontWeight: isMedian || isMode ? 700 : 400,
          }}>
            {fmt(v)}
          </span>
        );
      })}
      <div style={{ width: '100%', display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', marginRight: 4 }} />Median value(s)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', marginRight: 4 }} />Mode value(s)</span>
      </div>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────

function StepList({ steps }) {
  if (!steps?.length) return null;
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.86rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{s.expr}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

const SAMPLE_DATASETS = [
  { label: 'Basic set',    data: '4, 8, 6, 5, 3, 2, 8, 9, 2, 5' },
  { label: 'Even count',   data: '12, 15, 11, 18, 13, 17, 14, 16' },
  { label: 'With mode',    data: '3, 7, 5, 13, 20, 23, 39, 23, 40, 23, 14, 12, 56, 23' },
  { label: 'Multimodal',   data: '1, 2, 2, 3, 3, 4' },
  { label: 'All same',     data: '5, 5, 5, 5, 5' },
];

export default function MeanMedianModeCalculator() {
  const [input, setInput]       = useState('');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [showSteps, setShowSteps] = useState(true);
  const [toast, setToast]       = useState('');

  function runCalc(raw) {
    const target = (raw ?? input).trim();
    if (!target) { setError('Enter at least one number.'); setResult(null); return; }
    try {
      const nums = parseNumbers(target);
      if (nums.length === 0) { setError('No valid numbers found.'); setResult(null); return; }
      setResult(computeAll(nums));
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
    runCalc(data);
  }

  function copyResults() {
    if (!result) return;
    const text = [
      `Count: ${result.n}`,
      `Sum: ${fmt(result.sum)}`,
      `Mean: ${fmt(result.mean)}`,
      `Median: ${fmt(result.median.value)}`,
      `Mode: ${result.mode.type === 'none' ? 'none' : result.mode.values.map(fmt).join(', ')}`,
      `Range: ${fmt(result.range)}`,
      `Std Dev (sample): ${fmt(result.stdDev)}`,
      `Std Dev (population): ${fmt(result.popStdDev)}`,
      `Min: ${fmt(result.min)}`,
      `Max: ${fmt(result.max)}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copied!');
      setTimeout(() => setToast(''), 2000);
    });
  }

  // Build steps for mean, median, mode
  const steps = result ? (() => {
    const r = result;
    const meanSteps = [
      { label: 'List all values', expr: r.nums.map(fmt).join(', ') },
      { label: 'Add all values', expr: `${r.nums.map(fmt).join(' + ')} = ${fmt(r.sum)}` },
      { label: `Divide by count (${r.n})`, expr: `${fmt(r.sum)} ÷ ${r.n} = ${fmt(r.mean)}` },
    ];
    const medianSteps = [
      { label: 'Sort in ascending order', expr: r.sorted.map(fmt).join(', ') },
      r.median.type === 'middle'
        ? { label: `Pick the middle value (position ${Math.ceil(r.n / 2)} of ${r.n})`, expr: `Median = ${fmt(r.median.value)}` }
        : {
            label: `Even count (${r.n}) — average the two middle values`,
            expr: `(${fmt(r.median.lo)} + ${fmt(r.median.hi)}) ÷ 2 = ${fmt(r.median.value)}`,
          },
    ];
    const freq = r.freq;
    const modeSteps = [
      { label: 'Count frequency of each value', expr: Object.entries(freq).sort((a,b)=>parseFloat(a[0])-parseFloat(b[0])).map(([v,f]) => `${v} → ${f}×`).join('   ') },
      r.mode.type === 'none'
        ? { label: 'All values appear once', expr: 'No mode — every value has frequency 1.' }
        : { label: `Highest frequency: ${r.mode.freq}×`, expr: `Mode = ${r.mode.values.map(fmt).join(', ')}` },
    ];
    return { mean: meanSteps, median: medianSteps, mode: modeSteps };
  })() : null;

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Mean Median Mode Calculator</span>
          </div>
          <h1>Mean, Median &amp; Mode Calculator</h1>
          <p className="subtitle">
            Paste any list of numbers and instantly get mean, median, mode, range, standard deviation, quartiles and more — with full step-by-step working.
          </p>
        </div>

        {/* ── Tool Box ── */}
        <div className="tool-box">

          <div className="form-group">
            <label>Enter your numbers</label>
            <textarea
              rows={4}
              value={input}
              onChange={e => { setInput(e.target.value); setResult(null); setError(''); }}
              placeholder="Separate with commas, spaces or new lines&#10;e.g.  4, 8, 6, 5, 3, 2, 8, 9, 2, 5"
              style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '5px' }}>
              Accepts commas, spaces, semicolons, tabs or line breaks as separators.
            </p>
          </div>

          {/* Sample datasets */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Try a sample dataset
            </p>
            <div className="tag-row">
              {SAMPLE_DATASETS.map(s => (
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
            {result && (
              <button className="btn btn-secondary btn-sm" onClick={copyResults}>Copy results</button>
            )}
            {result && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowSteps(v => !v)}
              >
                {showSteps ? 'Hide' : 'Show'} steps
              </button>
            )}
          </div>

          {error && (
            <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {error}</div>
          )}

          {/* ── Results ── */}
          {result && !error && (
            <div style={{ marginTop: '24px' }}>

              {/* Primary stats — mean, median, mode */}
              <SectionTitle>Central Tendency</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard accent label="Mean" value={fmt(result.mean)} sub="arithmetic average" />
                <StatCard accent label="Median" value={fmt(result.median.value)} sub={result.median.type === 'average' ? `avg of ${fmt(result.median.lo)} & ${fmt(result.median.hi)}` : `middle value`} />
                <StatCard accent
                  label="Mode"
                  value={result.mode.type === 'none' ? 'None' : result.mode.values.map(fmt).join(', ')}
                  sub={
                    result.mode.type === 'none' ? 'no repeats'
                    : result.mode.type === 'multi' ? `multimodal (${result.mode.freq}× each)`
                    : `appears ${result.mode.freq}×`
                  }
                />
              </div>

              {/* Spread stats */}
              <SectionTitle>Spread &amp; Distribution</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Range"    value={fmt(result.range)}   sub={`${fmt(result.min)} to ${fmt(result.max)}`} />
                <StatCard label="Std Dev"  value={fmt(result.stdDev)}  sub="sample (n−1)" />
                <StatCard label="Std Dev"  value={fmt(result.popStdDev)} sub="population (n)" />
                <StatCard label="Variance" value={fmt(result.variance)} sub="sample" />
              </div>

              {/* Summary stats */}
              <SectionTitle>Summary</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Count (n)" value={result.n}             />
                <StatCard label="Sum"       value={fmt(result.sum)}      />
                <StatCard label="Min"       value={fmt(result.min)}      />
                <StatCard label="Max"       value={fmt(result.max)}      />
                {result.q1 !== null && <>
                  <StatCard label="Q1"    value={fmt(result.q1)} sub="lower quartile" />
                  <StatCard label="Q3"    value={fmt(result.q3)} sub="upper quartile" />
                  <StatCard label="IQR"   value={fmt(result.iqr)} sub="interquartile range" />
                </>}
              </div>

              {/* Sorted list with colour highlights */}
              <SectionTitle>Sorted Data</SectionTitle>
              <SortedList sorted={result.sorted} median={result.median} mode={result.mode} />

              {/* Frequency chart */}
              <SectionTitle>Frequency Chart</SectionTitle>
              <FreqChart freq={result.freq} sorted={result.sorted} />

              {/* Steps */}
              {showSteps && steps && (
                <>
                  <SectionTitle>How the Mean was calculated</SectionTitle>
                  <StepList steps={steps.mean} />
                  <SectionTitle>How the Median was calculated</SectionTitle>
                  <StepList steps={steps.median} />
                  <SectionTitle>How the Mode was calculated</SectionTitle>
                  <StepList steps={steps.mode} />
                </>
              )}
            </div>
          )}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Mean, Median and Mode Calculator</h2>
          <p>
            Type or paste your list of numbers into the box — separated by commas, spaces, or new lines — and press Calculate. You'll instantly get every key measure of central tendency and spread, with colour-coded sorted data, a frequency chart, and a step-by-step breakdown of how each result was calculated.
          </p>
          <p>
            <strong>Mean</strong> (arithmetic average) adds all values and divides by the count. It's the most widely used measure but can be skewed by outliers. <strong>Median</strong> is the middle value when data is sorted — or the average of the two middle values for even-sized datasets. It's more robust to extreme values. <strong>Mode</strong> is the most frequently occurring value; a dataset can have no mode (all values unique), one mode (unimodal), or several modes (multimodal).
          </p>
          <p>
            Beyond the three averages, the calculator also provides: <strong>range</strong> (max − min), <strong>standard deviation</strong> for both sample and population, <strong>variance</strong>, <strong>sum</strong>, <strong>min/max</strong>, and the <strong>quartiles (Q1, Q3) and IQR</strong> for datasets with four or more values.
          </p>
          <p>
            The colour-coded sorted list highlights median positions in teal and mode values in yellow, making it easy to spot the distribution at a glance. The frequency chart shows the count of each value as a bar chart with the mode bar highlighted.
          </p>
          <p>
            Ideal for students, teachers, data analysts, researchers, or anyone working with a dataset who needs fast, reliable descriptive statistics with visible working.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Example Datasets</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Dataset', 'Mean', 'Median', 'Mode', 'Range'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 14px',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { data: '2, 4, 4, 4, 5, 5, 7, 9',         mean: '5',    median: '4.5', mode: '4',      range: '7' },
                  { data: '1, 2, 3, 4, 5',                   mean: '3',    median: '3',   mode: 'None',   range: '4' },
                  { data: '10, 20, 30, 40, 50, 60',          mean: '35',   median: '35',  mode: 'None',   range: '50' },
                  { data: '3, 7, 5, 13, 20, 23, 39, 23, 14', mean: '16.3', median: '14',  mode: '23',     range: '36' },
                ].map(({ data, mean, median, mode, range }) => (
                  <ExRow key={data} data={data} mean={mean} median={median} mode={mode} range={range} onLoad={loadSample} />
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '8px', padding: '0 4px' }}>
              ↑ Click any row to load it into the calculator
            </p>
          </div>
        </div>

        <RelatedTools currentId="mean-median-mode-calculator" />
      </div>

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// Extracted row component — avoids duplicate style prop
function ExRow({ data, mean, median, mode, range, onLoad }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={() => onLoad(data)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: hovered ? 'var(--surface2)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-2)' }}>{data}</td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{mean}</td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{median}</td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent-hover)' }}>{mode}</td>
      <td style={{ padding: '9px 14px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{range}</td>
    </tr>
  );
}
