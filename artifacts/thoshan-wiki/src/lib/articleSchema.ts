import { z } from "zod";

const infoboxFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const infoboxSchema = z.object({
  title: z.string(),
  image: z.string().optional(),
  imageCaption: z.string().optional(),
  fields: z.array(infoboxFieldSchema),
});

const contentBlockSchema = z
  .object({
    type: z.enum([
      "text",
      "image",
      "table",
      "video",
      "embed",
      "gallery",
      "callout",
      "quote",
      "banner",
    ]),
    content: z.string().optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    columns: z.array(z.string()).optional(),
    rows: z.array(z.record(z.string())).optional(),
    variant: z.enum(["info", "warning", "success", "error"]).optional(),
    title: z.string().optional(),
    author: z.string().optional(),
    items: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

type SectionInput = {
  id: string;
  title: string;
  level: number;
  content: z.infer<typeof contentBlockSchema>[];
  subsections?: SectionInput[];
  collapsible?: boolean;
};

const sectionSchema: z.ZodType<SectionInput> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    level: z.number(),
    content: z.array(contentBlockSchema),
    subsections: z.array(sectionSchema).optional(),
    collapsible: z.boolean().optional(),
  }),
);

export const articleIndexEntrySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    category: z.string(),
    excerpt: z.string(),
    thumbnail: z.string().optional(),
    hiddenFromSearch: z.boolean().optional(),
    isSubArticle: z.boolean().optional(),
    parentArticle: z.string().optional(),
  })
  .passthrough();

export const articleIndexSchema = z.object({
  articles: z.array(articleIndexEntrySchema),
});

export const articleSchema = z
  .object({
    metadata: z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      category: z.string(),
      lastEdited: z.string(),
      editCount: z.number(),
      views: z.number(),
    }),
    infobox: infoboxSchema.optional(),
    lead: z.string(),
    sections: z.array(sectionSchema),
    references: z.array(z.unknown()).default([]),
    relatedArticles: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    editHistory: z.array(z.unknown()).default([]),
    perspectives: z
      .array(z.object({ title: z.string(), content: z.string() }))
      .optional(),
    suggestedImprovements: z.array(z.string()).optional(),
    githubButton: z
      .object({
        text: z.string(),
        url: z.string(),
        title: z.string(),
      })
      .optional(),
    deployedUrl: z.string().optional(),
    heroVideo: z.string().optional(),
    heroPoster: z.string().optional(),
    heroImage: z.string().optional(),
    resources: z.unknown().optional(),
    subArticles: z
      .array(
        z.object({
          slug: z.string(),
          title: z.string(),
          excerpt: z.string(),
        }),
      )
      .optional(),
    parentArticle: z.string().optional(),
    isSubArticle: z.boolean().optional(),
    hiddenFromSearch: z.boolean().optional(),
  })
  .passthrough();
