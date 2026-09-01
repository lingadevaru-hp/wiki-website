export const DEFAULT_CATEGORY_COLOR = "#3366CC";

export const categoryColors: Record<string, string> = {
  Profile: "#3366CC",
  Blockchain: "#E67E22",
  "AI / ML": "#8E44AD",
  Infrastructure: "#27AE60",
  Security: "#C0392B",
  Systems: "#2980B9",
  Web: "#16A085",
  Learning: "#F39C12",
};

export const categoryGlyph: Record<string, string> = {
  Profile: "👤",
  Blockchain: "⛓️",
  "AI / ML": "🤖",
  Infrastructure: "🏗️",
  Security: "🔒",
  Systems: "🖥️",
  Web: "🌐",
  Learning: "📚",
};

export function categoryColor(category: string): string {
  return categoryColors[category] ?? DEFAULT_CATEGORY_COLOR;
}
