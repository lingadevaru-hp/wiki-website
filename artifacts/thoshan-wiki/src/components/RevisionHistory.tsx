import type { EditHistory } from '../types/article';

interface RevisionHistoryProps {
  history: EditHistory[];
}

const badgeColors: Record<string, string> = {
  major: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  minor: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

export default function RevisionHistory({ history }: RevisionHistoryProps) {
  if (!history.length) return null;

  return (
    <div data-testid="revision-history" className="text-sm">
      <h3 className="font-bold text-sm mb-2 border-b border-border pb-1">Edit history</h3>
      <ul className="space-y-2">
        {history.map((entry, i) => (
          <li key={i} className="flex flex-col gap-0.5" data-testid={`revision-entry-${i}`}>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-mono">
                {new Date(entry.date).toLocaleDateString()}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${badgeColors[entry.changeType] || badgeColors.minor}`}
              >
                {entry.changeType}
              </span>
            </div>
            <div className="text-xs">
              <span className="font-medium">{entry.editor}</span>
              {' — '}
              <span className="text-muted-foreground">{entry.summary}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
