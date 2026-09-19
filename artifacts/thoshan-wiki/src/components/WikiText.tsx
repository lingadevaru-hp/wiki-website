import type { ReactNode } from "react";
import { Link } from "wouter";
import { parseWikiLink } from "../lib/wikiMarkup";

export function renderWikiInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = text.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/);
  parts.forEach((part, i) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const { slug, text: display } = parseWikiLink(part.slice(2, -2));
      nodes.push(
        <Link
          key={i}
          href={`/wiki/${slug}`}
          className="text-accent hover:underline"
        >
          {display}
        </Link>,
      );
    } else if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.match(/^\[.*?\]\(.*?\)$/)) {
      const m = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (m) {
        nodes.push(
          <a
            key={i}
            href={m[2]}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {m[1]}
          </a>,
        );
      }
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}

export function renderWikiMarkdown(content: string): ReactNode {
  const lines = content.split("\n");
  const result: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      result.push(
        <h3
          key={i}
          className="mt-4 mb-2 font-sans font-semibold tracking-tight text-foreground"
          style={{ fontSize: "1.05rem" }}
        >
          {line.slice(4)}
        </h3>,
      );
      i++;
    } else if (line.startsWith("## ")) {
      result.push(
        <h2
          key={i}
          className="mt-5 mb-2 border-b border-border pb-1 font-sans font-semibold tracking-tight text-foreground"
          style={{ fontSize: "1.25rem" }}
        >
          {line.slice(3)}
        </h2>,
      );
      i++;
    } else if (line.startsWith("# ")) {
      result.push(
        <h1
          key={i}
          className="mt-5 mb-2 font-sans font-semibold tracking-tight text-foreground"
          style={{ fontSize: "1.875rem" }}
        >
          {line.slice(2)}
        </h1>,
      );
      i++;
    } else if (line.trim() === "") {
      i++;
    } else {
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("#")
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      const text = paraLines.join(" ");
      result.push(
        <p
          key={i}
          className="mb-4 text-foreground"
          style={{ fontSize: "15px", lineHeight: "1.65" }}
        >
          {renderWikiInline(text)}
        </p>,
      );
    }
  }

  return <>{result}</>;
}
