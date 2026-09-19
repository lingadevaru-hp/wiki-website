import { useState } from "react";
import { Play } from "lucide-react";
import type { ContentBlock as ContentBlockType } from "../types/article";
import MediaViewer, { type MediaViewerItem } from "./MediaViewer";
import { renderWikiMarkdown } from "./WikiText";

export default function ContentBlock({ block }: { block: ContentBlockType }) {
  const [viewerItem, setViewerItem] = useState<MediaViewerItem | null>(null);

  switch (block.type) {
    case "text":
      return (
        <div className="wiki-text mb-2">
          {renderWikiMarkdown(block.content || "")}
        </div>
      );

    case "banner":
      return (
        <div
          className="mb-5 border border-border overflow-hidden"
          data-testid="banner-block"
        >
          <button
            type="button"
            className="block w-full cursor-zoom-in"
            onClick={() =>
              setViewerItem({
                src: block.src!,
                alt: block.alt || "",
                caption: block.caption,
                type: "image",
              })
            }
            aria-label="Open image full screen"
          >
            <img
              src={block.src}
              alt={block.alt || ""}
              className="w-full object-cover"
              loading="eager"
              style={{ maxHeight: "340px" }}
            />
          </button>
          {block.caption && (
            <p className="text-xs text-muted-foreground p-2 italic text-center bg-card/50 border-t border-border">
              {block.caption}
            </p>
          )}
          {viewerItem && (
            <MediaViewer
              item={viewerItem}
              onClose={() => setViewerItem(null)}
            />
          )}
        </div>
      );

    case "image":
      return (
        <div className="float-right clear-right ml-4 mb-4 max-w-[240px] border border-border bg-card text-center">
          <img
            src={block.src}
            alt={block.alt || ""}
            className="w-full cursor-zoom-in"
            loading="lazy"
            onClick={() =>
              setViewerItem({
                src: block.src!,
                alt: block.alt || "",
                caption: block.caption,
                type: "image",
              })
            }
            data-testid={`image-block-${block.src?.split("/").pop()}`}
          />
          {block.caption && (
            <p className="text-xs text-muted-foreground p-1 italic">
              {block.caption}
            </p>
          )}
          {viewerItem && (
            <MediaViewer
              item={viewerItem}
              onClose={() => setViewerItem(null)}
            />
          )}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto mb-4">
          <table
            className="w-full border-collapse border border-border text-foreground"
            style={{ fontSize: "14px" }}
            data-testid="table-block"
          >
            {block.columns && (
              <thead>
                <tr className="bg-card">
                  {block.columns.map((col, i) => (
                    <th
                      key={i}
                      className="border border-border px-3 py-1.5 text-left font-bold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows?.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-card/40" : ""}>
                  {block.columns?.map((col, ci) => (
                    <td key={ci} className="border border-border px-3 py-1.5">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "video":
      return (
        <div className="mb-4" data-testid="video-block">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={block.src}
              title={block.caption || "Video"}
              className="absolute inset-0 w-full h-full border border-border"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <button
              type="button"
              className="absolute inset-0 flex cursor-zoom-in items-center justify-center bg-black/0 transition-colors hover:bg-black/20"
              onClick={() =>
                setViewerItem({
                  src: block.src!,
                  alt: block.alt || block.caption || "Video",
                  caption: block.caption,
                  type: "video",
                })
              }
              aria-label="Open video full screen"
              data-testid="button-video-fullscreen"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow">
                <Play size={24} fill="currentColor" />
              </span>
            </button>
          </div>
          {block.caption && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              {block.caption}
            </p>
          )}
          {viewerItem && (
            <MediaViewer
              item={viewerItem}
              onClose={() => setViewerItem(null)}
            />
          )}
        </div>
      );

    case "gallery":
      return (
        <div className="mb-4" data-testid="gallery-block">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {block.items?.map((item, i) => (
              <div
                key={i}
                className="border border-border bg-card cursor-zoom-in"
                onClick={() => setViewerItem({ ...item, type: "image" })}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-32 object-cover"
                  data-testid={`gallery-image-${i}`}
                />
                {item.caption && (
                  <p className="text-xs text-muted-foreground p-1 italic">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
          {viewerItem && (
            <MediaViewer
              item={viewerItem}
              onClose={() => setViewerItem(null)}
            />
          )}
        </div>
      );

    case "callout": {
      const variantStyles: Record<string, string> = {
        info: "bg-card border-border border-l-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.07)]",
        warning: "bg-card border-border border-l-amber-400 dark:border-amber-700",
        success: "bg-card border-border border-l-green-400 dark:border-green-700",
        error: "bg-card border-border border-l-red-400 dark:border-red-700",
      };
      const v = block.variant || "info";
      return (
        <div
          className={`border-l-4 px-4 py-3 mb-4 text-foreground ${variantStyles[v]}`}
          style={{ fontSize: "15px", lineHeight: "1.65" }}
          data-testid={`callout-${v}`}
        >
          {block.title && <p className="font-bold mb-1">{block.title}</p>}
          <div>{renderWikiMarkdown(block.content || "")}</div>
        </div>
      );
    }

    case "quote":
      return (
        <blockquote
          className="border-l-4 border-border pl-4 pr-2 py-2 mb-4 italic text-muted-foreground"
          data-testid="quote-block"
        >
          <p className="text-sm leading-relaxed">
            &ldquo;{block.content}&rdquo;
          </p>
          {block.author && (
            <cite className="text-xs not-italic block mt-1">
              — {block.author}
            </cite>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}
