import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Section as SectionType } from '../types/article';
import ContentBlock from './ContentBlock';

interface SectionProps {
  section: SectionType;
  depth?: number;
}

export default function Section({ section, depth = 0 }: SectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const HeadingTag = section.level === 2 ? 'h2' : section.level === 3 ? 'h3' : 'h4';
  const headingClass =
    section.level === 2
      ? 'text-[1.4em] font-bold border-b border-border pb-1 mb-3 mt-6 font-serif flex items-center justify-between'
      : section.level === 3
      ? 'text-[1.2em] font-bold mt-5 mb-2 font-serif flex items-center justify-between'
      : 'text-base font-bold mt-4 mb-2 font-serif flex items-center justify-between';

  return (
    <section id={section.id} className="wiki-section" data-testid={`section-${section.id}`}>
      <HeadingTag className={headingClass}>
        <span>{section.title}</span>
        {section.collapsible && (
          <button
            data-testid={`button-collapse-${section.id}`}
            onClick={() => setCollapsed((c) => !c)}
            className="text-accent text-xs font-normal hover:underline ml-2"
          >
            [{collapsed ? 'show' : 'hide'}]
          </button>
        )}
      </HeadingTag>

      {!collapsed && (
        <>
          <div className="clearfix">
            {section.content.map((block, i) => (
              <ContentBlock key={i} block={block} />
            ))}
          </div>

          {section.subsections?.map((sub) => (
            <Section key={sub.id} section={sub} depth={depth + 1} />
          ))}
        </>
      )}
    </section>
  );
}
