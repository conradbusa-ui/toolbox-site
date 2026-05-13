import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function Row({ label, inputs, result, onCalc, onReset }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '18px 20px',
      marginBottom: '12px',
    }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', marginBottom: '12px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {inputs.map((inp, i) => (
          <input
            key={i}
            type="number"
            placeholder={inp.placeholder}
            value={inp.value}
            onChange={e => inp.onChange(e.target.value)}
            style={{ width: '110px', flex: 'none' }}
            onKeyDown={e => e.key === 'Enter' && onCalc()}
          />
        ))}
        <button className="btn btn-primary btn-sm" onClick={onCalc}>Calculate</button>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>Reset</button>
        {result !== null && (
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
            marginLeft: '4px',
          }}>
            = {result}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PercentageCalculator() {
  // 1. What is X% of Y?
  const [p1x, setP1x] = useState('');
  const [p1y, setP1y] = useState('');
  const [r1, setR1] = useState(null);

  // 2. X is what % of Y?
  const [p2x, setP2x] = useState('');
  const [p2y, setP2y] = useState('');
  const [r2, setR2] = useState(null);

  // 3. % change from X to Y
  const [p3x, setP3x] = useState('');
  const [p3y, setP3y] = useState('');
  const [r3, setR3] = useState(null);

  // 4. X + Y%
  const [p4x, setP4x] = useState('');
  const [p4y, setP4y] = useState('');
  const [r4, setR4] = useState(null);

  // 5. X - Y%
  const [p5x, setP5x] = useState('');
  const [p5y, setP5y] = useState('');
  const [r5, setR5] = useState(null);

  const fmt = (n) => {
    if (isNaN(n) || !isFinite(n)) return '?';
    return parseFloat(n.toFixed(4)).toLocaleString();
  };

  const calc1 = () => {
    const x = parseFloat(p1x), y = parseFloat(p1y);
    setR1((!isNaN(x) && !isNaN(y)) ? fmt((x / 100) * y) : '?');
  };
  const calc2 = () => {
    const x = parseFloat(p2x), y = parseFloat(p2y);
    setR2((!isNaN(x) && !isNaN(y) && y !== 0) ? fmt((x / y) * 100) + '%' : '?');
  };
  const calc3 = () => {
    const x = parseFloat(p3x), y = parseFloat(p3y);
    setR3((!isNaN(x) && !isNaN(y) && x !== 0) ? fmt(((y - x) / Math.abs(x)) * 100) + '%' : '?');
  };
  const calc4 = () => {
    const x = parseFloat(p4x), y = parseFloat(p4y);
    setR4((!isNaN(x) && !isNaN(y)) ? fmt(x + (x * y / 100)) : '?');
  };
  const calc5 = () => {
    const x = parseFloat(p5x), y = parseFloat(p5y);
    setR5((!isNaN(x) && !isNaN(y)) ? fmt(x - (x * y / 100)) : '?');
  };

  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Percentage Calculator</span>
          </div>
          <h1>Percentage Calculator</h1>
          <p className="subtitle">Five common percentage calculations — type your numbers and hit Calculate.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Calculate Percentages</h2>

          <Row
            label="What is __% of __?"
            inputs={[
              { placeholder: '%', value: p1x, onChange: setP1x },
              { placeholder: 'Number', value: p1y, onChange: setP1y },
            ]}
            result={r1}
            onCalc={calc1}
            onReset={() => { setP1x(''); setP1y(''); setR1(null); }}
          />

          <Row
            label="__ is what % of __?"
            inputs={[
              { placeholder: 'Value', value: p2x, onChange: setP2x },
              { placeholder: 'Total', value: p2y, onChange: setP2y },
            ]}
            result={r2}
            onCalc={calc2}
            onReset={() => { setP2x(''); setP2y(''); setR2(null); }}
          />

          <Row
            label="% change from __ to __"
            inputs={[
              { placeholder: 'From', value: p3x, onChange: setP3x },
              { placeholder: 'To', value: p3y, onChange: setP3y },
            ]}
            result={r3}
            onCalc={calc3}
            onReset={() => { setP3x(''); setP3y(''); setR3(null); }}
          />

          <Row
            label="__ increased by __%"
            inputs={[
              { placeholder: 'Number', value: p4x, onChange: setP4x },
              { placeholder: '%', value: p4y, onChange: setP4y },
            ]}
            result={r4}
            onCalc={calc4}
            onReset={() => { setP4x(''); setP4y(''); setR4(null); }}
          />

          <Row
            label="__ decreased by __%"
            inputs={[
              { placeholder: 'Number', value: p5x, onChange: setP5x },
              { placeholder: '%', value: p5y, onChange: setP5y },
            ]}
            result={r5}
            onCalc={calc5}
            onReset={() => { setP5x(''); setP5y(''); setR5(null); }}
          />
        </div>

        <div className="seo-content">
          <h2>How to Use This Percentage Calculator</h2>
          <p>
            This calculator covers the five percentage problems that come up most often in everyday life. Use
            "What is X% of Y?" to find a tip, discount, or tax amount. Use "X is what % of Y?" to figure out
            a score or how one number relates to another. The percentage change calculation is useful for
            comparing prices, stats, or any two values over time.
          </p>
          <p>
            The increase and decrease calculators let you apply a percentage directly to a number — handy for
            working out a sale price, a raise, or a budget cut. Type your numbers into any row, press Calculate,
            and the answer appears instantly. All calculations run in your browser with no data sent anywhere.
          </p>
        </div>

        <RelatedTools currentId="percentage-calculator" />
      </div>
    </div>
  );
}
