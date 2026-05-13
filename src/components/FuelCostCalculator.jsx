import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Conversion helpers ────────────────────────────────────────

// All internal calculations in metric: km, litres, L/100km
function mpgToL100km(mpg) { return 235.214 / mpg; }
function l100kmToMpg(l100) { return 235.214 / l100; }
function kmToMiles(km) { return km * 0.621371; }
function milesToKm(miles) { return miles * 1.60934; }
function gallonsToLitres(gal) { return gal * 3.78541; }
function litresToGallons(l) { return l / 3.78541; }
function fmt(n, dp = 2) { return isFinite(n) && !isNaN(n) ? parseFloat(n.toFixed(dp)).toString() : '—'; }
function fmtCurrency(n, symbol = '$') { return isFinite(n) && !isNaN(n) ? `${symbol}${parseFloat(n.toFixed(2)).toLocaleString()}` : '—'; }

// ── Core calculator ───────────────────────────────────────────

function calcTripCost({ distanceKm, l100km, pricePerLitre }) {
  const litresUsed = (distanceKm / 100) * l100km;
  const totalCost  = litresUsed * pricePerLitre;
  const costPerKm  = totalCost / distanceKm;
  return { litresUsed, totalCost, costPerKm };
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

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface2)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px',
      textAlign: 'center', flex: '1 1 130px', minWidth: '120px',
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1, wordBreak: 'break-word' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Unit system config ────────────────────────────────────────

const UNIT_SYSTEMS = {
  metric:   { distLabel: 'Distance (km)',       distPlaceholder: '500',    effLabel: 'Fuel efficiency (L/100km)',  effPlaceholder: '8.5',  fuelLabel: 'Fuel price (per litre)',   fuelPlaceholder: '1.80', distUnit: 'km',    effUnit: 'L/100km',  fuelUnit: '/L',    currencySymbol: '$' },
  imperial: { distLabel: 'Distance (miles)',     distPlaceholder: '300',    effLabel: 'Fuel efficiency (mpg)',       effPlaceholder: '35',   fuelLabel: 'Fuel price (per gallon)',  fuelPlaceholder: '3.50', distUnit: 'miles', effUnit: 'mpg',      fuelUnit: '/gal',  currencySymbol: '$' },
  uk:       { distLabel: 'Distance (miles)',     distPlaceholder: '300',    effLabel: 'Fuel efficiency (mpg)',       effPlaceholder: '45',   fuelLabel: 'Fuel price (per litre)',   fuelPlaceholder: '1.60', distUnit: 'miles', effUnit: 'mpg',      fuelUnit: '/L',    currencySymbol: '£' },
};

function toMetric(distVal, effVal, fuelVal, system) {
  let distKm, l100km, pricePerLitre;

  if (system === 'metric') {
    distKm        = distVal;
    l100km        = effVal;
    pricePerLitre = fuelVal;
  } else if (system === 'imperial') {
    distKm        = milesToKm(distVal);
    l100km        = mpgToL100km(effVal);
    pricePerLitre = fuelVal / 3.78541; // per gallon → per litre
  } else { // uk: miles + mpg + price per litre
    distKm        = milesToKm(distVal);
    l100km        = mpgToL100km(effVal);
    pricePerLitre = fuelVal;
  }

  return { distKm, l100km, pricePerLitre };
}

// ── Mode 1: Trip cost calculator ──────────────────────────────

