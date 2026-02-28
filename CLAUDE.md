# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
you have to wright japanese

## Project Overview

A blog application built as a pnpm monorepo with two workspaces:
- `packages/frontend` — React SPA (Vite, React Router v7, Tailwind CSS v4, shadcn/ui)
- `packages/backend` — Hono API on Cloudflare Workers

## Commands

### Development
```bash
# Docker (recommended)
docker compose up

# Local
pnpm install
pnpm --filter frontend dev          # Frontend: http://localhost:5173
pnpm --filter @my-blog/backend dev  # Backend:  http://localhost:8787
```

### Frontend (run from packages/frontend)
```bash
pnpm test:unit          # Vitest unit tests
pnpm test:e2e           # Playwright E2E tests
pnpm test:storybook     # Storybook component tests
pnpm test               # All Vitest tests (watch mode)
pnpm lint               # Biome check
pnpm format             # Biome auto-fix
pnpm storybook          # Storybook: http://localhost:6006
```

### Backend (run from packages/backend)
```bash
pnpm deploy             # Build and deploy to Cloudflare Workers
pnpm cf-typegen         # Generate Cloudflare bindings types
```

## Architecture

### Type-Safe RPC (Key Pattern)
Backend exports `AppType` from route definitions. Frontend imports this type and uses Hono RPC client (`hc<AppType>()`) for fully type-safe API calls — no manual API type duplication. The frontend depends on `@my-blog/backend` via `workspace:*` for type imports only.

### Frontend Structure (`packages/frontend/src/`)
- `app/` — App component and routing (React Router v7, BrowserRouter)
- `components/ui/` — shadcn/ui components (New York style)
- `core/` — Business logic (`lib/`, `ports/`, `types/`)
- `features/` — Feature modules
- `lib/` — UI utilities (`cn` helper using clsx + tailwind-merge)
- `mocks/` — MSW handlers for API mocking in tests

### Backend Structure (`packages/backend/src/`)
- Single `index.tsx` entry point exporting Hono app and `AppType`
- CORS enabled for all routes
- Zod + @hono/zod-validator for request validation

## Code Style

Enforced by Biome (config at root `biome.json`):
- Single quotes, no semicolons, 2-space indent
- Path alias: `@/*` → `./src/*` (frontend only)
- Commit messages and code comments are in Japanese
