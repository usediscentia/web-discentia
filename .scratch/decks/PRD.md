# PRD: Decks — first-class card containers

Status: ready-for-agent
Date: 2026-07-02

## Problem

Cards are invisible today — hidden behind documents, no browsing, no manual curation.
Users return frequently to their card collections (not their files), but the app has no
concept of a deck. Two community feature requests drove this:

1. **Advanced browsing & search** — tabbed browsing, clickable organization, exact-match search
2. **Weak spot analytics** — surface where the user struggles most, targeted review

Grill session (2026-07-01/02) resolved the design tree. Decisions below are final for v1.

## Decisions (locked — do not revisit)

1. **Decks are a first-class entity living in the Study view.** Library stays files/sources
   (feeds chat context + citations). Tags are OUT of scope for v1 — decks are the only
   grouping. Revisit tags only if deck-level weak spots prove too coarse.
2. **Card model:** `SRSCard` gains required `deckId`. `libraryItemId` stays as provenance.
   Migration (Dexie v6): one deck per distinct `libraryItemId`, orphan cards → "Inbox" deck.
3. **Deck creation:** auto per generation (Schedule step defaults to a new deck named from
   the topic, with a picker for existing decks) + manual "New deck". Chat-generated cards
   follow the same default.
4. **Cram = real review.** Deck-scoped study reuses the existing `studyFilter` pipeline via
   a new `studyFilterDeckId`. SM-2 state updates normally. Accepted risk: frequent cramming
   inflates intervals.
5. **Search:** new `searchCards` (front/back substring, deck filter). Shared query parser
   with `"quoted phrase"` exact-match in `src/lib/search-query.ts`, wired into both
   `searchCards` and `searchLibraryItems`. CommandPalette gains decks + cards sections.
6. **Weak spots:** `getWeakSpots` regroups by deck (was: by libraryItem). Surfaces in
   StatsView widget + weak badge on deck cards. Click → cram session of that deck's
   *weakest* cards (sorted by easeFactor + lapses), not the whole deck.
7. **Layout:** StudyView = Today hero on top (daily loop stays primary) + deck grid below.
   Deck click → deck detail (card browser, stats, actions). No tabs, one scroll.
8. **CRUD:** add card manually (front/back form, joins SRS queue as new card), edit inline,
   move between decks, delete card. Delete deck = cards die with it — confirm dialog
   showing card count. Deck owns cards.

## Current-state anchors (verified 2026-07-01)

- Schema: `src/services/storage/database.ts` (Dexie v5, `srsCards: id, libraryItemId, nextReviewDate`)
- Weak spots: `StorageService.getWeakSpots` (`src/services/storage/index.ts:865`), ease 0.7 + lapses 0.3
- Widget: `src/components/dashboard/WeakSpotsWidget.tsx` → `setStudyFilterItemId` → StudyView
- Study filter: `app.store.ts` `studyFilterItemId`, consumed in `StudyView.tsx:36-38`
- Search: `StorageService.searchLibraryItems` (`index.ts:308`), token scoring, no exact-match
- Distribution: `src/lib/distribute-cards.ts` (must write `deckId`)
- Generation: `src/components/generation/GenerationModal.tsx` Schedule step (deck picker goes here)

## Implementation issues

Ordered; each verifiable before the next starts. See `issues/`.

1. `01-schema-v6-decks.md` — decks table, deckId on cards, migration + tests
2. `02-storage-deck-layer.md` — deck CRUD, listDecksWithCounts, searchCards, query parser
3. `03-generation-deck-assignment.md` — Schedule step picker, distribute-cards, chat path
4. `04-study-view-deck-grid.md` — deck grid under Today hero, studyFilterDeckId, weakest-cards cram
5. `05-deck-detail-card-browser.md` — browser, inline edit, add card, move, delete, deck rename/delete
6. `06-weak-spots-by-deck.md` — getWeakSpots regroup, StatsView widget, deck badges
7. `07-command-palette-decks-cards.md` — palette sections

## Accepted risks

- Cram inflates SM-2 intervals if used heavily
- Deck-level weak spots coarser than concept-level (tags deferred)
- Deck delete is destructive (mitigated by confirm dialog with card count)
