# 01 — Modelo de dados + StorageService

Status: ready-for-human
Depende de: —

## Objetivo

Renomear o núcleo do modelo de dados para deck-centric e expor CRUD via StorageService. Começo limpo: bump de versão do Dexie, sem migração.

## Escopo

- `src/types/library.ts` → `src/types/deck.ts`:
  - `Library` → `Deck` (mesmos campos + `cardCount` no lugar de `itemCount`)
  - `LibraryItem` → `DeckSource` (`libraryId` → `deckId`; resto igual: content, preview, rawFile, metadata com chunks)
  - `LibraryItemType` → `DeckSourceType`, `ContentChunk` e `LibraryItemMetadata` → `DeckSourceMetadata` mantidos
- `src/types/srs.ts`: `SRSCard` ganha `deckId: string` obrigatório; `libraryItemId?` → `sourceId?`
- `src/types/chat.ts`: `Conversation.libraryIds: string[]` → `deckId: string`
- `src/services/storage/database.ts`: bump de versão do Dexie com tabelas `decks`, `deckSources`; índices `deckId` em `srsCards`, `deckSources`, `conversations`. Tabelas antigas (`libraries`, `libraryItems`) removidas do schema novo.
- `src/services/storage/index.ts`: StorageService com CRUD de decks/sources, queries por `deckId` (cards do deck, sources do deck, conversation do deck), manutenção de `cardCount`.
- Atualizar todos os call sites de tipos renomeados até `npm run build` passar (mudanças mecânicas de rename; mudanças de comportamento ficam nas issues seguintes).

## Critérios de aceite

- `npm run build` e `npm run lint` passam.
- Toda escrita Dexie continua passando por StorageService (regra existente).
- Vitest: testes de unidade para as novas queries do StorageService (cards por deck, cardCount consistente).
- App abre com DB vazio sem erro (estado zero — cada usuário novo começa aqui).

## Comments

**2026-07-07** — Implementado em `feature/deck-centric-library`, commits `b11dba0..8e2c317` (types → dexie v6 → storage CRUD/SRS/conversations/dashboard → lib sweep → hooks/stores → component sweep).

- Aceite verificado: `npm run build` + `npm run lint` verdes; vitest 65/65; Dexie writes só em `src/services/storage/*` (grep); zero-state boot via Playwright — DB v6 cria limpo (`decks`/`deckSources`, tabelas antigas removidas), shell renderiza sem console errors, views Biblioteca/Estudar abrem.
- Sentinelas `deckId: ""` com `// TODO(issue-07)` em 3 call sites de criação de cards: `BulkApproveModal.tsx`, `GenerationModal.tsx`, `openui/library.tsx` — issue 07 liga o contexto de deck real.
- Renames adiados por design: `Citation.libraryItemId/libraryId` → issue 06; strings `"library_item_added"` de ActivityEvent, `LIBRARY_COLORS`, `app.store.activeLibraryId`, copy de UI → issues 02/03/09.
- Pré-existentes (fora do escopo, já existiam no commit-base): erros `tsc` em `sm2.test.ts` (lastReviewDate null-check) e `exercise.parser.test.ts` (`.cards` em union); 4 warnings de lint.
