# 02 — StorageService deck layer + card search + query parser

Status: done
Depends on: 01

## Scope

All via `StorageService` (`src/services/storage/index.ts`) — no direct Dexie access from UI (existing rule).

- Deck CRUD: `createDeck`, `renameDeck`, `deleteDeck` (deletes its cards in same transaction), `getDeck`, `listDecks`.
- `listDecksWithCounts()`: per deck — cardCount, dueCount (nextReviewDate <= now), weakScore (reuse ease 0.7 + lapses 0.3 formula from getWeakSpots).
- Card ops: `createCard` (manual, fresh SM-2 state, due now), `updateCard` (front/back), `moveCard(cardId, deckId)`, `deleteCard`.
- `searchCards({ query, deckId?, limit? })`: match front/back; exact-match for quoted phrases, token match otherwise.
- New `src/lib/search-query.ts`: parse query into `{ phrases: string[], tokens: string[] }` (`"spaced repetition" sm2` → phrases=["spaced repetition"], tokens=["sm2"]). Wire into `searchLibraryItems` scoring (phrase hit scores like current full-query hit).

## Verify

- Vitest: search-query parser (quotes, unbalanced quote, empty), searchCards matching, weak score math.
- `searchLibraryItems` existing behavior unchanged for unquoted queries.

## Comments

- 2026-07-03: Done. Parser in `src/lib/search-query.ts` (`parseSearchQuery` +
  `matchesParsedQuery`, AND semantics); weak formula extracted to
  `src/lib/weak-score.ts` `computeWeakScore` — `getWeakSpots` now reuses it.
  `listDecksWithCounts` uses same >=2-reviewed-cards gate as getWeakSpots
  (weakScore 0 below it). 19 new vitest cases.
- Deviation: `deleteSRSCard` renamed to `deleteCard` (single caller
  `study.store.ts` updated) instead of adding a duplicate. `updateSRSCard`
  kept as-is (SM-2 state writes); `updateCard` is the narrow front/back op.
- `searchCards` sorts newest-first, no relevance ranking (AND filter makes
  ranking mostly moot); limit default 50.
