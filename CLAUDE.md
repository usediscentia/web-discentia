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

Discentia is a **local-first study app** — an SPA built on Next.js 16 + React 19. All components are `'use client'`. There is no server-side rendering or API routes.

### Routing

There are **no Next.js file routes**. `src/app/page.tsx` renders `AppShell`, which switches views based on Zustand's `activeView` state:

- `"chat"` | `"library"` | `"dashboard"` | `"review"` | `"settings"`
- Navigation happens by calling `useAppStore.getState().setActiveView(view)`

### State Management (Zustand, split stores)

- `src/stores/app.store.ts` — UI navigation: activeView, settingsOpen, commandPaletteOpen, sidebarCollapsed
- `src/stores/chat.store.ts` — conversation state: activeConversationId, isStreaming, selectedLibraryIds
- `src/stores/provider.store.ts` — AI config: selectedProvider, selectedModel, providerConfigs, ollama settings

### Data Layer (Dexie v4, IndexedDB)

- Schema defined in `src/services/storage/database.ts`
- Tables: conversations, messages, libraries, libraryItems, exercises, srsCards, activityEvents
- **Always use `getDB()` lazy singleton** (not a direct Dexie export)
- `src/services/storage/index.ts` — StorageService provides the abstraction layer for all CRUD and queries

### AI Service Layer

- `src/services/ai/` — provider abstraction with `AIServiceProvider` interface
- Implementations: `openai.provider.ts`, `ollama.provider.ts`, `openrouter.provider.ts`
- Provider types: OpenAI, Anthropic, Ollama, OpenRouter, GitHub Copilot (defined in `src/types/ai.ts`)
- API keys encrypted in localStorage via `src/lib/crypto.ts`
- Prompts: `src/services/ai/prompts/exercise.prompts.ts` (flashcard/quiz), `review.prompts.ts` (SRS evaluation)

### Key Directories

- `src/components/layout/` — AppShell (view router) and Sidebar
- `src/components/chat/` — Chat UI, message rendering, exercise generation
- `src/components/library/` — Library CRUD, file upload, content viewer
- `src/components/editor/` — Tiptap v3 markdown editor (no nav entry, accessed from Library)
- `src/components/review/` — SRS spaced-repetition review
- `src/components/dashboard/` — Dashboard with stats, heatmap, forecasts
- `src/components/ui/` — shadcn/ui primitives (radix-ui + CVA)
- `src/hooks/` — Custom hooks (useChat.ts is the chat orchestrator)
- `src/types/` — Domain types split by feature (chat, library, exercise, srs, dashboard, ai)

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
| Shell | `src/app/page.tsx`, `src/components/layout/AppShell.tsx` |
| Stores | `src/stores/app.store.ts`, `chat.store.ts`, `provider.store.ts` |
| Chat / IA | `src/hooks/useChat.ts`, `src/services/ai/*` |
| Parser exercício | `src/services/ai/parsers/exercise.parser.ts` |
| Prompts exercício | `src/services/ai/prompts/exercise.prompts.ts` |
| Prompts review | `src/services/ai/prompts/review.prompts.ts` |
| Citações | `src/lib/citations.ts` (auto-extraction via word-overlap) |
| Context/Chunks | `src/lib/tokens.ts` (InjectedChunk, buildContextSnippet) |
| Persistência | `src/services/storage/database.ts`, `src/services/storage/index.ts` |
| Biblioteca | `src/hooks/useLibrary.ts`, `src/components/library/LibraryView.tsx` |
| Flashcard Generator | `src/hooks/useFlashcardGenerator.ts`, `src/components/library/FlashcardGeneratorPanel.tsx` |
| Editor | `src/components/editor/EditorView.tsx`, `useEditorAutosave.ts` |
| Review / SRS | `src/components/review/ReviewView.tsx`, `src/lib/sm2.ts` |
| Dashboard | `src/components/dashboard/DashboardView.tsx` |
| Criptografia | `src/lib/crypto.ts` |

## Modelo de dados resumido

- `Conversation` → tem `libraryIds` vinculados
- `Message` → tem `exerciseId` opcional e `citations`
- `LibraryItem` → tipos: text, markdown, image, pdf, file
- `Exercise` → tipos ativos: flashcard, quiz | `sourceItemId?` link ao LibraryItem de origem
- `SRSCard` → ease factor, repetições, intervalo, próxima revisão (SM-2)
- `ActivityEvent` → srs_review, exercise_completed

## Estado atual do ciclo core

O fluxo principal está funcional e sólido:
**PDF → chat com citações → geração de flashcards (chat ou standalone) → revisão SRS com avaliação IA → progresso**

### Concluído
- ✅ Citações automáticas por chunks (word-overlap scoring, sem depender da IA)
- ✅ Flashcard prompt bifurcado (com/sem contexto), parser com JSON repair
- ✅ Standalone flashcard generator (Library → botão → prompt → cards editáveis → SRS)
- ✅ SRS source attribution (Exercise → SRSCard → ReviewEvaluation)
- ✅ Review SRS com avaliação por contexto (correct/partial/incorrect + keyMissing + progress badges)
- ✅ Corte de features: Gemini, Editor nav, sprint/fillgap/connections/bossfight/crossword

### Próximos passos
1. **Chunking do PDF** — melhorar divisão por parágrafos semânticos (hoje é por tamanho fixo)
2. **UI/UX polish** — visual refinement do fluxo completo
3. **Testes manuais end-to-end** — validar todo o ciclo com PDFs reais

## Decisões já tomadas — não questionar

- **Local-first**: sem backend próprio, dados do usuário ficam no browser
- **Provider adapter pattern**: troca de IA sem alterar fluxo de UI
- **StorageService único**: toda UI passa por ele, nunca acessa Dexie diretamente
- **Citações com whitelist de allowedItemIds**: evita referenciar fontes não injetadas no contexto

## O que NÃO fazer agora

- Não adicionar novos tipos de exercício (só flashcard + quiz)
- Não implementar sync multi-dispositivo
- Não adicionar features novas — profundidade antes de largura

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
