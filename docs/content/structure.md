# Content Structure

## Article Locations

All wiki articles live in `artifacts/thoshan-wiki/public/`:

```
public/
├── articles/
│   ├── index.json          # Article index with metadata
│   └── <slug>/
│       ├── index.json      # Article metadata (sections, links)
│       ├── content.html    # Rendered article content
│       └── assets/         # Images, diagrams, etc.
```

## Index Format

`articles/index.json` contains:

```json
{
  "articles": [
    {
      "id": "unique-id",
      "slug": "url-slug",
      "title": "Article Title",
      "category": "Category",
      "tags": ["tag1", "tag2"],
      "excerpt": "Short description"
    }
  ]
}
```
