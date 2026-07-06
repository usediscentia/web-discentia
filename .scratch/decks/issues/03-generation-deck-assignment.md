# 03 — Generation assigns decks

Status: ready-for-human
Depends on: 02

## Scope

- `src/lib/distribute-cards.ts`: cards written with `deckId`.
- GenerationModal Schedule step (`src/components/generation/`): deck picker —
  default = new deck named from topic (or source document title), dropdown of existing decks.
  Keep it one control; no extra step in the flow.
- Chat-generated exercises (`useChat` → exercise path): same default (auto deck from topic),
  no picker in chat v1.
- `generation.store.ts`: carry selected/new deck through the state machine.

## Verify

- Generate via modal → cards land in chosen/new deck with correct due distribution.
- Generate via chat → cards land in auto-created deck.

## Comments

**2026-07-03 (agent):** Implemented.

- `distribute-cards.ts` unchanged — it only computes timestamps; the card *writes* happen in
  `GenerationModal.handleScheduleConfirm`, which now updates each saved card with
  `{ nextReviewDate, deckId }` in one pass.
- Modal flow stays two-phase: cards persist at Review save (Inbox fallback), then Schedule
  confirm moves them into the chosen/new deck. Preserves data if the browser dies mid-flow;
  closing the modal at Schedule uses the existing 14-day fallback and still assigns the deck.
- Deck picker = single Select in ScheduleStep ("Add to deck"): default option creates a new
  deck named from the AI exercise title (fallback: document title), rest are existing decks.
- Store carries `newDeckName` + `selectedDeckId` (null = create new); reset on `open()`.
- Chat path: `ExerciseRenderer` passes `exercise.title` to `BulkApproveModal`, which files
  cards via new `StorageService.getOrCreateDeckByName` — reuses an existing deck with the
  same name so repeated saves from the same topic don't spawn duplicate decks. No picker (v1).
- OpenUI flashcard save (`services/ai/openui/library.tsx`) untouched — still Inbox fallback.
