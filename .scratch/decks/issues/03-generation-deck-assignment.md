# 03 — Generation assigns decks

Status: ready-for-agent
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
