import { Link } from 'react-router-dom';
import { tools } from '../data/tools.js';
import ToolCard from '../components/ToolCard.jsx';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '64px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto 48px' }}>
        <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '16px' }}>404</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>
          The page you're looking for doesn't exist. Try one of our free tools below.
        </p>
        <Link to="/" className="btn btn-primary">← Back to Home</Link>
      </div>

      <div className="tools-grid">
        {tools.map(t => <ToolCard key={t.id} tool={t} />)}
      </div>
    </div>
  );
}
