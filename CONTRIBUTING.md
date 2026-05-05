# Contributing to Discentia

## Before you start

Read `CLAUDE.md` — it has the architecture, key files, and the decisions already made. No need to re-derive the stack.

## Setup

```bash
git clone https://github.com/usediscentia/web-discentia.git
cd discentia
npm install
npm run dev
```

Open http://localhost:3000. No backend, no database to configure — everything runs in IndexedDB.

## Running checks

```bash
npm run lint     # ESLint v9
npm run build    # production build (requires internet for Google Fonts)
```

Both must pass before submitting a PR.

## Branching

```
feature/your-feature-name
fix/short-description
```

PRs target `main`. Keep branches short-lived.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(review): add confidence slider to SRS evaluation
fix(pdf): handle empty pages in chunker
refactor(chat): extract citation scoring to helper
docs(readme): update provider list
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`

## PR guidelines

- One concern per PR
- Describe **what changed and why**, not how
- Link to the relevant issue if one exists
- Screenshots for any UI change

## What's in scope

- Bug fixes
- Performance improvements to existing features
- PDF chunking improvements
- UI/UX polish on existing flows

## What's out of scope (for now)

- New exercise types (only flashcard + quiz)
- Multi-device sync
- New AI providers beyond the current set
- Backend / server-side features

See `CLAUDE.md` → "O que NÃO fazer agora" for the full list.

## Security

API keys and user data stay local. If you find a security issue, open a private GitHub Security Advisory rather than a public issue.
