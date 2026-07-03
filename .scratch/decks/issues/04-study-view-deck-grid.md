# 04 — Study view: deck grid + deck cram

Status: ready-for-human
Depends on: 02, 03

## Scope

- `StudyView.tsx`: Today hero stays on top (daily loop primary); deck grid below.
- New `DeckCard` component (`src/components/study/`): name, card count, due count,
  weak badge (color scale like DifficultyBar), cram button.
- `app.store.ts`: add `studyFilterDeckId` alongside `studyFilterItemId`; StudyView session
  loader accepts deck filter. Cram = real SM-2 review (existing pipeline).
- Weakest-cards cram entry: given a deck, start session with its weakest cards
  (sort by easeFactor asc + lapses desc) — used by weak badge / issue 06.
- Deck click → deck detail (issue 05); until 05 lands, click can start cram.

## Verify

- Cram session shows only that deck's cards, ratings persist SM-2 state.
- Daily Today queue unchanged (global across decks).

## Comments

**2026-07-03 (agent):** Implemented.

- `StudyView.tsx` today phase: one scroll container — `TodayScreen` hero fills the
  viewport, `DeckGrid` sits below the fold. Empty deck list renders nothing, so the
  hero's empty states stay untouched.
- `DeckGrid` (`src/components/study/DeckGrid.tsx`): loads `listDecksWithCounts`,
  responsive 1/2/3-col grid. `DeckCard`: name, card count, due count (emerald),
  weak badge (flame pill, DifficultyBar color scale, shown when weakScore > 0.35).
- Cram: deck click / hover "Estudar" → whole-deck session; weak badge click →
  weakest-cards session. Both call `initSession` + `startReview` directly (grid
  lives inside StudyView, so app-store filter round-trip unnecessary) — straight
  into review, real SM-2 pipeline.
- `app.store.ts`: `studyFilterDeckId` + `studyFilterDeckWeakest` +
  `setStudyFilterDeck` for external entries (WeakSpotsWidget, issue 06).
  StudyView mount consumes deck filter first, then item filter.
- `study.store.ts`: `initSession(filter?: StudyFilter)` — `{ libraryItemId }`,
  `{ deckId }` or `{ deckId, weakestOnly }`. Deck name shows in the existing
  filter badge on TodayScreen.
- Storage: `getDueCardsByDeck` (due first, else whole deck, shuffled — mirrors
  item filter) and `getWeakestCardsByDeck` (ease asc, lapses desc, default
  limit 10). Sort extracted as pure `sortWeakestCards` in `lib/weak-score.ts`
  with vitest coverage.
- Verified: vitest 87 passing, tsc clean for touched files, build green.
  Manual check pending (human): cram shows only deck's cards, Today queue
  unchanged.
