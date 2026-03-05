import type { PublicArticleId } from '../domain/models/article'
import type { ArticleRepository } from '../domain/repositories/article-repository'

export async function getArticle(
  publicId: PublicArticleId,
  repository: ArticleRepository,
) {
  const article = await repository.findByPublicId(publicId)
  if (!article) {
    throw new Error('記事が見つかりません')
  }
  return article
}
