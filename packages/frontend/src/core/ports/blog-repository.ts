import type {
  ArticleDetail,
  PaginatedResponse,
  PublishedArticle,
} from '@/core/types/article'

/** 公開ブログデータ操作のポートインターフェース（依存関係逆転） */
export interface BlogRepository {
  findAll(params?: {
    page: number
    limit: number
    tags?: string[]
    search?: string
  }): Promise<PaginatedResponse<PublishedArticle>>
  findByPublicId(publicId: string): Promise<ArticleDetail>
}
