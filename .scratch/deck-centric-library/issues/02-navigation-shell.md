# 02 — Shell de navegação

Status: ready-for-human
Depende de: 01

## Objetivo

Reduzir a navegação a 2 destinos (Decks, Study) e mover Settings para modal.

## Escopo

- `src/stores/app.store.ts`: `activeView: "decks" | "study"`; adicionar `selectedDeckId: string | null` + `openDeck(id)` / `closeDeck()`. Remover valores de view mortos (`chat`, `library`, `editor`, `stats`, `settings`).
- `src/components/layout/AppShell.tsx`: roteia `decks` (grid ou detail conforme `selectedDeckId`) e `study`. Remove cases antigos.
- `src/components/layout/Sidebar.tsx`: 2 itens + ícone/entrada de settings abrindo modal.
- `MobileNav` (dentro de `AppShell.tsx`): study, decks, settings.
- Settings: view atual vira conteúdo de modal controlado por `dialog.store` (consolida com `settingsOpen` do app.store — remover a flag duplicada).
- `src/components/search/CommandPalette.tsx`: comandos de navegação atualizados (ir para decks/study, abrir deck por nome, abrir settings).

## Critérios de aceite

- Build + lint passam.
- Navegar entre Decks e Study funciona; settings abre como modal de qualquer view.
- Cmd+K lista os novos destinos; nenhum comando aponta para view morta.
- Estado zero: app abre direto em Decks vazio sem erro.
