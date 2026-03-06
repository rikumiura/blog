import type { Article, PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'

export type ArticleWithBody = Article & { body: string }

export type GetArticleResult =
  | { status: 'found'; article: ArticleWithBody }
  | { status: 'not_found' }

export async function getArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
  },
): Promise<GetArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  const body = await deps.bodyStorage.get(article.bodyKey)
  return { status: 'found', article: { ...article, body: body ?? '' } }
}
