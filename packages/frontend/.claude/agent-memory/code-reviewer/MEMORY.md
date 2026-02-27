# Code Reviewer Memory - Frontend Package

## Project Structure
- Monorepo: `/Users/kuribo/Documents/coding/blog/` with `packages/frontend` and `packages/backend`
- Frontend: React 19 + Vite 8 (beta) + TypeScript 5.9
- Backend: Hono on Cloudflare Workers (backend files are `.tsx`, not `.ts`)
- Biome config is at monorepo root (`/biome.json`), not in frontend package
- `tsconfig.base.json` at monorepo root with strict settings including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`

## Tech Stack & Conventions
- Tailwind CSS v4 (using `@tailwindcss/vite` plugin, CSS-first config in `src/index.css`)
- shadcn/ui (new-york style, `components.json` configured)
- Storybook 10 with vitest addon for browser-mode story testing
- Vitest 4 with two projects: `unit` and `storybook`
- MSW v2 for API mocking (node setup in `src/mocks/server.ts`)
- Playwright for e2e tests
- Path alias: `@/` -> `./src/`
- Biome: single quotes, no semicolons, space indent (2)
- Japanese comments and test descriptions are common

## Key File Paths
- `/packages/frontend/src/main.tsx` - App entry point with React Router
- `/packages/frontend/src/app/App.tsx` - Main App component with Hono RPC client
- `/packages/frontend/src/components/ui/` - shadcn/ui components
- `/packages/frontend/src/stories/` - Storybook demo components (wrapper pattern around shadcn)
- `/packages/frontend/src/core/lib/` - Core utility functions
- `/packages/frontend/src/mocks/` - MSW handlers and server setup

## Known Issues (as of 2026-02-28)
- `vitest.shims.d.ts` not included in any tsconfig (root-level, but tsconfig.app.json only includes `src/`)
- `src/stories/assets/avif-test-image.avif` exists but is unused
- `lucide-react` in dependencies but not imported anywhere
- `dist/` directory not tracked by git (correctly gitignored)
- CI workflow only runs Playwright e2e tests, not unit/storybook tests
- Backend file is `index.tsx` but frontend imports as `@my-blog/backend/src/index` (works due to resolution)
- No `vite-env.d.ts` file (relies on `types: ["vite/client"]` in tsconfig.app.json)
- `storybook-static/` not in `.gitignore`
- App.tsx has no error handling for the fetch call
- Stories use `React.ComponentProps` without explicit React import (works with React 19 auto-import)
