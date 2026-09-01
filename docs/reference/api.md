# API Reference

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:slug` | Get article by slug |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/:slug` | Update article |
| DELETE | `/api/articles/:slug` | Delete article |

## Response Format

```json
{
  "data": {},
  "error": null
}
```

## Error Format

```json
{
  "data": null,
  "error": {
    "code": 404,
    "message": "Article not found"
  }
}
```
