import {
  createDraftArticle,
  createTitle,
  type DraftArticle,
} from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyStorage } from '../domain/ports/body-storage'
import type { ArticleIdGenerator } from '../domain/ports/id-generator'

export type CreateArticleResult =
  | { status: 'created'; article: DraftArticle }
  | { status: 'validation_error'; message: string }

export async function createArticle(
  input: { title: string; body: string },
  deps: {
    repository: ArticleRepository
    bodyStorage: BodyStorage
    idGenerator: ArticleIdGenerator
    now: () => string
  },
): Promise<CreateArticleResult> {
  const titleResult = createTitle(input.title)
  if (!titleResult.ok) {
    return { status: 'validation_error', message: titleResult.message }
  }
  const title = titleResult.value
  const id = deps.idGenerator.generateArticleId()
  const publicId = deps.idGenerator.generatePublicArticleId()
  const bodyKey = deps.idGenerator.generateBodyKey()

  await deps.bodyStorage.save(bodyKey, input.body)

  const now = deps.now()
  const article = createDraftArticle({ id, publicId, title, bodyKey, now })
  try {
    await deps.repository.save(article)
  } catch (error) {
    // DB保存失敗時にR2の孤立ファイルを削除する補償処理
    await deps.bodyStorage.delete(bodyKey).catch(() => {
      console.error(`補償処理失敗: R2ファイル ${bodyKey} の削除に失敗しました`)
    })
    throw error
  }

  return { status: 'created', article }
}
