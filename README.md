# artistlog.ai

Artist portfolio and creative process vessel. Built on Cloudflare Workers with a single-page gallery UI.

## Stack

- **Runtime:** Cloudflare Worker (TypeScript)
- **Frontend:** Single HTML page — gallery white UI (#FAFAFA), black text, gold accent (#B8860B)
- **AI Chat:** DeepSeek API via SSE streaming

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Creative AI chat (SSE streaming via DeepSeek) |
| GET/POST | `/api/artworks` | List or create artworks |
| GET/POST | `/api/gallery` | List or create curated gallery collections |
| GET/POST | `/api/studio/journal` | List or create journal entries |
| GET/POST | `/api/exhibitions` | List or create exhibitions |
| GET/POST | `/api/commissions` | List or create commissions |

### Query Parameters

- `GET /api/artworks?status=available&tag=abstract&q=search`
- `GET /api/studio/journal?mood=inspired&artworkId=abc`
- `GET /api/exhibitions?status=current`
- `GET /api/commissions?status=in_progress`

## Domain Classes (`src/art/tracker.ts`)

- **ArtworkPortfolio** — CRUD + search for artworks (title, medium, dimensions, image refs, price, status, tags)
- **GalleryCurator** — Curated collections linking to artworks
- **StudioJournal** — Creative process notes with mood tracking
- **ExhibitionTracker** — Shows, galleries, dates with upcoming/current filters
- **CommissionManager** — Client work tracking with progress, budget, deadline, notes

## Setup

```bash
npm install
npx wrangler secret put DEEPSEEK_API_KEY
npm run dev      # local dev server
npm run deploy   # deploy to Cloudflare
```

## Project Structure

```
src/
  worker.ts          # Cloudflare Worker — all API routes
  art/
    tracker.ts       # Domain classes
public/
  app.html           # SPA — portfolio grid, journal, timeline, commissions, chat
```

## Author

Superinstance
