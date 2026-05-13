import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

// ── Conversion definitions ────────────────────────────────────
const CATEGORIES = {
  Length: {
    icon: '↔',
    color: '#0d9488',
    base: 'meter',
    units: {
      kilometer:   { label: 'Kilometer (km)',     factor: 1000 },
      meter:       { label: 'Meter (m)',           factor: 1 },
      centimeter:  { label: 'Centimeter (cm)',     factor: 0.01 },
      millimeter:  { label: 'Millimeter (mm)',     factor: 0.001 },
      mile:        { label: 'Mile (mi)',            factor: 1609.344 },
      yard:        { label: 'Yard (yd)',            factor: 0.9144 },
      foot:        { label: 'Foot (ft)',            factor: 0.3048 },
      inch:        { label: 'Inch (in)',            factor: 0.0254 },
      nauticalMile:{ label: 'Nautical Mile (nmi)', factor: 1852 },
    },
  },
  Weight: {
    icon: '⚖',
    color: '#7c3aed',
    base: 'kilogram',
    units: {
      tonne:      { label: 'Tonne (t)',          factor: 1000 },
      kilogram:   { label: 'Kilogram (kg)',       factor: 1 },
      gram:       { label: 'Gram (g)',            factor: 0.001 },
      milligram:  { label: 'Milligram (mg)',      factor: 0.000001 },
      pound:      { label: 'Pound (lb)',          factor: 0.453592 },
      ounce:      { label: 'Ounce (oz)',          factor: 0.0283495 },
      stone:      { label: 'Stone (st)',          factor: 6.35029 },
    },
  },
  Temperature: {
    icon: '🌡',
    color: '#dc2626',
    base: 'celsius',
    units: {
      celsius:    { label: 'Celsius (°C)'    },
      fahrenheit: { label: 'Fahrenheit (°F)' },
      kelvin:     { label: 'Kelvin (K)'      },
    },
  },
  Volume: {
    icon: '⬡',
    color: '#0891b2',
    base: 'liter',
    units: {
      cubicMeter:   { label: 'Cubic Meter (m³)',    factor: 1000 },
      liter:        { label: 'Liter (L)',            factor: 1 },
      milliliter:   { label: 'Milliliter (mL)',      factor: 0.001 },
      gallon_us:    { label: 'Gallon (US)',          factor: 3.78541 },
      gallon_uk:    { label: 'Gallon (UK)',          factor: 4.54609 },
      quart:        { label: 'Quart (qt)',           factor: 0.946353 },
      pint:         { label: 'Pint (pt)',            factor: 0.473176 },
      cup:          { label: 'Cup (US)',             factor: 0.24 },
      fluidOunce:   { label: 'Fluid Ounce (fl oz)', factor: 0.0295735 },
      tablespoon:   { label: 'Tablespoon (tbsp)',    factor: 0.0147868 },
      teaspoon:     { label: 'Teaspoon (tsp)',       factor: 0.00492892 },
    },
  },
  Speed: {
    icon: '▶',
    color: '#f59e0b',
    base: 'mps',
    units: {
      mps:   { label: 'Meters/sec (m/s)',    factor: 1 },
      kph:   { label: 'Kilometers/hr (km/h)',factor: 0.277778 },
      mph:   { label: 'Miles/hr (mph)',       factor: 0.44704 },
      knot:  { label: 'Knot (kn)',            factor: 0.514444 },
      fps:   { label: 'Feet/sec (ft/s)',      factor: 0.3048 },
    },
  },
  Area: {
    icon: '▣',
    color: '#db2777',
    base: 'sqmeter',
    units: {
      sqkilometer: { label: 'Sq Kilometer (km²)',  factor: 1000000 },
      sqmeter:     { label: 'Sq Meter (m²)',        factor: 1 },
      sqcentimeter:{ label: 'Sq Centimeter (cm²)', factor: 0.0001 },
      hectare:     { label: 'Hectare (ha)',         factor: 10000 },
      acre:        { label: 'Acre',                 factor: 4046.86 },
      sqmile:      { label: 'Sq Mile (mi²)',        factor: 2589988 },
      sqyard:      { label: 'Sq Yard (yd²)',        factor: 0.836127 },
      sqfoot:      { label: 'Sq Foot (ft²)',        factor: 0.0929 },
      sqinch:      { label: 'Sq Inch (in²)',        factor: 0.000645 },
    },
  },
  'Data Storage': {
    icon: '◈',
    color: '#16a34a',
    base: 'byte',
    units: {
      bit:       { label: 'Bit (b)',          factor: 0.125 },
      byte:      { label: 'Byte (B)',          factor: 1 },
      kilobyte:  { label: 'Kilobyte (KB)',     factor: 1024 },
      megabyte:  { label: 'Megabyte (MB)',     factor: 1048576 },
      gigabyte:  { label: 'Gigabyte (GB)',     factor: 1073741824 },
      terabyte:  { label: 'Terabyte (TB)',     factor: 1099511627776 },
      petabyte:  { label: 'Petabyte (PB)',     factor: 1125899906842624 },
    },
  },
};

