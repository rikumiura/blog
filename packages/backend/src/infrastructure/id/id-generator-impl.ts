import { nanoid } from 'nanoid'
import { uuidv7 } from 'uuidv7'
import type {
  ArticleId,
  BodyKey,
  PublicArticleId,
} from '../../domain/models/article'
import type { IdGenerator } from '../../domain/repositories/id-generator'

export class IdGeneratorImpl implements IdGenerator {
  generateArticleId(): ArticleId {
    return uuidv7() as ArticleId
  }

  generatePublicArticleId(): PublicArticleId {
    return nanoid() as PublicArticleId
  }

  generateBodyKey(): BodyKey {
    return `${uuidv7()}.md` as BodyKey
  }
}
