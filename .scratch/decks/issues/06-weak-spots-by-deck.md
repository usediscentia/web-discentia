# 06 — Weak spots regrouped by deck

Status: ready-for-human
Depends on: 04

## Scope

- `StorageService.getWeakSpots` (`src/services/storage/index.ts:865`): group by `deckId`
  instead of `libraryItemId`. Same formula (ease 0.7 + lapses 0.3), same min-2-cards guard,
  top 5. `WeakSpot` type in `src/types/dashboard.ts` updated (deckId, deckName).
- `WeakSpotsWidget.tsx`: rows show decks; click → weakest-cards cram of that deck
  (entry from issue 04), not whole-deck cram.
- Deck grid badges (issue 04) read the same weak score from `listDecksWithCounts` —
  one formula, one place.

## Verify

- Widget lists weakest decks; click starts session with that deck's lowest-ease cards first.
- No references to `setStudyFilterItemId` remain in the widget.

## Comments

- 2026-07-03 (agent): Done. `getWeakSpots` now derives from `listDecksWithCounts`
  (single weakScore formula + min-2-reviewed gate live there). `WeakSpot` slimmed to
  deckId/deckName/cardCount/weakScore — old library fields had no other consumers.
  Widget click → `setStudyFilterDeck(id, true)` → weakest-cards cram.
  Verified: tsc/lint deltas zero vs base (5 pre-existing tsc errors in
  exercise.parser.test.ts, 1 pre-existing lint error in AppShell.tsx), weak-score
  tests 12/12 pass, no `setStudyFilterItemId` refs left in widget.
