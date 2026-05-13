import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function processLines(text, options) {
  let lines = text.split('\n');
  const original = lines.length;

  if (options.trim) lines = lines.map(l => l.trim());
  if (options.removeEmpty) lines = lines.filter(l => l !== '');

  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const key = options.caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }

  if (options.sort) unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: options.caseSensitive ? 'variant' : 'base' }));

  const removed = original - unique.length;
  return { lines: unique, original, removed };
}

export default function RemoveDuplicates() {
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState({
    trim: true,
    removeEmpty: true,
    caseSensitive: false,
    sort: false,
  });
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  const toggle = (key) => setOpts(o => ({ ...o, [key]: !o[key] }));

  const run = () => {
    if (!input.trim()) return;
    setResult(processLines(input, opts));
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.lines.join('\n')).then(() => {
      setToast('Copied to clipboard!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  const clear = () => { setInput(''); setResult(null); };

  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Remove Duplicate Lines</span>
          </div>
          <h1>Remove Duplicate Lines</h1>
          <p className="subtitle">Paste your list, strip repeated lines, and get clean unique output instantly.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Remove Duplicates from Text</h2>

          <div className="form-group">
            <label htmlFor="dup-input">Paste your lines here</label>
            <textarea
              id="dup-input"
              rows={8}
              placeholder={"apple\nbanana\napple\norange\nbanana\ngrape"}
              value={input}
              onChange={e => { setInput(e.target.value); setResult(null); }}
            />
          </div>

          <div className="tag-row">
            <button className={`tag${opts.trim ? ' active' : ''}`} onClick={() => toggle('trim')}>
              Trim whitespace
            </button>
            <button className={`tag${opts.removeEmpty ? ' active' : ''}`} onClick={() => toggle('removeEmpty')}>
              Remove empty lines
            </button>
            <button className={`tag${opts.caseSensitive ? ' active' : ''}`} onClick={() => toggle('caseSensitive')}>
              Case sensitive
            </button>
            <button className={`tag${opts.sort ? ' active' : ''}`} onClick={() => toggle('sort')}>
              Sort A–Z
            </button>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={run} disabled={!input.trim()}>Remove Duplicates</button>
            <button className="btn btn-ghost" onClick={clear} disabled={!input && !result}>Clear</button>
          </div>

          {result && (
            <>
              <div className="result-grid" style={{ marginTop: '20px' }}>
                <div className="result-stat">
                  <div className="stat-value">{result.original}</div>
                  <div className="stat-label">Input Lines</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value">{result.lines.length}</div>
                  <div className="stat-label">Unique Lines</div>
                </div>
                <div className="result-stat">
                  <div className="stat-value" style={{ color: result.removed > 0 ? '#db2777' : 'var(--accent)' }}>
                    {result.removed}
                  </div>
                  <div className="stat-label">Removed</div>
                </div>
              </div>

              <div style={{ position: 'relative', marginTop: '16px' }}>
                <label>Output ({result.lines.length} lines)</label>
                <div className="output-area" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {result.lines.join('\n') || '(empty)'}
                </div>
              </div>

              <div className="btn-group">
                <button className="btn btn-primary btn-sm" onClick={copy}>Copy Output</button>
              </div>
            </>
          )}
        </div>

        <div className="seo-content">
          <h2>When Do You Need to Remove Duplicate Lines?</h2>
          <p>
            Duplicate lines appear all the time when working with data exports, mailing lists, log files, keyword
            research sheets, and copy-pasted content from multiple sources. Removing them by hand is slow and
            unreliable, especially when lists run into hundreds or thousands of entries.
          </p>
          <p>
            This tool processes your text line by line and returns only the unique entries. You can choose whether
            the comparison is case-sensitive (so "Apple" and "apple" count as different) or case-insensitive (treating
            them as duplicates). The trim option strips leading and trailing spaces before comparing, catching near-
            duplicates that differ only in whitespace. The optional sort puts results in alphabetical order.
          </p>
          <p>
            Common use cases include cleaning up email lists before a mail-merge, deduplicating keyword lists for
            SEO, tidying up CSV data before importing into a database, and consolidating notes gathered from multiple
            documents. All processing happens in your browser — nothing is uploaded or stored anywhere.
          </p>
        </div>

        <RelatedTools currentId="remove-duplicates" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
