import { useState } from 'react';
import RelatedTools from './RelatedTools.jsx';

// ── Core calculations ─────────────────────────────────────────

// Baud rate = symbols per second (for serial: usually 1 symbol = 1 bit)
// Bit rate = baud rate × bits per symbol
// For standard serial (UART): bits_per_symbol = 1

// Data bits per frame: data_bits + parity (0 or 1) + stop bits + start bit (always 1)
function bitsPerFrame(dataBits, parity, stopBits) {
  const parityBit = parity === 'none' ? 0 : 1;
  return 1 + dataBits + parityBit + stopBits; // start + data + parity + stop
}

// Effective data bits per frame (just the payload)
function dataBitsPerFrame(dataBits) { return dataBits; }

// Transfer time for N bytes
function transferTime(bytes, baudRate, dataBits, parity, stopBits) {
  const framing    = bitsPerFrame(dataBits, parity, stopBits);
  const totalBits  = bytes * framing;
  return totalBits / baudRate; // seconds
}

// Max throughput in bytes/sec
function maxThroughput(baudRate, dataBits, parity, stopBits) {
  const framing    = bitsPerFrame(dataBits, parity, stopBits);
  return (baudRate / framing) * dataBits / 8; // bytes/sec
}

// Efficiency %
function efficiency(dataBits, parity, stopBits) {
  const total = bitsPerFrame(dataBits, parity, stopBits);
  return (dataBits / total) * 100;
}

// Time to transfer a file of given size
function fileTransferTime(fileSizeBytes, baudRate, dataBits, parity, stopBits) {
  return transferTime(fileSizeBytes, baudRate, dataBits, parity, stopBits);
}

// Standard baud rates
const STANDARD_BAUD_RATES = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400,
  19200, 28800, 38400, 57600, 115200, 230400, 460800, 921600,
];

// Data bit options
const DATA_BIT_OPTIONS = [5, 6, 7, 8, 9];

// Stop bit options
const STOP_BIT_OPTIONS = [1, 1.5, 2];

// Parity options
const PARITY_OPTIONS = [
  { id: 'none', label: 'None (N)' },
  { id: 'even', label: 'Even (E)' },
  { id: 'odd',  label: 'Odd (O)'  },
  { id: 'mark', label: 'Mark (M)' },
  { id: 'space',label: 'Space (S)'},
];

// Common serial configs
const COMMON_CONFIGS = [
  { label: '8N1',     dataBits: 8, parity: 'none', stopBits: 1,   note: 'Most common' },
  { label: '8E1',     dataBits: 8, parity: 'even', stopBits: 1,   note: 'Even parity' },
  { label: '8O1',     dataBits: 8, parity: 'odd',  stopBits: 1,   note: 'Odd parity'  },
  { label: '8N2',     dataBits: 8, parity: 'none', stopBits: 2,   note: '2 stop bits' },
  { label: '7E1',     dataBits: 7, parity: 'even', stopBits: 1,   note: 'ASCII/Modbus'},
  { label: '7N2',     dataBits: 7, parity: 'none', stopBits: 2,   note: 'Legacy'      },
];

function fmtNum(n, dp = 2) {
  if (!isFinite(n) || isNaN(n)) return '—';
  if (dp === 0) return Math.round(n).toLocaleString();
  return parseFloat(n.toFixed(dp)).toLocaleString();
}

function fmtTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 0.001)   return `${(seconds * 1e6).toFixed(1)} µs`;
  if (seconds < 1)       return `${(seconds * 1000).toFixed(1)} ms`;
  if (seconds < 60)      return `${seconds.toFixed(2)} s`;
  if (seconds < 3600)    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function fmtBytes(bytes) {
  if (bytes < 1024)      return `${bytes} B/s`;
  if (bytes < 1024*1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB/s`;
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
      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? 'var(--accent-hover)' : 'var(--text-3)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: 'clamp(0.95rem,2.5vw,1.45rem)', fontWeight: 700, fontFamily: 'var(--mono)', color: color || (accent ? 'var(--accent-hover)' : 'var(--text)'), lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return <div className="output-area json-err" style={{ marginTop: '14px' }}>✗ {msg}</div>;
}

// ── Frame diagram ─────────────────────────────────────────────

function FrameDiagram({ dataBits, parity, stopBits }) {
  const parityBit = parity === 'none' ? 0 : 1;
  const total     = 1 + dataBits + parityBit + stopBits;

  const segments = [
    { label: 'START',   bits: 1,          color: '#dc2626', textColor: 'white'   },
    { label: `DATA (${dataBits})`, bits: dataBits, color: 'var(--accent)', textColor: 'white' },
    ...(parityBit ? [{ label: 'PAR', bits: 1, color: '#7c3aed', textColor: 'white' }] : []),
    { label: `STOP (${stopBits})`, bits: stopBits, color: '#0891b2', textColor: 'white' },
  ];

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', height: '36px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            flex: seg.bits,
            background: seg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: seg.textColor,
            whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 4px',
            borderRight: i < segments.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
          }}>
            {seg.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '4px' }}>
        <span>LSB first</span>
        <span>{total} bits total per frame</span>
        <span>MSB last</span>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-3)' }}>
        {[
          { color: '#dc2626',          label: 'Start bit (always 0)' },
          { color: 'var(--accent)',     label: `Data (${dataBits} bits)` },
          ...(parityBit ? [{ color: '#7c3aed', label: `Parity (${parity})` }] : []),
          { color: '#0891b2',           label: `Stop (${stopBits} bit${stopBits !== 1 ? 's' : ''}, always 1)` },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: l.color, borderRadius: 2 }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Mode 1: Baud Rate Calculator ─────────────────────────────

function BaudCalcMode() {
  const [baudRate,  setBaudRate]  = useState('9600');
  const [dataBits,  setDataBits]  = useState('8');
  const [parity,    setParity]    = useState('none');
  const [stopBits,  setStopBits]  = useState('1');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState('');

  const baud     = parseFloat(baudRate);
  const db       = parseInt(dataBits)   || 8;
  const sb       = parseFloat(stopBits) || 1;
  const par      = parity;

  function loadConfig(cfg) {
    setDataBits(String(cfg.dataBits));
    setParity(cfg.parity);
    setStopBits(String(cfg.stopBits));
    setResult(null);
  }

  function calculate() {
    if (isNaN(baud) || baud <= 0) { setError('Enter a valid baud rate.'); setResult(null); return; }

    const frame   = bitsPerFrame(db, par, sb);
    const eff     = efficiency(db, par, sb);
    const through = maxThroughput(baud, db, par, sb);
    const bitTime = 1 / baud * 1e6; // microseconds per bit
    const frameTime = frame / baud * 1e6; // µs per frame

    // Transfer times for common file sizes
    const sizes = [
      { label: '1 byte',   bytes: 1         },
      { label: '1 KB',     bytes: 1024      },
      { label: '1 MB',     bytes: 1024*1024 },
      { label: '10 MB',    bytes: 10*1024*1024 },
    ];
    const timings = sizes.map(s => ({
      ...s,
      time: transferTime(s.bytes, baud, db, par, sb),
    }));

    setResult({ baud, db, sb, par, frame, eff, through, bitTime, frameTime, timings });
    setError('');
  }

  function copy() {
    if (!result) return;
    const lines = [
      `Baud rate: ${result.baud.toLocaleString()} bps`,
      `Config: ${result.db}${result.par === 'none' ? 'N' : result.par[0].toUpperCase()}${result.sb}`,
      `Throughput: ${fmtBytes(result.through)}`,
      `Efficiency: ${fmtNum(result.eff, 1)}%`,
      `Bit time: ${fmtNum(result.bitTime, 2)} µs`,
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setToast('Copied!'); setTimeout(() => setToast(''), 2000);
    });
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate serial port throughput, efficiency, bit timing, and data transfer time for any UART/RS-232 configuration.
      </p>

      {/* Baud rate */}
      <div className="form-row">
        <div className="form-group">
          <label>Baud rate (bps)</label>
          <input type="number" value={baudRate} min="1"
            onChange={e => { setBaudRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 9600"
            style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {[9600, 19200, 38400, 57600, 115200, 230400].map(r => (
              <button key={r} className={`tag${baudRate === String(r) ? ' active' : ''}`}
                onClick={() => { setBaudRate(String(r)); setResult(null); }}>
                {r.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data bits */}
      <div className="form-group">
        <label>Data bits</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DATA_BIT_OPTIONS.map(d => (
            <button key={d} className={`tag${dataBits === String(d) ? ' active' : ''}`}
              onClick={() => { setDataBits(String(d)); setResult(null); }}>
              {d} bits
            </button>
          ))}
        </div>
      </div>

      {/* Parity */}
      <div className="form-group">
        <label>Parity</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PARITY_OPTIONS.map(p => (
            <button key={p.id} className={`tag${parity === p.id ? ' active' : ''}`}
              onClick={() => { setParity(p.id); setResult(null); }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stop bits */}
      <div className="form-group">
        <label>Stop bits</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {STOP_BIT_OPTIONS.map(s => (
            <button key={s} className={`tag${stopBits === String(s) ? ' active' : ''}`}
              onClick={() => { setStopBits(String(s)); setResult(null); }}>
              {s} stop bit{s !== 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Common config presets */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
          Common configurations
        </p>
        <div className="tag-row">
          {COMMON_CONFIGS.map(cfg => (
            <button key={cfg.label} className="tag" onClick={() => loadConfig(cfg)}
              title={cfg.note}>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate</button>
        <button className="btn btn-ghost" onClick={() => { setBaudRate('9600'); setDataBits('8'); setParity('none'); setStopBits('1'); setResult(null); setError(''); }}>Reset</button>
        {result && <button className="btn btn-secondary btn-sm" onClick={copy}>Copy</button>}
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '24px' }}>
          {/* Banner */}
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '16px 20px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              {result.baud.toLocaleString()} baud &nbsp;·&nbsp; {result.db}{result.par === 'none' ? 'N' : result.par[0].toUpperCase()}{result.sb}
            </div>
            <div style={{ fontSize: 'clamp(1.5rem,5vw,2.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', lineHeight: 1 }}>
              {fmtBytes(result.through)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>
              effective throughput &nbsp;·&nbsp; {fmtNum(result.eff, 1)}% efficiency
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Throughput"   value={fmtBytes(result.through)}           sub="bytes/sec" />
            <StatCard label="Efficiency"   value={`${fmtNum(result.eff, 1)}%`}           sub={`${result.db} of ${result.frame} bits are data`} />
            <StatCard label="Bit time"     value={`${fmtNum(result.bitTime, 2)} µs`}     sub="per bit" />
            <StatCard label="Frame time"   value={`${fmtNum(result.frameTime, 1)} µs`}   sub={`${result.frame} bits`} />
            <StatCard label="Bits/frame"   value={result.frame}                            sub="total" />
          </div>

          {/* Frame diagram */}
          <SectionTitle>UART frame structure</SectionTitle>
          <FrameDiagram dataBits={result.db} parity={result.par} stopBits={result.sb} />

          {/* Transfer time table */}
          <SectionTitle>Transfer time estimates</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '8px' }}>
            {result.timings.map(t => (
              <div key={t.label} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: '3px' }}>{t.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-hover)' }}>
                  {fmtTime(t.time)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}

// ── Mode 2: Transfer Time Calculator ─────────────────────────

function TransferTimeMode() {
  const [baudRate,  setBaudRate]  = useState('9600');
  const [dataBits,  setDataBits]  = useState('8');
  const [parity,    setParity]    = useState('none');
  const [stopBits,  setStopBits]  = useState('1');
  const [fileSize,  setFileSize]  = useState('');
  const [sizeUnit,  setSizeUnit]  = useState('KB');
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

  const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
  const SIZE_MULTIPLIERS = { B: 1, KB: 1024, MB: 1024*1024, GB: 1024*1024*1024 };

  function calculate() {
    const baud = parseFloat(baudRate);
    const fs   = parseFloat(fileSize);
    const db   = parseInt(dataBits)   || 8;
    const sb   = parseFloat(stopBits) || 1;
    const par  = parity;

    if (isNaN(baud) || baud <= 0) { setError('Enter a valid baud rate.'); setResult(null); return; }
    if (isNaN(fs)   || fs <= 0)   { setError('Enter a valid file/data size.'); setResult(null); return; }

    const bytes    = fs * SIZE_MULTIPLIERS[sizeUnit];
    const frame    = bitsPerFrame(db, par, sb);
    const secs     = transferTime(bytes, baud, db, par, sb);
    const through  = maxThroughput(baud, db, par, sb);
    const eff      = efficiency(db, par, sb);
    const totalBits = bytes * frame;

    setResult({ baud, db, sb, par, bytes, secs, through, eff, totalBits, frame, fs, sizeUnit });
    setError('');
  }

  const PRESET_SIZES = [
    { label: '1 KB',   val: '1',    unit: 'KB' },
    { label: '10 KB',  val: '10',   unit: 'KB' },
    { label: '100 KB', val: '100',  unit: 'KB' },
    { label: '1 MB',   val: '1',    unit: 'MB' },
    { label: '10 MB',  val: '10',   unit: 'MB' },
  ];

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Calculate how long it takes to transmit any file or data block at a given baud rate and serial configuration.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Baud rate (bps)</label>
          <input type="number" value={baudRate} min="1"
            onChange={e => { setBaudRate(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. 9600"
            style={{ fontFamily: 'var(--mono)' }} />
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {[9600, 38400, 115200, 230400].map(r => (
              <button key={r} className={`tag${baudRate === String(r) ? ' active' : ''}`}
                onClick={() => { setBaudRate(String(r)); setResult(null); }}>
                {r.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Data / file size</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="number" value={fileSize} min="0"
              onChange={e => { setFileSize(e.target.value); setResult(null); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="e.g. 100"
              style={{ flex: 1, fontFamily: 'var(--mono)' }} />
            <select value={sizeUnit} onChange={e => { setSizeUnit(e.target.value); setResult(null); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', width: '68px', padding: '4px 6px' }}>
              {SIZE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="tag-row" style={{ marginTop: '6px' }}>
            {PRESET_SIZES.map(p => (
              <button key={p.label} className="tag"
                onClick={() => { setFileSize(p.val); setSizeUnit(p.unit); setResult(null); }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Framing */}
      <div className="form-row">
        <div className="form-group">
          <label>Data bits</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[7, 8].map(d => (
              <button key={d} className={`tag${dataBits === String(d) ? ' active' : ''}`}
                onClick={() => { setDataBits(String(d)); setResult(null); }}>
                {d} bits
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Parity</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['none', 'even', 'odd'].map(p => (
              <button key={p} className={`tag${parity === p ? ' active' : ''}`}
                onClick={() => { setParity(p); setResult(null); }}
                style={{ textTransform: 'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Stop bits</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2].map(s => (
              <button key={s} className={`tag${stopBits === String(s) ? ' active' : ''}`}
                onClick={() => { setStopBits(String(s)); setResult(null); }}>
                {s} stop
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Calculate time</button>
        <button className="btn btn-ghost" onClick={() => { setFileSize(''); setBaudRate('9600'); setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px' }}>
          <div style={{
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)', padding: '16px 20px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              Transfer time for {result.fs} {result.sizeUnit}
            </div>
            <div style={{ fontSize: 'clamp(1.5rem,5vw,2.5rem)', fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--accent-hover)', lineHeight: 1 }}>
              {fmtTime(result.secs)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>
              at {result.baud.toLocaleString()} baud &nbsp;·&nbsp; {result.db}{result.par === 'none' ? 'N' : result.par[0].toUpperCase()}{result.sb}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard accent label="Transfer time"  value={fmtTime(result.secs)} />
            <StatCard label="Total bits"    value={result.totalBits.toLocaleString()} sub="on the wire" />
            <StatCard label="Throughput"    value={fmtBytes(result.through)} />
            <StatCard label="Efficiency"    value={`${(result.eff).toFixed(1)}%`} sub={`${result.db}/${result.frame} bits are data`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mode 3: Baud Rate Comparison ─────────────────────────────

function CompareMode() {
  const [dataBits, setDataBits] = useState('8');
  const [parity,   setParity]   = useState('none');
  const [stopBits, setStopBits] = useState('1');
  const [fileKB,   setFileKB]   = useState('100');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  function calculate() {
    const db  = parseInt(dataBits)   || 8;
    const sb  = parseFloat(stopBits) || 1;
    const fkb = parseFloat(fileKB)   || 100;

    if (fkb <= 0) { setError('Enter a valid file size.'); setResult(null); return; }

    const bytes = fkb * 1024;
    const rows  = STANDARD_BAUD_RATES.map(baud => ({
      baud,
      through:  maxThroughput(baud, db, parity, sb),
      eff:      efficiency(db, parity, sb),
      time100kb: transferTime(bytes, baud, db, parity, sb),
    }));

    setResult({ rows, db, sb, parity, fkb, bytes });
    setError('');
  }

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '16px' }}>
        Compare throughput and transfer times across all standard baud rates for your serial configuration.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label>Data bits</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DATA_BIT_OPTIONS.map(d => (
              <button key={d} className={`tag${dataBits === String(d) ? ' active' : ''}`}
                onClick={() => { setDataBits(String(d)); setResult(null); }}>{d}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Parity</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['none','even','odd'].map(p => (
              <button key={p} className={`tag${parity === p ? ' active' : ''}`}
                onClick={() => { setParity(p); setResult(null); }}
                style={{ textTransform: 'capitalize' }}>{p}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Stop bits</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2].map(s => (
              <button key={s} className={`tag${stopBits === String(s) ? ' active' : ''}`}
                onClick={() => { setStopBits(String(s)); setResult(null); }}>{s}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Compare transfer of (KB)</label>
          <input type="number" value={fileKB} min="1"
            onChange={e => { setFileKB(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="100" style={{ fontFamily: 'var(--mono)' }} />
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={calculate}>Compare all rates</button>
        <button className="btn btn-ghost" onClick={() => { setResult(null); setError(''); }}>Clear</button>
      </div>

      {error && <ErrBox msg={error} />}

      {result && !error && (
        <div style={{ marginTop: '22px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Baud rate', 'Throughput', 'Efficiency', `Time for ${result.fkb} KB`].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={row.baud} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface2)' : 'transparent' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>
                    {row.baud.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: 'var(--accent-hover)' }}>
                    {fmtBytes(row.through)}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
                    {row.eff.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    {fmtTime(row.time100kb)}
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

// ── Mode tabs ─────────────────────────────────────────────────

const MODES = [
  { label: 'Baud Calculator', desc: 'throughput & timing'       },
  { label: 'Transfer Time',   desc: 'file size → time'          },
  { label: 'Compare Rates',   desc: 'all standard baud rates'   },
];

export default function BaudRateCalculator() {
  const [mode, setMode] = useState(0);

  return (
    <div className="tool-page">
      <div className="container">

        <div className="tool-page-header">
          <div className="breadcrumb">
            <a href="/">Home</a><span>›</span>
            <span>Baud Rate Calculator</span>
          </div>
          <h1>Baud Rate Calculator</h1>
          <p className="subtitle">
            Calculate serial port throughput, efficiency, bit timing, and data transfer time for any UART/RS-232/RS-485 baud rate and framing configuration.
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

          {mode === 0 && <BaudCalcMode />}
          {mode === 1 && <TransferTimeMode />}
          {mode === 2 && <CompareMode />}
        </div>

        <div className="seo-content">
          <h2>How Does Baud Rate Work?</h2>
          <p>
            Baud rate measures the number of signal changes (symbols) per second in a serial communication channel. For UART (Universal Asynchronous Receiver-Transmitter) — the standard behind RS-232, RS-485, and TTL serial — one baud equals one bit per second, so the terms are often used interchangeably in this context.
          </p>
          <p>
            However, the <strong>effective data throughput</strong> is always lower than the baud rate because every byte of data is wrapped in a serial frame. A standard frame consists of: one <strong>start bit</strong> (always logic 0), the <strong>data bits</strong> (typically 8), an optional <strong>parity bit</strong>, and one or more <strong>stop bits</strong> (always logic 1). The most common configuration is 8N1 — 8 data bits, no parity, 1 stop bit — giving a 10-bit frame per byte and an efficiency of 80%.
          </p>
          <p>
            At 9600 baud with 8N1, the theoretical throughput is 9600 ÷ 10 = <strong>960 bytes/second</strong>. At 115200 baud it becomes 11,520 bytes/second (~11.25 KB/s). Adding a parity bit (8E1 or 8O1) reduces throughput to 727 or 879 bytes/second at the same baud rates because the frame is now 11 bits instead of 10.
          </p>
          <p>
            <strong>Bit time</strong> — the duration of one bit on the wire — is 1 ÷ baud rate. At 9600 baud each bit lasts ~104 µs; at 115200 baud it's ~8.7 µs. This matters for oscilloscope debugging and timing margin analysis.
          </p>
          <p>
            The <strong>frame diagram</strong> in the calculator visualises exactly how bits are arranged on the wire for your chosen configuration. The <strong>comparison table</strong> shows all 16 standard baud rates side by side so you can evaluate the throughput trade-offs at a glance.
          </p>
        </div>

        <div className="tool-box" style={{ marginBottom: '32px' }}>
          <h2 className="tool-box-title">Common Baud Rate Examples</h2>
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px,1fr))' }}>
            {[
              { label: '9600 baud, 8N1',      value: '960 B/s',     sub: '80% efficiency' },
              { label: '115200 baud, 8N1',    value: '11.25 KB/s',  sub: '80% efficiency' },
              { label: '9600 baud, 8E1',      value: '872 B/s',     sub: '72.7% efficiency' },
              { label: '115200 baud, 8N2',    value: '10.23 KB/s',  sub: '72.7% efficiency' },
              { label: '1 KB @ 9600 baud',    value: '1.07 s',      sub: '8N1 configuration' },
              { label: '1 MB @ 115200 baud',  value: '91.0 s',      sub: '8N1 configuration' },
            ].map(ex => (
              <div key={ex.label} className="result-stat">
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', marginBottom: '4px', lineHeight: 1.4 }}>{ex.label}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>{ex.value}</div>
                <div className="stat-label">{ex.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <RelatedTools currentId="baud-rate-calculator" />
      </div>
    </div>
  );
}
