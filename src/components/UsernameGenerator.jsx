import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RelatedTools from './RelatedTools.jsx';

const adjectives = [
  'swift','bold','cool','dark','epic','fast','grim','iron','jade','keen',
  'lone','nova','neon','onyx','peak','rare','sage','teal','vast','wild',
  'azure','blaze','crisp','dusk','ember','feral','ghost','haze','ivory','jetty',
  'lunar','mossy','noble','ocean','prism','quill','rogue','slate','turbo','ultra',
  'vivid','wired','xenon','young','zesty','amber','brisk','cinch','delta','echoing',
];

const nouns = [
  'wolf','hawk','byte','code','edge','fire','gear','hero','jade','kite',
  'lion','monk','node','pike','rock','sage','tide','vine','wave','zone',
  'atlas','blade','craft','drift','eagle','flare','grove','haven','inbox','jaguar',
  'karma','lance','maple','nexus','orbit','pilot','quest','ridge','storm','torch',
  'ultra','vapor','whirl','xenon','youth','zephyr','anvil','birch','cedar','dingo',
];

const separators = ['', '_', '-', '.'];

function generate(word, style, count, sep) {
  const results = new Set();
  const base = word.trim().toLowerCase().replace(/\s+/g, sep || '_');

  while (results.size < count) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const s = sep;

    let username = '';
    if (base) {
      const variants = [
        `${base}${s}${noun}`,
        `${adj}${s}${base}`,
        `${base}${s}${num}`,
        `${base}${s}${adj}`,
        `${noun}${s}${base}`,
      ];
      username = variants[Math.floor(Math.random() * variants.length)];
    } else {
      const variants = [
        `${adj}${s}${noun}`,
        `${adj}${s}${noun}${s}${num}`,
        `${noun}${s}${adj}`,
        `${noun}${num}`,
        `${adj}${num}${s}${noun}`,
      ];
      username = variants[Math.floor(Math.random() * variants.length)];
    }

    if (style === 'upper') username = username.toUpperCase();
    else if (style === 'title') username = username.split(s).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(s);

    if (username.length >= 4 && username.length <= 24) results.add(username);
    if (results.size > count * 20) break; // safety valve
  }
  return [...results].slice(0, count);
}

export default function UsernameGenerator() {
  const [word, setWord] = useState('');
  const [style, setStyle] = useState('lower');
  const [sep, setSep] = useState('_');
  const [count, setCount] = useState(12);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState('');

  const run = useCallback(() => {
    setResults(generate(word, style, count, sep));
  }, [word, style, count, sep]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(`Copied "${text}"`);
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
            <span>Username Generator</span>
          </div>
          <h1>Free Username Generator</h1>
          <p className="subtitle">Create unique, creative usernames for any platform instantly.</p>
        </div>

        <div className="tool-box">
          <h2 className="tool-box-title">Generate Usernames</h2>

          <div className="form-group">
            <label htmlFor="word-input">Base word (optional)</label>
            <input
              id="word-input"
              type="text"
              placeholder="e.g. dragon, pixel, your name…"
              value={word}
              onChange={e => setWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && run()}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="style-select">Style</label>
              <select id="style-select" value={style} onChange={e => setStyle(e.target.value)}>
                <option value="lower">lowercase</option>
                <option value="title">TitleCase</option>
                <option value="upper">UPPERCASE</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sep-select">Separator</label>
              <select id="sep-select" value={sep} onChange={e => setSep(e.target.value)}>
                <option value="">None (nospace)</option>
                <option value="_">Underscore _</option>
                <option value="-">Hyphen -</option>
                <option value=".">Dot .</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="count-select">How many</label>
              <select id="count-select" value={count} onChange={e => setCount(Number(e.target.value))}>
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={run}>Generate Usernames</button>
            {results.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setResults([])}>Clear</button>
            )}
          </div>

          {results.length > 0 && (
            <div className="username-results" style={{ marginTop: '20px' }}>
              {results.map((u) => (
                <div key={u} className="username-chip">
                  <span>{u}</span>
                  <button onClick={() => copy(u)} title="Copy">Copy</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="seo-content">
          <h2>How to Pick the Perfect Username</h2>
          <p>
            A great username is memorable, easy to type, and available across platforms. Whether you're setting up a
            gaming handle, a social media profile, or a developer account, a well-chosen name helps you build a
            consistent online presence. This generator combines descriptive adjectives and nouns with optional base
            words and number suffixes to give you fresh ideas in seconds.
          </p>
          <p>
            You can enter a base word — your real name, a hobby, or a favourite thing — and the generator will build
            usernames around it. Or leave the field blank to get completely random combinations. Use the style
            selector to get lowercase handles for platforms like GitHub or Discord, TitleCase names for streaming
            profiles, or UPPERCASE variants for gaming tags.
          </p>
          <p>
            Once you spot a username you like, click Copy to grab it to your clipboard, then check availability on
            your target platform. Because this tool runs entirely in your browser, none of your inputs are stored or
            transmitted — it's completely private.
          </p>
        </div>

        <RelatedTools currentId="username-generator" />
      </div>
      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
