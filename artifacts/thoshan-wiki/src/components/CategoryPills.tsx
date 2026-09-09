import {
  BookOpen,
  Bot,
  Boxes,
  Globe,
  LayoutGrid,
  Lock,
  Server,
  Terminal,
  User,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Profile: User,
  Blockchain: Boxes,
  "AI / ML": Bot,
  Infrastructure: Server,
  Security: Lock,
  Systems: Terminal,
  Web: Globe,
  Learning: BookOpen,
};

interface CategoryPillsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  ariaLabel: string;
}

/** Single shared filter-pill row used by Home + Articles,
 *  so both pages always look identical. */
export default function CategoryPills({
  categories,
  active,
  onChange,
  ariaLabel,
}: CategoryPillsProps) {
  return (
    <div className="category-row" role="tablist" aria-label={ariaLabel}>
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat] ?? LayoutGrid;
        const selected = active === cat;
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(cat)}
            className={selected ? "selected" : ""}
          >
            <Icon size={15} aria-hidden="true" />
            {cat}
          </button>
        );
      })}
    </div>
  );
}
