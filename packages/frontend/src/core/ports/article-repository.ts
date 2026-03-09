import type {
  Article,
  ArticleDetail,
  CreateArticleInput,
} from '@/core/types/article'

/** 記事データ操作のポートインターフェース（依存関係逆転） */
export interface ArticleRepository {
  findAll(): Promise<Article[]>
  findByPublicId(publicId: string): Promise<ArticleDetail>
  create(input: CreateArticleInput): Promise<Article>
  publish(publicId: string): Promise<Article>
}
