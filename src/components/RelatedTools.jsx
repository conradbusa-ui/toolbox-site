import { getRelatedTools } from '../data/tools.js';
import ToolCard from './ToolCard.jsx';

export default function RelatedTools({ currentId }) {
  const related = getRelatedTools(currentId);
  return (
    <section className="related-tools">
      <h2>More Free Tools</h2>
      <div className="related-grid">
        {related.map((tool) => (
          <ToolCard key={tool.id} tool={tool} compact />
        ))}
      </div>
    </section>
  );
}
