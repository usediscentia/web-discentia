# 01 — Schema v6: decks table + deckId on cards + migration

Status: done (2412af0, branch feature/decks)

## Scope

- `src/types/srs.ts`: new `Deck` interface (`id, name, createdAt, updatedAt`); `SRSCard` gains required `deckId: string`.
- `src/services/storage/database.ts`: Dexie v6 — new table `decks: "id, updatedAt"`, `srsCards` index becomes `"id, deckId, libraryItemId, nextReviewDate, [nextReviewDate+id]"`.
- Migration (v6 `.upgrade()`):
  - For each distinct `libraryItemId` among existing cards → create deck named after the library item's title.
  - Cards with no `libraryItemId` → single "Inbox" deck (create only if orphans exist).
  - Stamp `deckId` on every card.

## Verify

- Vitest: migration logic extracted to a pure function and unit-tested (grouping, orphan → Inbox, naming fallback when item missing).
- Manual: existing local DB upgrades without data loss; every card has a deckId.

## Comments

- 2026-07-02: Done. `planDeckMigration` pure fn in `src/services/storage/deck-migration.ts`,
  6 vitest cases pass. Inbox uses fixed id `"inbox"` (constant `INBOX_DECK_ID`).
- Bridge added beyond scope (needed for compile): `CreateSRSCardInput.deckId?` +
  `createSRSCards` falls back to Inbox (creates it if missing). Issue 03 replaces callers
  with real deck ids.
- Manual verify pending: open app with existing local DB, confirm upgrade + every card has deckId.
