import type {
  Article,
  ArticleDetail,
  CreateArticleInput,
  PaginatedResponse,
  UpdateArticleInput,
} from '@/core/types/article'

/** 記事データ操作のポートインターフェース（依存関係逆転） */
export interface ArticleRepository {
  findAll(params?: {
    page: number
    limit: number
  }): Promise<PaginatedResponse<Article>>
  findByPublicId(publicId: string): Promise<ArticleDetail>
  create(input: CreateArticleInput): Promise<Article>
  update(publicId: string, input: UpdateArticleInput): Promise<ArticleDetail>
  publish(publicId: string): Promise<Article>
  schedule(publicId: string, scheduledAt: string): Promise<Article>
  cancelSchedule(publicId: string): Promise<Article>
  updateTags(publicId: string, tags: string[]): Promise<string[]>
  delete(publicId: string): Promise<void>
}
