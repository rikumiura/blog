import type { ArticleId } from '../models/article'
import type { Tag, TagId, TagName } from '../models/tag'

export interface TagRepository {
  /** 全タグを取得する */
  findAll(): Promise<Tag[]>

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

  /**
   * タグをIDで削除する。記事との紐付けもあわせて削除する。
   * 削除できた場合は true、該当タグが存在しなければ false を返す
   */
  deleteById(id: TagId): Promise<boolean>
}
