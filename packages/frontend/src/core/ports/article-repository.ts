import type {
  Article,
  CreateArticleInput,
  DraftArticle,
  PublishedArticle,
} from '@/core/types/article'

/** 記事データ操作のポートインターフェース（依存関係逆転） */
export interface ArticleRepository {
  findAll(): Promise<Article[]>
  findByPublicId(publicId: string): Promise<Article>
  create(input: CreateArticleInput): Promise<DraftArticle>
  publish(publicId: string): Promise<PublishedArticle>
}
