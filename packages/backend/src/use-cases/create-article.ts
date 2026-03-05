import { createDraftArticle, createTitle } from '../domain/models/article'
import type { ArticleRepository } from '../domain/repositories/article-repository'
import type { BodyStorage } from '../domain/repositories/body-storage'
import type { IdGenerator } from '../domain/repositories/id-generator'

export async function createArticle(
  input: { title: string; body: string },
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    idGenerator: IdGenerator
  },
) {
  const title = createTitle(input.title)
  const id = deps.idGenerator.generateArticleId()
  const publicId = deps.idGenerator.generatePublicArticleId()
  const bodyKey = deps.idGenerator.generateBodyKey()

  await deps.bodyStorage.save(bodyKey, input.body)

  const article = createDraftArticle({ id, publicId, title, bodyKey })
  await deps.repository.save(article)

  return article
}
