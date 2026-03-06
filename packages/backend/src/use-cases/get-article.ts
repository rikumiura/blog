import type { PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'

export async function getArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
  },
) {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return null

  const body = await deps.bodyStorage.get(article.bodyKey)
  return { ...article, body: body ?? '' }
}
