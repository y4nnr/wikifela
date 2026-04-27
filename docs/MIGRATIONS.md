# Migrations

## JSON to DB migration (2026-04-27)

### What was migrated

- **Quiz questions**: 305 entries from `data/quiz-bank.json` → `QuizQuestion` table
- **Portraits**: 121 entries from `data/portraits.json` → `Portrait` table

### Field mapping

#### QuizQuestion
| JSON field | DB column |
|---|---|
| `question` | `question` |
| `answer` | `correctAnswer` |
| `options` | `wrongAnswers` (String[]) |
| `episodeId` | `episodeId` (nullable FK → Episode) |
| `difficulty` | `difficulty` (enum: facile/moyen/difficile) |

Questions with `episodeId: null` are general questions (not tied to an episode).
These get `category: "general"`.

#### Portrait
| JSON field | DB column |
|---|---|
| `id` | `episodeId` (FK → Episode, NOT the portrait PK) |
| `name` | `personName` |
| `file` | `imagePath` |
| `subtitle` | `subtitle` |
| `gender` | `gender` (enum: M/F) |

For episodes with multiple portraits, the first in JSON order is marked `isPrimary: true`.

### Pre-migration dump

Location: `/tmp/wikifela-pre-migration-20260427-105732.dump`

### How to re-run

```bash
pnpm tsx scripts/migrate-json-to-db.ts          # first run (tables must be empty)
pnpm tsx scripts/migrate-json-to-db.ts --force   # re-run (truncates tables first)
```

### How to roll back

```bash
# Restore from pre-migration dump
PGPASSWORD=fela_dev pg_restore -U fela -h localhost -d fela --clean /tmp/wikifela-pre-migration-20260427-105732.dump

# Then revert the Prisma migration
pnpm prisma migrate resolve --rolled-back 20260427085815_add_quiz_and_portraits
```
