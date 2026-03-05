import { nanoid } from 'nanoid'
import { uuidv7 } from 'uuidv7'
import type {
  ArticleId,
  BodyKey,
  PublicArticleId,
} from '../../domain/models/article'
import type { ArticleIdGenerator } from '../../domain/repositories/id-generator'

export class ArticleIdGeneratorImpl implements ArticleIdGenerator {
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
