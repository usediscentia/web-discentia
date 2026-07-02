# 05 — Deck detail: card browser + CRUD

Status: ready-for-agent
Depends on: 04

## Scope

New deck detail surface inside Study view (`src/components/study/DeckDetail.tsx` or similar):

- Card list with search box (uses `searchCards`, quoted exact-match works).
- Inline edit front/back.
- "Add card" form: front/back, joins SRS queue as new card due now.
- Move card to another deck (deck picker).
- Delete card (single confirm or undo toast).
- Deck actions: rename; delete → confirm dialog stating card count, cards deleted with deck.
- Header stats: card count, due count, weak score.

## Verify

- Search finds by front/back; `"exact phrase"` narrows correctly.
- Manual card appears in today's queue; edits persist; move updates counts both decks.
- Deck delete removes deck + cards, confirm shows correct count.

## Comments
