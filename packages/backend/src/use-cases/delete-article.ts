import type { PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'

export type DeleteArticleResult =
  | { status: 'deleted' }
  | { status: 'not_found' }

export async function deleteArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
  },
): Promise<DeleteArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) return { status: 'not_found' }

  await deps.repository.delete(article.id)
  await deps.bodyStorage.delete(article.bodyKey)

  return { status: 'deleted' }
}
