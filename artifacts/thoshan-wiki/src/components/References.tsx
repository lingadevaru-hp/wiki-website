import type { Reference } from '../types/article';

interface ReferencesProps {
  references: Reference[];
}

export default function References({ references }: ReferencesProps) {
  if (!references.length) return null;

  return (
    <section id="references" className="mt-6 border-t border-border pt-4" data-testid="references-section">
      <h2 className="text-[1.4em] font-bold border-b border-border pb-1 mb-3 font-serif">References</h2>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        {references.map((ref) => (
          <li key={ref.id} id={`ref-${ref.id}`} className="text-sm leading-relaxed" data-testid={`reference-${ref.id}`}>
            {ref.author && <span>{ref.author}. </span>}
            {ref.url ? (
              <a href={ref.url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                {ref.title}
              </a>
            ) : (
              <span className="italic">{ref.title}</span>
            )}
            {ref.publisher && <span>. {ref.publisher}</span>}
            {ref.year && <span>. {ref.year}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
