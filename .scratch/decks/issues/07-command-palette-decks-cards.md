# 07 — CommandPalette: decks + cards sections

Status: ready-for-human
Depends on: 02, 05

## Scope

- `src/components/search/CommandPalette.tsx`: two new result sections —
  Decks (name match, `listDecks`) and Cards (`searchCards`, limit 5).
- Deck result → open deck detail. Card result → open deck detail scrolled/highlighted to card.
- Quoted exact-match works here too (shared parser).

## Verify

- Cmd+K "\"exact phrase\"" finds card containing phrase; selection navigates correctly.
- Existing items/conversations sections unchanged.

## Comments

- 2026-07-04: implemented (uncommitted). Deck detail navigation lifted to
  app.store (`deckDetailId`/`deckDetailCardId`, was local state in StudyView) so
  the palette can open it from any view; card result scrolls + flashes the card
  in DeckDetail for 2s. Deck matching uses shared `filterDecksByQuery`
  (search-query.ts, tested). Verified end-to-end with Playwright: quoted
  exact-match, deck/card navigation, keyboard nav, empty-query recents intact.
- 2026-07-04 (follow-up): palette navigation during an *active* study session
  now abandons it and opens the deck detail immediately (StudyView effect keyed
  on deckDetailId change — cram started from the detail keeps running since it
  changes phase, not deck). Verified: mid-session nav, cram survival,
  cross-deck card jump with flash.
