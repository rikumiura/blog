import type { PublicArticleId } from '../domain/models/article'
import { publishArticle as publishDomainArticle } from '../domain/models/article'
import type { ArticleRepository } from '../domain/repositories/article-repository'

export async function publishArticle(
  publicId: PublicArticleId,
  repository: ArticleRepository,
) {
  const article = await repository.findByPublicId(publicId)
  if (!article) {
    throw new Error('記事が見つかりません')
  }

  const now = new Date().toISOString()
  const published = publishDomainArticle(article, now)
  await repository.save(published)
  return published
}
