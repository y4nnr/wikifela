# DEPRECATED — 2026-04-27

The files `quiz-bank.json` and `portraits.json` in this directory are **no longer the source of truth**.

All quiz questions and portraits are now stored in PostgreSQL (tables `QuizQuestion` and `Portrait`).

These JSON files are kept for one release as a fallback. To regenerate them from the DB, run:

```
scripts/export-db-to-json.ts  (TODO)
```

Do not edit these files directly — changes will not be reflected in the application.
