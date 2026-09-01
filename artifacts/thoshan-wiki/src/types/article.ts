export interface ArticleMetadata {
  id: string;
  title: string;
  slug: string;
  category: string;
  lastEdited: string;
  editCount: number;
  views: number;
}

export interface InfoboxField {
  label: string;
  value: string;
}

export interface Infobox {
  title: string;
  image?: string;
  imageCaption?: string;
  fields: InfoboxField[];
}

export interface ContentBlock {
  type:
    | "text"
    | "image"
    | "table"
    | "video"
    | "gallery"
    | "callout"
    | "quote"
    | "banner";
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: string;
  height?: string;
  columns?: string[];
  rows?: Record<string, string>[];
  variant?: "info" | "warning" | "success" | "error";
  title?: string;
  author?: string;
  items?: { src: string; alt: string; caption?: string }[];
}

export interface Section {
  id: string;
  title: string;
  level: number;
  content: ContentBlock[];
  subsections?: Section[];
  collapsible?: boolean;
}

export interface Reference {
  id: number;
  title: string;
  url?: string;
  author?: string;
  year?: number;
  publisher?: string;
}

export interface EditHistory {
  date: string;
  editor: string;
  summary: string;
  changeType: "major" | "minor" | "new";
}

export interface ResourceItem {
  url: string;
  title: string;
  description: string;
}

export interface ResourceCategory {
  name: string;
  items: ResourceItem[];
}

export interface Resources {
  title: string;
  description: string;
  categories: ResourceCategory[];
}

export interface GitHubButton {
  text: string;
  url: string;
  title: string;
}

export interface SubArticle {
  slug: string;
  title: string;
  excerpt: string;
}

export interface Article {
  metadata: ArticleMetadata;
  infobox?: Infobox;
  lead: string;
  sections: Section[];
  references: Reference[];
  relatedArticles: string[];
  categories: string[];
  editHistory: EditHistory[];
  perspectives?: { title: string; content: string }[];
  suggestedImprovements?: string[];
  githubButton?: GitHubButton;
  deployedUrl?: string;
  resources?: Resources;
  subArticles?: SubArticle[];
  parentArticle?: string;
  isSubArticle?: boolean;
  hiddenFromSearch?: boolean;
}

export interface ArticleIndexEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  thumbnail?: string;
  hiddenFromSearch?: boolean;
  isSubArticle?: boolean;
  parentArticle?: string;
}

export interface ArticleIndex {
  articles: ArticleIndexEntry[];
}