// ── Temperature helpers ───────────────────────────────────────
function toBaseTemp(value, from) {
  if (from === 'celsius')    return value;
  if (from === 'fahrenheit') return (value - 32) * 5 / 9;
  if (from === 'kelvin')     return value - 273.15;
}

function fromBaseTemp(value, to) {
  if (to === 'celsius')    return value;
  if (to === 'fahrenheit') return value * 9 / 5 + 32;
  if (to === 'kelvin')     return value + 273.15;
}

function convert(value, from, to, category) {
  const cat = CATEGORIES[category];
  if (category === 'Temperature') {
    const base = toBaseTemp(value, from);
    return fromBaseTemp(base, to);
  }
  const inBase = value * cat.units[from].factor;
  return inBase / cat.units[to].factor;
}

function fmtResult(n) {
  if (n === null || isNaN(n)) return '';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 0.001 && abs < 1e12) {
    // Use up to 8 significant figures
    const str = parseFloat(n.toPrecision(8)).toString();
    return str;
  }
  return n.toExponential(6);
}

// ── Main component ────────────────────────────────────────────
export default function UnitConverter() {
  const categoryNames = Object.keys(CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('Length');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit]     = useState('kilometer');
  const [inputVal, setInputVal] = useState('');
  const [result, setResult]     = useState(null);
  const [toast, setToast]       = useState('');

  const cat      = CATEGORIES[activeCategory];
  const unitKeys = Object.keys(cat.units);

  const switchCategory = (name) => {
    setActiveCategory(name);
    const keys = Object.keys(CATEGORIES[name].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
    setInputVal('');
    setResult(null);
  };

  const handleConvert = (val, from, to) => {
    const v = parseFloat(val);
    if (isNaN(v)) { setResult(null); return; }
    setResult(convert(v, from, to, activeCategory));
  };

  const onInput = (val) => {
    setInputVal(val);
    handleConvert(val, fromUnit, toUnit);
  };

  const onFromUnit = (u) => {
    setFromUnit(u);
    handleConvert(inputVal, u, toUnit);
  };

  const onToUnit = (u) => {
    setToUnit(u);
    handleConvert(inputVal, fromUnit, u);
  };

  const swap = () => {
    const newFrom = toUnit;
    const newTo   = fromUnit;
    const newVal  = result !== null ? fmtResult(result) : '';
    setFromUnit(newFrom);
    setToUnit(newTo);
    setInputVal(newVal);
    if (newVal) handleConvert(newVal, newFrom, newTo);
    else setResult(null);
  };

  const copyResult = () => {
    if (result === null) return;
    navigator.clipboard.writeText(fmtResult(result)).then(() => {
      setToast('Copied!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  return (
    <div className="tool-page">
      <div className="container">

        {/* H1 */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Unit Converter</span>
          </div>
          <h1>Unit Converter</h1>
          <p className="subtitle">
            Convert between length, weight, temperature, volume, speed, area, and data storage units instantly.
          </p>
        </div>

        {/* Tool */}
        <div className="tool-box">
          <h2 className="tool-box-title">Convert Units</h2>

          {/* Category tabs */}
          <div style={{ marginBottom: '20px' }}>
            <label>Category</label>
            <div className="tag-row" style={{ flexWrap: 'wrap' }}>
              {categoryNames.map(name => (
                <button
                  key={name}
                  className={`tag${activeCategory === name ? ' active' : ''}`}
                  onClick={() => switchCategory(name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <span>{CATEGORIES[name].icon}</span> {name}
                </button>
              ))}
            </div>
          </div>

          {/* Converter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end' }}>

            {/* From */}
            <div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label htmlFor="from-unit">From</label>
                <select id="from-unit" value={fromUnit} onChange={e => onFromUnit(e.target.value)}>
                  {unitKeys.map(k => (
                    <option key={k} value={k}>{cat.units[k].label}</option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                placeholder="Enter value"
                value={inputVal}
                onChange={e => onInput(e.target.value)}
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            {/* Swap button */}
            <div style={{ paddingBottom: '2px', textAlign: 'center' }}>
              <button
                className="btn btn-ghost"
                onClick={swap}
                title="Swap units"
                style={{ fontSize: '1.2rem', padding: '10px 14px', lineHeight: 1 }}
              >
                ⇄
              </button>
            </div>

            {/* To */}
            <div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label htmlFor="to-unit">To</label>
                <select id="to-unit" value={toUnit} onChange={e => onToUnit(e.target.value)}>
                  {unitKeys.map(k => (
                    <option key={k} value={k}>{cat.units[k].label}</option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                  color: result !== null ? '#5eead4' : 'var(--text-3)',
                  fontFamily: 'inherit',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: result !== null ? 'pointer' : 'default',
                }}
                onClick={copyResult}
                title={result !== null ? 'Click to copy' : ''}
              >
                <span>{result !== null ? fmtResult(result) : '—'}</span>
                {result !== null && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font)', fontWeight: 400, flexShrink: 0 }}>
                    copy
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Full equation */}
          {result !== null && inputVal && (
            <div style={{
              marginTop: '16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: '0.9rem',
              color: 'var(--text-2)',
              textAlign: 'center',
            }}>
              <strong style={{ color: 'var(--text)' }}>{inputVal}</strong>{' '}
              {cat.units[fromUnit]?.label || fromUnit}{' '}
              = <strong style={{ color: 'var(--accent)' }}>{fmtResult(result)}</strong>{' '}
              {cat.units[toUnit]?.label || toUnit}
            </div>
          )}

          {/* Quick reference: show all units converted from input */}
          {result !== null && inputVal && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '8px' }}>
                All {activeCategory} Conversions for {inputVal} {cat.units[fromUnit]?.label}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {unitKeys.filter(k => k !== fromUnit).map(k => {
                  const val = convert(parseFloat(inputVal), fromUnit, k, activeCategory);
                  return (
                    <div key={k} style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => { setToUnit(k); setResult(val); }}
                    title="Click to select"
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{cat.units[k].label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit', color: 'var(--text)' }}>{fmtResult(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* H2 + SEO */}
        <div className="seo-content">
          <h2>How to Use the Unit Converter</h2>
          <p>
            This unit converter covers seven essential categories: length, weight, temperature, volume, speed,
            area, and data storage. Select a category using the tabs at the top, choose your starting unit
            from the From dropdown, type your value, and the result appears instantly in the To field as you
            type. Hit the swap button (⇄) to reverse the conversion without re-entering your number.
          </p>
          <p>
            Below the main converter, you'll find a quick-reference panel showing your input converted into
            every other unit in the category at once — useful when you need to compare across multiple units
            or don't know which unit you need yet. Click any row to make it the active target unit. Click the
            result field to copy the value to your clipboard.
          </p>
          <p>
            All conversions happen in real time as you type, with no Calculate button needed. The tool uses
            industry-standard conversion factors and handles temperature conversions using the correct formulas
            rather than simple multipliers. Whether you're cooking, travelling, coding, or studying, this
            converter gives you accurate results fast — entirely in your browser with no data sent anywhere.
          </p>
        </div>

        {/* Examples */}
        <div className="seo-content">
          <h2>Common Unit Conversion Examples</h2>
          <p>
            <strong>Length:</strong> 1 mile = 1.609 km. 100 cm = 1 m. 6 feet = 1.829 m.
          </p>
          <p>
            <strong>Weight:</strong> 1 kg = 2.205 lbs. 1 stone = 6.35 kg. 1 tonne = 1,000 kg.
          </p>
          <p>
            <strong>Temperature:</strong> 100°C = 212°F = 373.15 K. 0°C = 32°F. 37°C (body temp) = 98.6°F.
          </p>
          <p>
            <strong>Volume:</strong> 1 US gallon = 3.785 L. 1 cup = 240 mL. 1 tablespoon = 14.79 mL.
          </p>
          <p>
            <strong>Data:</strong> 1 GB = 1,024 MB = 1,073,741,824 bytes. 1 TB = 1,024 GB.
          </p>
        </div>

        <RelatedTools currentId="unit-converter" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
