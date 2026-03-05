import type { Article, CreateArticleInput } from '@/core/types/article'

/** 記事データ操作のポートインターフェース（依存関係逆転） */
export interface ArticleRepository {
  findAll(): Promise<Article[]>
  create(input: CreateArticleInput): Promise<Article>
}
