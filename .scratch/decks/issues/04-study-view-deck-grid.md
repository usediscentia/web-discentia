# 04 — Study view: deck grid + deck cram

Status: ready-for-agent
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
