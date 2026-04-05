# 集約定義

---

## 集約 1：`Article`（記事）

記事の執筆からローカルサイトへの公開・予約投稿までを一貫して管理する集約。
すべての不変条件（タイトル必須・状態遷移・公開日時の記録）が Article 内に閉じているため、単一の集約として設計する。
本集約はローカル公開までを対象とし、外部サービスへの投稿同期（例: Zenn）は現時点では扱わない。

### 構成要素

| 名前 | 分類 | 型 / 実装 | 説明 |
| :--- | :--- | :--- | :--- |
| `ArticleId` | 内部識別子 | UUIDv7（Branded Type） | 記事をシステム内部で一意に識別する値 |
| `PublicArticleId` | 公開識別子 | nanoID（Branded Type） | ユーザーが参照できる範囲で使用する一意識別子 |
| `Title` | 値オブジェクト | `string`（Branded Type・空文字不可・100文字以内） | 記事のタイトル。必須項目 |
| `BodyKey` | 値オブジェクト | R2 ファイル識別子（Branded Type） | 本文の実体は R2 に保存し、識別子で参照する |
| `ArticleStatus` | 値オブジェクト | `'draft'` \| `'scheduled'` \| `'published'` | 記事の公開状態 |
| `CreatedAt` | 値オブジェクト | 日時文字列（サーバー側で採番） | 記事の作成日時 |
| `UpdatedAt` | 値オブジェクト | 日時文字列（サーバー側で採番） | 記事の最終更新日時 |
| `PublishedAt` | 値オブジェクト | 日時文字列 \| `null` | 公開日時。`draft`/`scheduled` 状態では `null` |
| `ScheduledAt` | 値オブジェクト | 日時文字列 \| `null` | 予約公開日時。`scheduled` 状態でのみ値を持つ |

### サブタイプ（判別共用体）

| 型名 | `status` | `publishedAt` | `scheduledAt` |
| :--- | :--- | :--- | :--- |
| `DraftArticle` | `'draft'` | `null` | `null` |
| `ScheduledArticle` | `'scheduled'` | `null` | `string`（ISO日時） |
| `PublishedArticle` | `'published'` | `string`（ISO日時） | `string \| null` |

### 状態遷移

```
Draft ──────────────────────→ Published
  │                               ↑
  └──→ Scheduled ────────────────→┘
             │
             └──→ Draft（キャンセル）
```

* `Draft → Published`: 即時公開（`publishArticle`）
* `Draft → Scheduled`: 予約投稿設定（`scheduleArticle`）
* `Scheduled → Published`: 予約日時到達による自動公開（`publishArticle`）
* `Scheduled → Draft`: 予約キャンセル（`cancelSchedule`）
* `Published → Draft` への巻き戻しは不可

### 不変条件（ビジネスルール）

1. **タイトル必須** — `Title` は空文字・未設定を許容しない。
2. **状態遷移制約** — 上記の遷移図に定義された方向のみ許可。`Published` からの巻き戻しは不可。
3. **公開日時の記録** — `publishArticle()` 実行時に `publishedAt` をサーバー側の現在日時で記録する。
4. **日時の信頼性** — `createdAt`・`updatedAt`・`publishedAt`・`scheduledAt` はすべてバックエンド側で採番し、クライアントからの指定は受け付けない。
5. **公開識別子の一意性** — `PublicArticleId` はシステム全体で一意でなければならない。
6. **公開識別子の不変性** — `PublicArticleId` は生成後に変更できない。

### 補足：Body と R2 の関係

本文の実体は Cloudflare R2 に Markdown ファイルとして保存する。
`BodyKey` が保持するのはそのファイルを特定するための識別子であり、本文の内容そのものではない。
これにより、集約の永続化（DB への保存）と本文ファイルの管理を分離できる。

---

## 集約 2：`Tag`（タグ）

記事を分類・検索するためのラベルを管理する集約。
記事との関係は多対多であり、中間テーブル（`article_tags`）で管理する。

### 構成要素

| 名前 | 分類 | 型 / 実装 | 説明 |
| :--- | :--- | :--- | :--- |
| `TagId` | 内部識別子 | UUIDv7（Branded Type） | タグをシステム内部で一意に識別する値 |
| `TagName` | 値オブジェクト | `string`（Branded Type・空文字不可・30文字以内） | タグ名。必須項目 |

### 不変条件（ビジネスルール）

1. **タグ名必須** — `TagName` は空文字を許容しない。
2. **タグ名長制限** — `TagName` は30文字以内。
3. **記事紐付けの置換** — `setArticleTags()` は既存の紐付けをすべて置換する（差分更新ではない）。

---

## 非スコープ（現時点）

* 外部投稿/同期（`CrossPost` / `Sync`）のワークフロー
* 外部サイト上の記事ID・公開 URL の保持

これらは将来の拡張要件として別ドメイン（または別集約）で扱う。
