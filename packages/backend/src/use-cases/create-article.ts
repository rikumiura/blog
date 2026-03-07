import {
  type DraftArticle,
  createDraftArticle,
  createTitle,
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
  },
): Promise<CreateArticleResult> {
  let title: ReturnType<typeof createTitle>
  try {
    title = createTitle(input.title)
  } catch (error) {
    if (error instanceof Error) {
      return { status: 'validation_error', message: error.message }
    }
    throw error
  }
  const id = deps.idGenerator.generateArticleId()
  const publicId = deps.idGenerator.generatePublicArticleId()
  const bodyKey = deps.idGenerator.generateBodyKey()

  await deps.bodyStorage.save(bodyKey, input.body)

  const now = new Date().toISOString()
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
