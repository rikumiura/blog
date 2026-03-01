<!-- # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
you have to wright japanese

## Project Overview

A blog application built as a pnpm monorepo with three workspaces:
- `packages/frontend` — React SPA (Vite, React Router v7, Tailwind CSS v4, shadcn/ui)
- `packages/backend` — Hono API on Cloudflare Workers
- `packages/db` — Drizzle ORM + Cloudflare D1（SQLiteベースのデータベース）

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

### DB (run from packages/db)
```bash
pnpm generate           # Drizzle KitでマイグレーションSQL生成
pnpm migrate:local      # ローカルD1にマイグレーション適用
pnpm migrate:remote     # リモートD1にマイグレーション適用
pnpm studio             # Drizzle Studioを起動
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
- `@my-blog/db`の`createDb`でD1バインディングからDrizzleクライアントを生成

### DB Structure (`packages/db/`)
- `src/schema.ts` — Drizzleスキーマ定義（`drizzle-orm/sqlite-core`を使用）
- `src/index.ts` — `createDb`ファクトリ関数とスキーマの再エクスポート
- `drizzle.config.ts` — Drizzle Kit設定
- `migrations/` — 自動生成されたマイグレーションSQL（`pnpm generate`で生成）

## Code Style

Enforced by Biome (config at root `biome.json`):
- Single quotes, no semicolons, 2-space indent
- Path alias: `@/*` → `./src/*` (frontend only)
- Commit messages and code comments are in Japanese -->

# CLAUDE.md

このファイルは、このリポジトリ内のコードを扱う際に、Claude Code（claude.ai/code）へ作業方針を伝えるためのガイドです。  
回答・コメント・提案は日本語で記述してください。

## プロジェクト概要

このプロジェクトは、pnpm モノレポ構成のブログアプリケーションです。  
ワークスペースは以下の 3 つです。

- `packages/frontend` — React SPA（Vite / React Router v7 / Tailwind CSS v4 / shadcn/ui）
- `packages/backend` — Cloudflare Workers 上で動作する Hono API
- `packages/db` — Drizzle ORM + Cloudflare D1（SQLite ベースのデータベース）

## 開発ルール

- 開発を開始する前に、**必ず新しい Git ブランチを作成してから作業すること**
- `main` またはデフォルトブランチに直接コミットしないこと
- ブランチ名は、作業内容が分かる名前にすること（例: `feature/add-login-page`, `fix/header-layout`）
- ブランチ作成時は、必要に応じて `git switch -c <branch-name>` などを用いて作業ブランチへ切り替えてから実装を始めること
- 作業完了後は、必要なテスト・lint・フォーマットを実行してから差分を確認すること
- 変更は、レビュー可能な状態を意識して整理すること
- 直接 push で完結させず、Pull Request によるレビューを前提として進めること

## DB変更時のルール

- スキーマを変更した場合は、**必ず** `pnpm generate` を実行してマイグレーション SQL を生成すること
- 生成されたマイグレーション SQL の差分を確認し、意図しない変更が含まれていないことを確認すること
- ローカルで `pnpm migrate:local` を実行し、マイグレーションが正常に適用できることを確認すること
- スキーマ変更を含む場合は、アプリケーションコード側との整合性（型・クエリ・API）もあわせて確認すること
- リモート環境への適用が必要な場合のみ、影響を確認した上で `pnpm migrate:remote` を実行すること

## コマンド

### 開発

```bash
# Docker（推奨）
docker compose up

# ローカル実行
pnpm install
pnpm --filter frontend dev          # Frontend: http://localhost:5173
pnpm --filter @my-blog/backend dev  # Backend:  http://localhost:8787
````

### フロントエンド（`packages/frontend` で実行）

```bash
pnpm test:unit          # Vitest によるユニットテスト
pnpm test:e2e           # Playwright による E2E テスト
pnpm test:storybook     # Storybook のコンポーネントテスト
pnpm test               # すべての Vitest テスト（watch モード）
pnpm lint               # Biome による静的チェック
pnpm format             # Biome による自動修正
pnpm storybook          # Storybook: http://localhost:6006
```

### バックエンド（`packages/backend` で実行）

```bash
pnpm deploy             # Cloudflare Workers へビルドしてデプロイ
pnpm cf-typegen         # Cloudflare バインディング用の型を生成
```

### DB（`packages/db` で実行）

```bash
pnpm generate           # Drizzle Kit でマイグレーション SQL を生成
pnpm migrate:local      # ローカル D1 にマイグレーションを適用
pnpm migrate:remote     # リモート D1 にマイグレーションを適用
pnpm studio             # Drizzle Studio を起動
```

## アーキテクチャ

### 型安全な RPC（重要な設計パターン）

バックエンドは、ルート定義から `AppType` をエクスポートします。
フロントエンドはこの型をインポートし、Hono の RPC クライアント（`hc<AppType>()`）を利用することで、完全に型安全な API 呼び出しを行います。これにより、API の型を手動で重複定義する必要がありません。
フロントエンドは `@my-blog/backend` に `workspace:*` 経由で依存していますが、この依存は型のインポート専用です。

### フロントエンド構成（`packages/frontend/src/`）

* `app/` — アプリケーション本体とルーティング（React Router v7 / BrowserRouter）
* `components/ui/` — shadcn/ui コンポーネント（New York スタイル）
* `core/` — ビジネスロジック（`lib/` / `ports/` / `types/`）
* `features/` — 機能単位のモジュール
* `lib/` — UI 向けユーティリティ（`clsx + tailwind-merge` を使った `cn` ヘルパー）
* `mocks/` — テスト時の API モック用 MSW ハンドラー

### バックエンド構成（`packages/backend/src/`）

* Hono アプリと `AppType` をエクスポートする単一の `index.tsx` エントリーポイント
* すべてのルートで CORS を有効化
* リクエストバリデーションに Zod + `@hono/zod-validator` を使用
* `@my-blog/db` の `createDb` を使い、D1 バインディングから Drizzle クライアントを生成する

### DB 構成（`packages/db/`）

* `src/schema.ts` — Drizzle のスキーマ定義（`drizzle-orm/sqlite-core` を使用）
* `src/index.ts` — `createDb` ファクトリ関数とスキーマの再エクスポート
* `drizzle.config.ts` — Drizzle Kit の設定
* `migrations/` — 自動生成されたマイグレーション SQL（`pnpm generate` で生成）

## コードスタイル

コードスタイルは、ルートの `biome.json` により統一されています。

* シングルクォートを使用する
* セミコロンは付けない
* インデントは 2 スペース
* パスエイリアス: `@/*` → `./src/*`（フロントエンドのみ）
* コミットメッセージとコードコメントは日本語で記述する

