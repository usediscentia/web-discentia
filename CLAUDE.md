# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build (uses --webpack flag)
npm run lint       # ESLint v9
```

No test framework is configured. There are no test files.

Build may fail offline because Next.js fetches Google Fonts (`Inter`) during build.

## Architecture

Discentia is a **local-first study app** — an SPA built on Next.js 16 + React 19. Almost everything is `'use client'`. The only API routes that exist are `src/app/api/github/{copilot,device,token}` — a stateless proxy for the GitHub Copilot OAuth device flow. No user data is persisted server-side.

### Routing

There are **no Next.js file routes for app views**. `src/app/page.tsx` renders `AppShell`, which switches views based on Zustand's `activeView` state:

- `"chat"` | `"library"` | `"editor"` | `"study"` | `"stats"` | `"settings"`
- Navigation: `useAppStore.getState().setActiveView(view)`
- Mobile bottom nav (`MobileNav` inside `AppShell.tsx`) exposes: study, library, chat, stats, settings
- Cmd/Ctrl+K opens the global `CommandPalette` (`src/components/search/CommandPalette.tsx`)
- First-run `OnboardingFlow` is gated by `localStorage.discentia_onboarded`

### State Management (Zustand, split stores)

- `src/stores/app.store.ts` — UI nav: activeView, settingsOpen, commandPaletteOpen, sidebarCollapsed
- `src/stores/appearance.store.ts` — theme/appearance settings (applied via `AppearanceEffects`)
- `src/stores/chat.store.ts` — conversation state: activeConversationId, isStreaming, selectedLibraryIds
- `src/stores/dialog.store.ts` — global dialogs
- `src/stores/generation.store.ts` — multi-step `GenerationModal` state machine
- `src/stores/provider.store.ts` — AI config: selectedProvider, selectedModel, providerConfigs, ollama settings
- `src/stores/study.store.ts` — active study session state

### Data Layer (Dexie v4, IndexedDB)

- Schema defined in `src/services/storage/database.ts`
- Tables: conversations, messages, libraries, libraryItems, exercises, srsCards, activityEvents
- **Always use `getDB()` lazy singleton** (not a direct Dexie export)
- `src/services/storage/index.ts` — StorageService provides the abstraction layer for all CRUD and queries

### AI Service Layer

- `src/services/ai/` — provider abstraction with `AIServiceProvider` interface
- Implementations (all streaming, all shipped): `openai.provider.ts`, `anthropic.provider.ts`, `ollama.provider.ts`, `openrouter.provider.ts`, `github-copilot.provider.ts`
- Provider types defined in `src/types/ai.ts`
- API keys encrypted in localStorage via `src/lib/crypto.ts` (AES-GCM, key in IndexedDB keystore)
- GitHub Copilot uses OAuth device flow via `src/hooks/useGitHubDeviceFlow.ts` + `src/app/api/github/*` proxy
- Prompts: `src/services/ai/prompts/exercise.prompts.ts` (flashcard/quiz), `review.prompts.ts` (SRS evaluation)

### Key Directories

- `src/components/layout/` — `AppShell` (view router), `Sidebar`, `AppearanceEffects`
- `src/components/chat/` — chat UI, streaming, citations, exercise generation indicator
- `src/components/library/` — library CRUD, upload, item detail panel
- `src/components/document/` — `DocumentDetailPage` (preview, study history, exercise tile)
- `src/components/editor/` — Tiptap v3 markdown editor with autosave + custom code block
- `src/components/generation/` — multi-step `GenerationModal`: Configure → Generating → Review → Schedule → Success
- `src/components/study/` — `StudyView`, orbit layout, hint ladder, mistake analyzer, drag rating
- `src/components/exercises/` — per-type renderers (`*Morph`). UI today only routes flashcard/quiz; the rest are dormant code (see "Faltando" below)
- `src/components/stats/` — `StatsView`, donut cards
- `src/components/review/`, `src/components/dashboard/` — older components, **not currently routed** in `AppShell`
- `src/components/onboarding/` — first-run flow
- `src/components/search/` — `CommandPalette` (Cmd+K)
- `src/components/ui/` — shadcn/ui primitives (radix-ui + CVA)
- `src/hooks/` — `useChat`, `useLibrary`, `useGitHubDeviceFlow`
- `src/types/` — domain types split by feature (chat, library, exercise, srs, dashboard, ai)

## Conventions

- **Imports**: Use `@/*` path alias (maps to `./src/*`)
- **Icons**: `@lobehub/icons` for AI provider/model logos, `lucide-react` for UI icons
- **Animations**: `motion/react` (motion v12), NOT framer-motion
- **Styling**: Tailwind CSS v4 + `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)
- **UI components**: shadcn/ui pattern — radix primitives + CVA variants, use `data-slot` attributes
- **IDs**: Generated with `nanoid`

# Discentia — Contexto para Claude Code

## O que é o projeto

Discentia é um app de estudo local-first que fecha o ciclo:
**conteúdo → chat com IA → exercícios → revisão espaçada (SRS) → progresso**

Todo o fluxo roda no cliente (browser), sem backend próprio.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn + motion/react
- Zustand (estado global)
- Dexie sobre IndexedDB (persistência local)
- TipTap + tiptap-markdown (editor)
- Providers de IA: OpenAI, OpenRouter, Ollama, Anthropic, GitHub Copilot (streaming)

## Arquitetura macro

```
UI (React Views)
  → Zustand Stores
  → Hooks de orquestração
    → Camada de Providers IA (adapter pattern)
    → StorageService
      → Dexie (IndexedDB)
  → localStorage (configs, tema, flags)
  → IndexedDB keystore (chave AES-GCM para criptografar API keys)
```

## Arquivos-chave

| Área | Arquivo |
|---|---|
| Shell | `src/app/page.tsx`, `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `AppearanceEffects.tsx` |
| Stores | `src/stores/{app,appearance,chat,dialog,generation,provider,study}.store.ts` |
| Chat / IA | `src/hooks/useChat.ts`, `src/services/ai/*` |
| Parser exercício | `src/services/ai/parsers/exercise.parser.ts` |
| Prompts exercício | `src/services/ai/prompts/exercise.prompts.ts` |
| Prompts review | `src/services/ai/prompts/review.prompts.ts` |
| Citações | `src/lib/citations.ts` (word-overlap scoring, whitelist `allowedItemIds`) |
| Context/Chunks | `src/lib/tokens.ts` (InjectedChunk, buildContextSnippet) |
| PDF chunking | `src/lib/pdf-chunker.ts` (split por tamanho fixo — alvo de melhoria) |
| Distribuição SRS | `src/lib/distribute-cards.ts` |
| SM-2 | `src/lib/sm2.ts` |
| Aparência/Tema | `src/lib/appearance.ts`, `src/stores/appearance.store.ts` |
| Persistência | `src/services/storage/database.ts`, `src/services/storage/index.ts` |
| Biblioteca | `src/hooks/useLibrary.ts`, `src/components/library/LibraryView.tsx` |
| Documento | `src/components/document/DocumentDetailPage.tsx` |
| Modal de geração | `src/components/generation/GenerationModal.tsx` (+ Configure/Generating/Review/Schedule/Success steps) |
| Editor | `src/components/editor/EditorView.tsx`, `MarkdownEditor.tsx`, `useEditorAutosave.ts` |
| Estudo | `src/components/study/StudyView.tsx`, `TodayScreen.tsx`, `StudyCard.tsx` |
| Stats | `src/components/stats/StatsView.tsx` |
| Onboarding | `src/components/onboarding/OnboardingFlow.tsx` |
| Command Palette | `src/components/search/CommandPalette.tsx` |
| GitHub Copilot OAuth | `src/hooks/useGitHubDeviceFlow.ts`, `src/app/api/github/{copilot,device,token}` |
| Criptografia | `src/lib/crypto.ts` |

## Modelo de dados resumido

- `Conversation` → tem `libraryIds` vinculados
- `Message` → tem `exerciseId` opcional e `citations`
- `LibraryItem` → tipos: text, markdown, image, pdf, file
- `Exercise` → tipos ativos: flashcard, quiz | `sourceItemId?` link ao LibraryItem de origem
- `SRSCard` → ease factor, repetições, intervalo, próxima revisão (SM-2)
- `ActivityEvent` → srs_review, exercise_completed

## Estado atual do app

Fluxo principal funcional e sólido:
**conteúdo → chat com citações → geração de flashcards (chat ou modal multi-step) → revisão SRS com avaliação IA → progresso**

### ✅ Pronto e em uso

**Core / Shell**
- 6 views roteadas: chat, library, editor, study, stats, settings
- Mobile bottom nav + Cmd/Ctrl+K command palette
- Onboarding inicial gateado por `localStorage.discentia_onboarded`
- Tema/aparência configurável (`appearance.store` + `AppearanceEffects`)

**Conteúdo / Biblioteca**
- Upload e visualização: text, markdown, image, pdf, file
- PDF chunking via `pdf-chunker.ts` (split por tamanho fixo)
- `DocumentDetailPage` com preview, histórico de estudo e tile de exercícios
- Editor TipTap v3 com autosave, toolbar e code block customizado

**Chat / IA**
- 5 providers em produção, todos com streaming: OpenAI, Anthropic, Ollama, OpenRouter, GitHub Copilot
- GitHub Copilot via OAuth device flow (`/api/github/*` + `useGitHubDeviceFlow`)
- API keys cifradas em localStorage (AES-GCM)
- Citações automáticas por word-overlap (`citations.ts`) com whitelist `allowedItemIds`
- Injeção de contexto via `tokens.ts`
- Geração de exercício direto do chat com indicador

**Geração de exercícios (modal multi-step)**
- Fluxo Configure → Generating → Review (cards editáveis) → Schedule → Success
- Distribuição automática na fila SRS via `distribute-cards.ts`

**SRS / Estudo**
- Algoritmo SM-2 (`sm2.ts`)
- `StudyView` com orbit layout, dots, rail, `TodayScreen`
- Drag rating slider + botões de confiança
- Avaliação por IA: correct/partial/incorrect + keyMissing
- Hint ladder e mistake analyzer
- Bulk approve modal

**Stats**
- Heatmap, forecast, breakdown por library, donut cards

### 🚧 Faltando / próximos passos

1. **Chunking semântico de PDF** — substituir split por tamanho por split por parágrafo/heading (alavanca grande de qualidade das citações)
2. **UI/UX polish** — varredura visual completa do fluxo
3. **Testes manuais end-to-end** com PDFs reais
4. **Definir destino dos exercícios não-flashcard/quiz** — `ExerciseType` em `src/types/exercise.ts` ainda exporta `crossword, connections, sprint, fillgap, bossfight` e há `*Morph.tsx` correspondentes em `components/exercises/`, mas nada está roteado na UI. Cortar de vez ou reativar.
5. **Componentes órfãos** — `src/components/review/*` e `src/components/dashboard/*` não estão roteados em `AppShell` (substituídos por `study/` e `stats/`). Decidir remoção ou reuso.

### 💡 Melhorias possíveis no código

- Alinhar `ExerciseType` ao que realmente é usado e remover morphs órfãos (ou reativá-los)
- Possível sobreposição entre `dialog.store` e flags em `app.store` (`settingsOpen`, `commandPaletteOpen`) — consolidar em um lugar só
- Auditoria: garantir que toda escrita Dexie passa por `StorageService` (regra já existente)
- Documentar `/api/github/*` como única exceção ao "no backend" e que não persiste nada
- Adicionar Vitest para regressões mínimas em lógica pura: `sm2.ts`, `pdf-chunker.ts`, `citations.ts`, `exercise.parser.ts`

### 🔒 Decisões consolidadas — não revisitar

- **Local-first**: dados do usuário ficam no browser. Única exceção: `/api/github/*` (proxy stateless de OAuth)
- **Provider adapter pattern** para troca de IA sem mexer na UI
- **StorageService único**: toda UI passa por ele, nunca acessa Dexie direto
- **Citações com whitelist `allowedItemIds`**: nunca referenciar fontes não injetadas
- **Sem sync multi-dispositivo**
- **Foco desktop**, mobile como secundário
- **Profundidade antes de largura**: não adicionar features novas até o ciclo core estar polido
- **Exercícios em uso hoje**: flashcard e quiz

## Posicionamento (contexto de produto)

**NotebookLM** = ferramenta de consulta de documentos  
**Discentia** = ferramenta de aprendizado de longo prazo

O diferencial real é o ciclo completo: você não só consulta o conteúdo, você aprende e retém com revisão espaçada e exercícios. Tudo local, sem mandar dados para servidor externo.

Público com maior potencial: estudantes de concurso, medicina, direito — pessoas com material sensível e necessidade real de retenção de longo prazo.

## Github 
- Branch principal: `main`
- Commits: Conventional Commits (feat, fix, refactor, docs, style,
chore)
- Pull Requests: revisão obrigatória, foco em clareza e descrição do que/por quê
- Issues: usar para bugs, melhorias, tarefas — linkar a PRs
- README.md: guia de contribuição, visão geral do projeto, setup local
- CLAUDE.md: contexto específico para Claude Code, arquitetura, decisões, foco atual
- .gitignore: ignorar node_modules, .env, dist, build, .next, coverage, etc.
- Branching: usar branches de feature (`feature/flashcard-prompt-improvement`), evitar trabalhar direto no main
- Releases: usar tags semânticas (v1.0.0) para marcar releases
- Nao adicionar co-autores ou colaboradores externos sem revisão prévia (foco em manter código limpo e consistente)

## Design
- Foco em visual clean, minimalista, inspirado em Notion e Obsidian
- Paleta de cores neutra, com destaque para cores suaves em botões e interações
- Tipografia clara e legível (Inter)
- UI responsiva, mas foco principal em desktop (a experiência mobile é secundária por enquanto
- motion/react (v12) para animações suaves, mas sem exageros — o foco é funcionalidade e clareza, não efeitos visuais
- Usar ícones de forma funcional para guiar o usuário, não apenas decorativa (ex: ícones de IA, status de mensagens, tipos de exercício)
- UX deve ser intuitiva, com fluxo claro e feedback consistente — evitar confusão, especialmente em partes críticas como geração de flashcards e revisão SRS
- Evitar sobrecarregar o usuário com opções — foco em simplicidade e clareza, especialmente para usuários não técnicos ou menos experientes com tecnologia
- Design no estilo Apple: simplicidade, elegância, foco na experiência do usuário, sem sacrificar funcionalidade.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


## Caveman
- Always use caveman skill for every type off output, even if not explicitly requested. It helps ensure clarity and simplicity.
- Use the skill in full mode.
