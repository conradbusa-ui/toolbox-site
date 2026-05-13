import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-num';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-str';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [mode, setMode] = useState('format'); // 'format' | 'minify'
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const run = () => {
    if (!input.trim()) { setError(''); setOutput(''); return; }
    try {
      const parsed = JSON.parse(input);
      setError('');
      if (mode === 'minify') {
        setOutput(JSON.stringify(parsed));
      } else {
        setOutput(JSON.stringify(parsed, null, Number(indent)));
      }
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setToast('Copied!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  const clear = () => { setInput(''); setOutput(''); setError(''); };

  const sampleJson = `{"name":"Alice","age":30,"hobbies":["coding","hiking"],"address":{"city":"Cape Town","country":"ZA"}}`;

  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>JSON Formatter</span>
          </div>
          <h1>JSON Formatter & Validator</h1>
          <p className="subtitle">Beautify or minify JSON instantly. Detects errors with clear messages.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Format / Minify JSON</h2>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="json-input" style={{ margin: 0 }}>JSON Input</label>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setInput(sampleJson)}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Load sample
              </button>
            </div>
            <textarea
              id="json-input"
              rows={7}
              placeholder='{"key": "value"}'
              value={input}
              onChange={e => { setInput(e.target.value); setOutput(''); setError(''); }}
            />
          </div>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 'none' }}>
              <label>Mode</label>
              <div className="tag-row" style={{ marginBottom: 0 }}>
                <button className={`tag${mode === 'format' ? ' active' : ''}`} onClick={() => setMode('format')}>Beautify</button>
                <button className={`tag${mode === 'minify' ? ' active' : ''}`} onClick={() => setMode('minify')}>Minify</button>
              </div>
            </div>
            {mode === 'format' && (
              <div className="form-group" style={{ flex: 'none', minWidth: '130px' }}>
                <label htmlFor="indent-sel">Indent size</label>
                <select id="indent-sel" value={indent} onChange={e => setIndent(e.target.value)}>
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={"\t"}>Tab</option>
                </select>
              </div>
            )}
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={run} disabled={!input.trim()}>
              {mode === 'minify' ? 'Minify JSON' : 'Format JSON'}
            </button>
            <button className="btn btn-ghost" onClick={clear}>Clear</button>
          </div>

          {error && (
            <div style={{
              marginTop: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#991b1b',
              fontSize: '0.85rem',
              fontFamily: 'var(--mono)',
            }}>
              ✗ {error}
            </div>
          )}

          {output && (
            <div style={{ position: 'relative', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Output — {output.length} chars</label>
                <button className="btn btn-ghost btn-sm" onClick={copy}>Copy</button>
              </div>
              <pre
                className="output-area"
                style={{ maxHeight: '320px', overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }}
              />
            </div>
          )}
        </div>

        <style>{`
          .json-key  { color: #7dd3fc; }
          .json-str  { color: #86efac; }
          .json-num  { color: #fbbf24; }
          .json-bool { color: #f472b6; }
          .json-null { color: #94a3b8; }
        `}</style>

        <div className="seo-content">
          <h2>What Is JSON and Why Format It?</h2>
          <p>
            JSON (JavaScript Object Notation) is the most widely used data exchange format on the web. APIs, config
            files, and databases all use it. When JSON arrives minified — with all whitespace stripped — it becomes
            nearly impossible to read or debug. Formatting it with proper indentation immediately reveals the structure.
          </p>
          <p>
            This formatter parses your JSON and re-serialises it with clean indentation and colour-coded syntax
            highlighting. Keys appear in blue, string values in green, numbers in amber, and booleans or null in
            distinct colours so the structure is immediately scannable. The validator catches syntax errors — missing
            commas, unquoted keys, trailing commas — and tells you exactly what went wrong so you can fix it fast.
          </p>
          <p>
            The minify mode does the opposite: it removes all unnecessary whitespace to produce the smallest possible
            string, useful before sending JSON in an API request or storing it in a tight environment. Use the indent
            selector to choose 2 or 4 spaces, or a tab character, depending on your project's style guide.
          </p>
        </div>

        <RelatedTools currentId="json-formatter" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