function TripCostMode() {
  const [system, setSystem]     = useState('metric');
  const [distance, setDistance] = useState('');
  const [efficiency, setEff]    = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');

  const u = UNIT_SYSTEMS[system];

  function calculate() {
    const d = parseFloat(distance);
    const e = parseFloat(efficiency);
    const p = parseFloat(fuelPrice);
    const pax = parseInt(passengers) || 1;

    if (isNaN(d) || d <= 0) { setError('Enter a valid distance.'); setResult(null); return; }
    if (isNaN(e) || e <= 0) { setError('Enter a valid fuel efficiency.'); setResult(null); return; }
    if (isNaN(p) || p <= 0) { setError('Enter a valid fuel price.'); setResult(null); return; }

    const { distKm, l100km, pricePerLitre } = toMetric(d, e, p, system);
    const { litresUsed, totalCost, costPerKm } = calcTripCost({ distanceKm: distKm, l100km, pricePerLitre });

    // Convert back for display
    const displayFuel = system === 'imperial' ? litresToGallons(litresUsed) : litresUsed;
    const displayDist = system === 'metric'   ? distKm : kmToMiles(distKm);
    const costPerUnit = system === 'metric'   ? costPerKm : costPerKm / kmToMiles(1);

    setResult({
      totalCost, costPerUnit, displayFuel, displayDist,
      costPerPax: totalCost / pax, pax,
      litresUsed, distKm, l100km, pricePerLitre,
      system, u,
    });
    setError('');
  }

  function copy() {
    if (!result) return;
    const sym = result.u.currencySymbol;
    const text = [
      `Trip cost: ${fmtCurrency(result.totalCost, sym)}`,
      `Fuel used: ${fmt(result.displayFuel)} ${result.system === 'imperial' ? 'gal' : 'L'}`,
      result.pax > 1 ? `Per person (${result.pax}): ${fmtCurrency(result.costPerPax, sym)}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  const QUICK_TRIPS = [
    { label: 'City commute',  d: system === 'metric' ? '20'  : '12',  note: 'daily commute' },
    { label: 'Weekend drive', d: system === 'metric' ? '150' : '93',  note: 'short trip' },
    { label: 'Road trip',     d: system === 'metric' ? '500' : '310', note: 'longer journey' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate the total fuel cost for any trip. Enter your distance, vehicle fuel efficiency, and current fuel price.
      </p>

      {/* Unit system */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {Object.entries({ metric: 'Metric (km/L)', imperial: 'US (miles/mpg)', uk: 'UK (miles/mpg/litre)' }).map(([key, label]) => (
          <button key={key} onClick={() => { setSystem(key); setResult(null); setError(''); }}
            style={{
              flex: 1, minWidth: '120px', padding: '9px 10px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${system === key ? 'var(--accent)' : 'var(--border)'}`,
              background: system === key ? 'var(--accent-light)' : 'var(--surface2)',
              color: system === key ? 'var(--accent-hover)' : 'var(--text)',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{u.distLabel}</label>
          <input type="number" value={distance} min="0"
            onChange={e => { setDistance(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={u.distPlaceholder} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>{u.effLabel}</label>
          <input type="number" value={efficiency} min="0"
            onChange={e => { setEff(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={u.effPlaceholder} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>{u.fuelLabel}</label>
          <input type="number" value={fuelPrice} min="0" step="0.01"
            onChange={e => { setFuelPrice(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={u.fuelPlaceholder} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>Passengers</label>
          <input type="number" value={passengers} min="1" max="20"
            onChange={e => { setPassengers(e.target.value); setResult(null); }}
            placeholder="1" />
        </div>
      </div>

      {/* Quick trips */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Quick trips</p>
        <div className="tag-row">
          {QUICK_TRIPS.map(q => (
            <button key={q.label} className="tag"
              onClick={() => { setDistance(q.d); setResult(null); setError(''); }}>
              {q.label} ({q.d} {u.distUnit})
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate cost</button>
        <button className="btn btn-ghost" onClick={() => { setDistance(''); setEff(''); setFuelPrice(''); setPassengers('1'); setResult(null); setError(''); }}>Clear</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Main result */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '18px 22px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
              Total fuel cost
            </div>
            <div style={{ fontSize: 'clamp(2rem,7vw,3.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {fmtCurrency(result.totalCost, result.u.currencySymbol)}
            </div>
            {result.pax > 1 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '8px' }}>
                {fmtCurrency(result.costPerPax, result.u.currencySymbol)} per person ({result.pax} passengers)
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard label={`Fuel used (${result.system === 'imperial' ? 'gal' : 'L'})`}
              value={fmt(result.displayFuel)} sub={result.system !== 'imperial' ? `${fmt(litresToGallons(result.litresUsed))} gal` : `${fmt(result.litresUsed)} L`} />
            <StatCard label={`Cost per ${result.u.distUnit}`}
              value={`${result.u.currencySymbol}${fmt(result.costPerUnit, 3)}`} />
            {result.pax > 1 && (
              <StatCard accent label="Per person" value={fmtCurrency(result.costPerPax, result.u.currencySymbol)} sub={`${result.pax} passengers`} />
            )}
            <StatCard label="Distance" value={`${fmt(result.displayDist, 0)} ${result.u.distUnit}`} />
          </div>

          {/* Annual commute projection */}
          {parseFloat(distance) > 0 && parseFloat(distance) <= (system === 'metric' ? 100 : 65) && (
            <>
              <SectionTitle>Annual commute estimate</SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Daily (×2)', days: 2,   mult: 2   },
                  { label: 'Weekly',     days: 10,  mult: 10  },
                  { label: 'Monthly',    days: 22,  mult: 22  },
                  { label: 'Annual',     days: 260, mult: 260 },
                ].map(p => (
                  <StatCard key={p.label} label={p.label}
                    value={fmtCurrency(result.totalCost * p.mult, result.u.currencySymbol)}
                    sub={`${p.days} trips`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Fuel efficiency comparison ───────────────────────

function CompareMode() {
  const [system, setSystem]     = useState('metric');
  const [distance, setDistance] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [vehicles, setVehicles] = useState([
    { name: 'Vehicle A', eff: '' },
    { name: 'Vehicle B', eff: '' },
  ]);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  const u = UNIT_SYSTEMS[system];

  function updateVehicle(i, field, val) {
    setVehicles(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
    setResult(null);
  }

  function addVehicle() {
    setVehicles(prev => [...prev, { name: `Vehicle ${prev.length + 1}`, eff: '' }]);
  }

  function calculate() {
    const d = parseFloat(distance);
    const p = parseFloat(fuelPrice);

    if (isNaN(d) || d <= 0) { setError('Enter a valid distance.'); setResult(null); return; }
    if (isNaN(p) || p <= 0) { setError('Enter a valid fuel price.'); setResult(null); return; }

    const results = vehicles.map(v => {
      const e = parseFloat(v.eff);
      if (isNaN(e) || e <= 0) return null;
      const { distKm, l100km, pricePerLitre } = toMetric(d, e, p, system);
      const { litresUsed, totalCost } = calcTripCost({ distanceKm: distKm, l100km, pricePerLitre });
      return { name: v.name, eff: e, totalCost, litresUsed, l100km };
    });

    if (results.every(r => r === null)) { setError('Enter efficiency for at least one vehicle.'); setResult(null); return; }

    const valid = results.filter(Boolean);
    const cheapest = valid.reduce((a, b) => a.totalCost < b.totalCost ? a : b);
    const mostExpensive = valid.reduce((a, b) => a.totalCost > b.totalCost ? a : b);

    setResult({ results, cheapest, mostExpensive, d, p, system, u });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Compare fuel costs between different vehicles or driving styles for the same trip.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {Object.entries({ metric: 'Metric', imperial: 'US', uk: 'UK' }).map(([key, label]) => (
          <button key={key} onClick={() => { setSystem(key); setResult(null); setError(''); }}
            className={`tag${system === key ? ' active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{u.distLabel}</label>
          <input type="number" value={distance} min="0"
            onChange={e => { setDistance(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={u.distPlaceholder} style={{ fontFamily: 'var(--mono)' }} />
        </div>
        <div className="form-group">
          <label>{u.fuelLabel}</label>
          <input type="number" value={fuelPrice} min="0" step="0.01"
            onChange={e => { setFuelPrice(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder={u.fuelPlaceholder} style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      {/* Vehicle rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {vehicles.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 140px', margin: 0 }}>
              {i === 0 && <label>Vehicle name</label>}
              <input type="text" value={v.name}
                onChange={e => updateVehicle(i, 'name', e.target.value)}
                placeholder={`Vehicle ${i + 1}`}
                style={{ fontSize: '0.88rem' }} />
            </div>
            <div className="form-group" style={{ flex: '1 1 120px', margin: 0 }}>
              {i === 0 && <label>{u.effLabel}</label>}
              <input type="number" value={v.eff} min="0"
                onChange={e => updateVehicle(i, 'eff', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculate()}
                placeholder={u.effPlaceholder}
                style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem' }} />
            </div>
            {vehicles.length > 2 && (
              <button onClick={() => { setVehicles(prev => prev.filter((_, idx) => idx !== i)); setResult(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.85rem', padding: '8px', marginBottom: '2px' }}
                onMouseEnter={e => e.target.style.color = '#dc2626'}
                onMouseLeave={e => e.target.style.color = 'var(--text-3)'}>✕</button>
            )}
          </div>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Compare</button>
        <button className="btn btn-ghost btn-sm" onClick={addVehicle}>+ Add vehicle</button>
        <button className="btn btn-ghost" onClick={() => { setDistance(''); setFuelPrice(''); setVehicles([{ name: 'Vehicle A', eff: '' }, { name: 'Vehicle B', eff: '' }]); setResult(null); setError(''); }}>Reset</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <SectionTitle>Cost comparison</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Vehicle', u.effUnit, 'Fuel used', 'Trip cost', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => {
                  if (!r) return null;
                  const isCheapest = r.name === result.cheapest.name;
                  const saving = r.totalCost - result.cheapest.totalCost;
                  const fuelDisplay = result.system === 'imperial' ? litresToGallons(r.litresUsed) : r.litresUsed;
                  const fuelUnit   = result.system === 'imperial' ? 'gal' : 'L';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: isCheapest ? 'var(--accent-light)' : i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: isCheapest ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {r.name} {isCheapest && '✓'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>{fmt(r.eff)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)' }}>{fmt(fuelDisplay)} {fuelUnit}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: isCheapest ? 'var(--accent-hover)' : 'var(--text)' }}>
                        {fmtCurrency(r.totalCost, result.u.currencySymbol)}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                        {saving > 0.005 ? `+${fmtCurrency(saving, result.u.currencySymbol)}` : isCheapest ? 'cheapest' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result.results.filter(Boolean).length >= 2 && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', border: '1px solid var(--accent)', fontSize: '0.82rem', color: 'var(--accent-hover)', fontWeight: 600 }}>
              💡 {result.cheapest.name} saves {fmtCurrency(result.mostExpensive.totalCost - result.cheapest.totalCost, result.u.currencySymbol)} vs {result.mostExpensive.name} on this trip.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Fuel efficiency converter ────────────────────────

function ConverterMode() {
  const [value, setValue]   = useState('');
  const [fromUnit, setFrom] = useState('l100km');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const UNITS = [
    { id: 'l100km', label: 'L/100km' },
    { id: 'mpg_us', label: 'MPG (US)' },
    { id: 'mpg_uk', label: 'MPG (UK/imperial)' },
    { id: 'km_l',   label: 'km/L' },
  ];

  function convert() {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) { setError('Enter a valid positive number.'); setResult(null); return; }

    let l100km;
    if (fromUnit === 'l100km')  l100km = v;
    if (fromUnit === 'mpg_us')  l100km = 235.214 / v;
    if (fromUnit === 'mpg_uk')  l100km = 282.481 / v; // UK gallon = 4.54609 L
    if (fromUnit === 'km_l')    l100km = 100 / v;

    const mpgUs = 235.214 / l100km;
    const mpgUk = 282.481 / l100km;
    const kmL   = 100 / l100km;

    setResult({ l100km, mpgUs, mpgUk, kmL });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Convert fuel efficiency between L/100km, MPG (US), MPG (UK), and km/L.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {UNITS.map(u => (
          <button key={u.id} className={`tag${fromUnit === u.id ? ' active' : ''}`}
            onClick={() => { setFrom(u.id); setResult(null); setError(''); }}>
            {u.label}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ maxWidth: '250px' }}>
        <label>Value ({UNITS.find(u => u.id === fromUnit)?.label})</label>
        <input type="number" value={value} min="0"
          onChange={e => { setValue(e.target.value); setResult(null); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && convert()}
          placeholder={fromUnit === 'l100km' ? 'e.g. 8.5' : fromUnit.includes('mpg') ? 'e.g. 35' : 'e.g. 11.8'}
          style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }} />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={convert}>Convert</button>
        <button className="btn btn-ghost" onClick={() => { setValue(''); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="L/100km"    value={fmt(result.l100km)}  sub="metric (Europe)" />
            <StatCard accent label="MPG (US)"   value={fmt(result.mpgUs)}   sub="US gallon" />
            <StatCard accent label="MPG (UK)"   value={fmt(result.mpgUk)}   sub="imperial gallon" />
            <StatCard accent label="km/L"       value={fmt(result.kmL)}     sub="Asia / Latin America" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Trip Cost',      desc: 'cost for any journey'   },
  { label: 'Compare Vehicles', desc: 'side-by-side savings' },
  { label: 'MPG Converter',  desc: 'L/100km ↔ MPG ↔ km/L'  },
];

export default function FuelCostCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        {/* Breadcrumb */}
        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Fuel Cost Calculator</span>
          </div>
          <h1>Fuel Cost Calculator</h1>
          <p className="subtitle">
            Calculate the fuel cost of any trip, compare costs between vehicles, and convert between MPG, L/100km, and km/L — in metric, US, or UK units.
          </p>
        </div>

        {/* Tool */}
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
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: mode === i ? 'var(--accent-hover)' : 'var(--text)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--text-3)', marginTop: '3px' }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>

          {mode === 0 && <TripCostMode />}
          {mode === 1 && <CompareMode />}
          {mode === 2 && <ConverterMode />}
        </div>

        {/* SEO Content */}
        <div className="seo-content">
          <h2>How to Use the Fuel Cost Calculator</h2>
          <p>
            Enter your trip distance, your vehicle's fuel efficiency, and the current price of fuel to instantly see the total fuel cost for your journey. The calculator supports metric (km and litres), US customary (miles and gallons with price per gallon), and UK units (miles and MPG with price per litre) — switch between them with a single click.
          </p>
          <p>
            <strong>Trip Cost</strong> calculates the total fuel spend for any journey. Add the number of passengers and it automatically splits the cost per person too. For short distances that look like commutes, it projects your daily, weekly, monthly, and annual fuel spend — useful for budgeting or evaluating whether a job offer is worth the commute.
          </p>
          <p>
            <strong>Compare Vehicles</strong> lets you enter multiple vehicles side by side — enter the name and efficiency rating for each, and the calculator shows exactly how much each one costs for the same trip and highlights the saving from choosing the more efficient option. Great for evaluating whether upgrading to a more fuel-efficient car makes financial sense.
          </p>
          <p>
            <strong>MPG Converter</strong> converts fuel efficiency between the four most common formats: L/100km (used in Europe, Australia, and Canada), MPG US (US gallons), MPG UK (imperial gallons — about 20% larger than US gallons), and km/L (used across Asia and Latin America). Note that a US MPG figure and a UK MPG figure are not the same even for the same vehicle — this converter handles the distinction correctly.
          </p>
        </div>

        {/* Examples */}
        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Fuel Cost Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
            {[
              { label: '500km trip, 8L/100km, $1.80/L',   value: '$72.00',  sub: '40L of fuel' },
              { label: '300 miles, 35 mpg, $3.50/gal',    value: '$30.00',  sub: '8.57 gallons' },
              { label: '20km commute, 7L/100km, $1.75/L', value: '$2.45/day',sub: '$637/year' },
              { label: '35 mpg (US) = L/100km',            value: '6.72',   sub: 'L/100km equivalent' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="fuel-cost-calculator" />
      </div>
    </div>
  );
}
