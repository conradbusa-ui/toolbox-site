import { useState } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

function toSentenceCase(str) {
  return str.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
}

function toTitleCase(str) {
  const minor = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is']);
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i === 0 || !minor.has(word)) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');
}

function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

function toSnakeCase(str) {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function countStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  return { words, chars, lines };
}

const conversions = [
  { id: 'upper',    label: 'UPPER CASE',    fn: s => s.toUpperCase() },
  { id: 'lower',    label: 'lower case',    fn: s => s.toLowerCase() },
  { id: 'title',    label: 'Title Case',    fn: toTitleCase },
  { id: 'sentence', label: 'Sentence case', fn: toSentenceCase },
  { id: 'camel',    label: 'camelCase',     fn: toCamelCase },
  { id: 'snake',    label: 'snake_case',    fn: toSnakeCase },
  { id: 'kebab',    label: 'kebab-case',    fn: toKebabCase },
  { id: 'reverse',  label: 'Reverse',       fn: s => s.split('').reverse().join('') },
];

export default function CaseConverter() {
  const [input, setInput] = useState('');
  const [active, setActive] = useState('upper');
  const [toast, setToast] = useState('');

  const output = input ? (conversions.find(c => c.id === active)?.fn(input) ?? input) : '';
  const stats = countStats(input);

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setToast('Copied to clipboard!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  return (
    <div className="tool-page">
      <div className="container">
        <div className="tool-page-header">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <span>Case Converter</span>
          </div>
          <h1>Text Case Converter</h1>
          <p className="subtitle">Convert any text to UPPER, lower, Title, Sentence, camelCase, snake_case, and more.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Convert Text Case</h2>

          <div className="form-group">
            <label htmlFor="case-input">Input Text</label>
            <textarea
              id="case-input"
              rows={5}
              placeholder="Type or paste your text here…"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          <div className="tag-row">
            {conversions.map(c => (
              <button
                key={c.id}
                className={`tag${active === c.id ? ' active' : ''}`}
                onClick={() => setActive(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="result-grid" style={{ marginBottom: '12px' }}>
            <div className="result-stat">
              <div className="stat-value">{stats.chars}</div>
              <div className="stat-label">Characters</div>
            </div>
            <div className="result-stat">
              <div className="stat-value">{stats.words}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="result-stat">
              <div className="stat-value">{stats.lines}</div>
              <div className="stat-label">Lines</div>
            </div>
          </div>

          {output && (
            <>
              <label>Output</label>
              <div className="output-area" style={{ minHeight: '80px', fontFamily: 'var(--font)', fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                {output}
              </div>
              <div className="btn-group">
                <button className="btn btn-primary btn-sm" onClick={copy}>Copy Output</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setInput('')}>Clear</button>
              </div>
            </>
          )}
        </div>

        <div className="seo-content">
          <h2>Why Text Case Matters</h2>
          <p>
            Consistent text formatting is essential in writing, coding, and data management. Whether you're preparing
            a blog post headline in title case, normalising database fields to lowercase, or converting UI strings to
            camelCase for a JavaScript codebase, doing it by hand across hundreds of words is tedious and error-prone.
          </p>
          <p>
            This case converter handles eight common transformations instantly. The Title Case mode uses standard
            Chicago-style rules, keeping minor words like "the," "and," and "of" in lowercase unless they start the
            sentence. Sentence Case capitalises only the first word and proper nouns at the start of each sentence.
            camelCase and snake_case are useful for variable names in JavaScript, Python, and other languages.
          </p>
          <p>
            Paste any amount of text, pick your conversion from the buttons, and the output appears immediately below.
            Hit Copy to move the result to your clipboard. Everything runs locally in your browser — no data ever
            leaves your device.
          </p>
        </div>

        <RelatedTools currentId="case-converter" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
