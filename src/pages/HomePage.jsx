import { tools } from '../data/tools.js';
import ToolCard from '../components/ToolCard.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Free Online Tools — <span>No Sign-Up</span></h1>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff', marginBottom: '8px', letterSpacing: '0.01em' }}>
            65+ Free Calculators &amp; Tools (Fast, Accurate, No Signup)
          </p>
          <p>Browser-based utilities that run instantly on any device. Clean, fast, and completely free.</p>
          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center' }}>
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="tools-section">
        <div className="container">
          <h2 className="section-heading">All Tools</h2>
          <div className="tools-grid">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 64px' }}>
        <div className="container">
          <div className="seo-content">
            <h2>Why Use ToolBox?</h2>
            <p>
              ToolBox is a collection of free, browser-based utilities designed for everyday tasks that come up in
              writing, development, and data work. Every tool on this site runs entirely inside your browser — nothing
              is sent to a server, so your data stays private by default.
            </p>
            <p>
              Whether you need to quickly generate a creative username for a new account, convert a block of text to
              title case, remove duplicate lines from a CSV export, format a messy JSON blob, or calculate someone's
              exact age, you'll find the right tool here. No account creation, no paywall, no ads.
            </p>
            <p>
              ToolBox is built to be fast and distraction-free. Each tool loads immediately and works on any device —
              desktop, tablet, or phone. Bookmark the homepage and you'll always have a reliable set of utilities one
              tap away.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
