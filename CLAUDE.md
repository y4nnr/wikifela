# FELA – Project Instructions for Claude Code

## Project Overview

FELA is a fan-made episode directory for the French TV show *Faites entrer l'accusé*. It is a full-stack web application with a single core feature: a minimalist search interface that lets users find episodes by typing any keyword, name, or phrase. The app should feel fast, clean, and focused — the search box is the product.

---

## Tech Stack

Claude should select and apply the best tools for this project. The following are recommended defaults:

- **Frontend**: Next.js (App Router) with Tailwind CSS — SSR is beneficial for SEO and fast initial loads
- **Backend**: Next.js API routes (no separate backend server needed at this scale)
- **Database**: PostgreSQL via [Neon](https://neon.tech) (serverless Postgres) or a local Docker instance for dev
- **ORM**: Prisma
- **Search**: PostgreSQL native full-text search using `tsvector` / `tsquery` with a `GIN` index — no external search engine needed at this stage
- **Language**: TypeScript throughout

If a better-suited tool exists for a specific task, Claude may propose it with a brief justification before implementing.

---

## Architecture

```
/
├── app/                  # Next.js App Router pages and layouts
│   ├── page.tsx          # Home page — search UI only
│   └── api/
│       ├── search/
│       │   └── route.ts  # Search API endpoint
│       └── admin/
│           └── refresh/
│               └── route.ts  # Scraper trigger (token-protected)
├── components/           # Reusable UI components
├── lib/
│   ├── db.ts             # Prisma client singleton
│   └── search.ts         # Full-text search query logic
├── prisma/
│   ├── schema.prisma     # DB schema
│   └── seed.ts           # Optional manual seed (fallback)
├── scripts/
│   ├── scrape.ts         # One-time scrape + DB upsert runner
│   └── scraper/
│       ├── wikipedia.ts  # Wikipedia fetching & parsing logic
│       └── transform.ts  # Raw data → Episode DB shape
├── public/               # Static assets
├── .env.local            # Environment variables (never commit)
└── CLAUDE.md             # This file
```

---

## Database Schema

The core table is `episodes`. The schema should include:

```prisma
model Episode {
  id            Int      @id @default(autoincrement())
  title         String                         // Episode title (case name from Wikipedia, e.g. "Affaire Omar Raddad")
  season        Int?                           // Season number if applicable
  episode       Int?                           // Episode number
  airDate       DateTime?                      // Original air date
  description   String?                        // Summary or synopsis (mapped from Wikipedia "observations" column)
  keywords      String[]                       // Curated keyword tags (Phase 2)
  wikiSummary   String?                        // Wikipedia article summary for the specific case (Phase 2 enrichment)
  searchVector  Unsupported("tsvector")?       // Generated full-text search vector

  @@index([searchVector], type: Gin)           // GIN index for fast FTS
}
```

### Field mapping from Wikipedia scraper

The Wikipedia tables contain columns that map to the schema as follows:
- Wikipedia "Affaire" / case name → `title`
- Wikipedia "Observations" / notes → `description`
- Wikipedia air date → `airDate`
- Wikipedia season/episode numbering → `season` / `episode`

The `transform.ts` module is responsible for this mapping.

### Search vector trigger

The `searchVector` column should be maintained via a PostgreSQL trigger. Since Prisma does not natively support triggers, this must be added as a **custom migration** (a raw SQL file in `prisma/migrations/`).

**Important**: All full-text search functions must use the `'french'` dictionary for proper French stemming and stopword handling (e.g. `to_tsvector('french', ...)`, `plainto_tsquery('french', ...)`).

The trigger SQL should look like:

```sql
CREATE OR REPLACE FUNCTION episode_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(NEW."wikiSummary", '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER episode_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Episode"
  FOR EACH ROW
  EXECUTE FUNCTION episode_search_vector_update();
```

Place this in a custom Prisma migration file (e.g. `prisma/migrations/<timestamp>_add_search_trigger/migration.sql`).

Search vector weights:
- `title` → weight A (highest)
- `keywords` → weight B
- `description` → weight C
- `wikiSummary` → weight D

---

## Search Behavior

- Search is triggered on input with a short debounce (300ms)
- The API receives a query string and runs a PostgreSQL full-text search using `plainto_tsquery('french', ...)` (handles natural language input gracefully with French stemming/stopwords, no need for users to know FTS syntax)
- Results are ranked by relevance (`ts_rank`)
- Results display: episode title, air date, a short highlighted excerpt showing where the match occurred
- If no results: a simple "Aucun épisode trouvé" message
- Empty query: show nothing (not all episodes)

---

## UI & Design

The interface must be **extremely minimalist**. The user should land on a page that is almost entirely white space with a single focused search input. Think: a search engine homepage, not a media app.

Guidelines:
- No navigation bar, no sidebar, no filters on the initial view
- Results appear below the search box, inline on the same page
- Each result card shows: episode title, season/episode number, air date, and a short relevant excerpt
- Typography should be elegant and readable — this is a French show, the UI should feel refined
- Mobile-first responsive layout
- Dark mode support is a nice-to-have, not required initially

---

## Data Strategy

Episode data is populated via an automated Wikipedia scraper (see section below). The schema and scraper should support two data tiers, populated progressively:

1. **Minimum viable** (scraped from Wikipedia): title (case name), season, episode number, air date, description (observations/outcome notes)
2. **Enriched** (future): curated keyword tags, `wikiSummary` per case (fetched from individual Wikipedia case articles)

Claude should design the schema and scraper to support both tiers from the start, even if only tier 1 data is available initially. The `transcript` field is intentionally excluded — there is no viable data source for transcripts at this time. It can be added to the schema later if a source becomes available.

---

## Wikipedia Scraper

### Source

The primary data source is the French Wikipedia page listing all FELA episodes:
> `https://fr.wikipedia.org/wiki/Liste_des_%C3%A9pisodes_de_Faites_entrer_l%27accus%C3%A9`

This page contains structured tables per season with: episode title (case name), air date, and observations (outcome/notes).

### Approach

Use the **Wikipedia REST API** — no raw HTML parsing needed:
- `https://fr.wikipedia.org/api/rest_v1/page/summary/{title}` for page summaries
- `https://fr.wikipedia.org/api/rest_v1/page/mobile-sections/{title}` for full structured content including tables

If the REST API does not return sufficient table data, fall back to fetching the raw wikitext via:
- `https://fr.wikipedia.org/w/api.php?action=parse&page=Liste_des_épisodes_de_Faites_entrer_l'accusé&prop=wikitext&format=json`

Then parse the wikitext tables using a lightweight wikitext parser or regex over the `{{!}}` / `|-` / `|` table syntax.

### Scraper Location

```
/
├── scripts/
│   ├── scrape.ts          # One-time scrape + DB upsert
│   └── scraper/
│       ├── wikipedia.ts   # Wikipedia fetching & parsing logic
│       └── transform.ts   # Raw data → Episode DB shape
```

Run with: `pnpm tsx scripts/scrape.ts`

### Behavior

- **Upsert logic**: match on `(season, episode)` — update existing rows, insert new ones. Never duplicate.
- **Rate limiting**: add a 500ms delay between API requests to be a polite client. Set a descriptive `User-Agent` header (e.g. `FELA-Scraper/1.0 (fan project; contact@example.com)`) per Wikipedia API etiquette
- **Dry run mode**: support a `--dry-run` flag that logs parsed episodes without writing to the DB
- **Progress logging**: log each season and episode as it is processed
- **Error resilience**: if one episode fails to parse, log the error and continue — do not abort the entire run

### Scheduled Refresh

In addition to the one-time script, implement a scheduled job to keep data fresh:

- Use a Next.js API route `/api/admin/refresh` protected by a secret token (`SCRAPER_SECRET` env var)
- This route triggers the same scrape + upsert logic on demand
- For automated scheduling, document how to set up a cron job (e.g. via a free cron service or Vercel Cron) to call this endpoint weekly
- The job should log a summary: episodes added, updated, unchanged, and any errors

### Enrichment (Phase 2)

Once the base episode list is populated, a second enrichment pass can:
- For each episode, search Wikipedia for the specific criminal case (e.g. `Affaire Omar Raddad`) and fetch its article summary
- Store the fetched summary in the `wikiSummary` field (already in the schema)
- This dramatically improves full-text search quality without needing transcripts

---

## Development Workflow

- Use `pnpm` as the package manager
- `.env.local` for all secrets and connection strings — never hardcode credentials
- All database migrations via Prisma Migrate
- Seed data goes in `prisma/seed.ts`, run with `pnpm prisma db seed`
- The app should run locally with `pnpm dev` with no additional setup beyond `.env.local`

---

## Coding Conventions

- TypeScript strict mode enabled
- No `any` types — use proper typing throughout
- Async/await preferred over `.then()` chains
- Keep components small and single-purpose
- API route handlers should validate input before querying the DB
- Errors should be caught and return meaningful HTTP status codes (400 for bad input, 500 for server errors)
- Comments in English, but all user-facing strings in French
- The app targets French users exclusively — all UI text, error messages, placeholders, empty states, and meta tags must be in French
- Set `lang="fr"` on the HTML element and use `fr` as the locale throughout Next.js config

---

## Scalability Notes (for future reference, not immediate implementation)

- OpenSearch or Elasticsearch can replace or augment Postgres FTS when the dataset grows significantly or when fuzzy matching / typo tolerance becomes important
- Wikipedia article enrichment per case (Phase 2 scraper pass) will dramatically improve search quality without needing transcripts
- Consider adding filters (by season, year, crime type) as a Phase 2 feature

---

## Deployment

Target deployment platform: **Vercel** (free tier is sufficient for this project).

Key considerations:
- Vercel serverless functions have a **10-second timeout** on the free tier (60s on Pro). The scraper endpoint `/api/admin/refresh` may need to process many episodes — consider chunking or running the full scrape via `pnpm tsx scripts/scrape.ts` locally/in CI instead of through the API route
- Use **Vercel Cron Jobs** (`vercel.json` cron config) to schedule weekly refreshes
- Environment variables (`DATABASE_URL`, `SCRAPER_SECRET`) are configured in the Vercel dashboard, not committed to the repo
- Neon's serverless Postgres driver works well with Vercel's edge/serverless runtime

---

## Testing

For v1, testing is minimal but focused:
- **Search query builder** (`lib/search.ts`): unit tests to verify correct `tsquery` generation from various inputs (accented characters, empty strings, special characters)
- **Scraper transform** (`scripts/scraper/transform.ts`): unit tests to verify Wikipedia table data maps correctly to the Episode shape
- **API routes**: basic integration tests for `/api/search` (valid query, empty query, malformed input)
- Use `vitest` as the test runner (lightweight, fast, good TypeScript support)
- No need for E2E or component tests in v1

---

## What Claude Should NOT Do

- Do not add unnecessary features (user accounts, favorites, ratings) — keep scope tight
- Do not over-engineer the search layer prematurely — Postgres FTS is the right tool for now
- Do not use a UI component library (shadcn, MUI, etc.) — keep the UI hand-crafted and minimal
- Do not commit `.env.local` or any secrets
- Do not skip TypeScript types to save time
