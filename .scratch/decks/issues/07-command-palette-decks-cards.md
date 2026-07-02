# 07 — CommandPalette: decks + cards sections

Status: ready-for-agent
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
