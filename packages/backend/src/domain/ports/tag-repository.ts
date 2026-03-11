import type { ArticleId } from '../models/article'
import type { Tag, TagName } from '../models/tag'

export interface TagRepository {
  /** タグ名の配列から既存タグを検索する */
  findByNames(names: TagName[]): Promise<Tag[]>

  /** タグを一括保存する（既存のものはスキップ） */
  saveMany(tags: Tag[]): Promise<void>

  /** 記事IDに紐づくタグを取得する */
  findByArticleId(articleId: ArticleId): Promise<Tag[]>

  /** 記事IDの配列に紐づくタグをまとめて取得する */
  findByArticleIds(articleIds: ArticleId[]): Promise<Map<string, Tag[]>>

  /** 記事とタグの紐付けを設定する（既存の紐付けは全て置換） */
  setArticleTags(articleId: ArticleId, tagIds: Tag['id'][]): Promise<void>
}
