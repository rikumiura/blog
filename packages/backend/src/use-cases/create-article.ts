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
  try {
    await deps.repository.save(article)
  } catch (error) {
    // DB保存失敗時にR2の孤立ファイルを削除する補償処理
    await deps.bodyStorage.delete(bodyKey).catch(() => {
      // 補償処理自体の失敗はログのみ（二重障害を防ぐ）
      console.error(`補償処理失敗: R2ファイル ${bodyKey} の削除に失敗しました`)
    })
    throw error
  }

  return article
}
