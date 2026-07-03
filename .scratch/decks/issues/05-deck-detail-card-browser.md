# 05 — Deck detail: card browser + CRUD

Status: ready-for-human
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

**2026-07-03 (agent):** Implemented as `src/components/study/DeckDetail.tsx`, rendered inside
StudyView's "today" phase via local `detailDeckId` state. Deck card click now opens detail
(cram moved to explicit "Estudar" hover button on the tile; empty decks are clickable too, so
they're no longer a dead end). Includes: search (token + quoted exact via `searchCards`),
add-card form (joins queue due now), inline edit, move via deck `<select>` in edit mode,
card delete + deck delete with `window.confirm` (matches Sidebar/LibraryView pattern; deck
confirm states card count). On back, StudyView re-runs `initSession()` so the Today queue
reflects added/deleted cards. Verified end-to-end in headless Chrome against the running app:
all Verify items pass, edits survive full reload. Note: sidebar due badge doesn't refresh
after deck delete (pre-existing staleness, not introduced here).
