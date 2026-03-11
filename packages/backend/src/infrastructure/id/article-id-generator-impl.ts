import { nanoid } from 'nanoid'
import { uuidv7 } from 'uuidv7'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
} from '../../domain/models/article'
import { TagId } from '../../domain/models/tag'
import type { ArticleIdGenerator } from '../../domain/ports/id-generator'

export class ArticleIdGeneratorImpl implements ArticleIdGenerator {
  generateArticleId(): ArticleId {
    return ArticleId(uuidv7())
  }

  generatePublicArticleId(): PublicArticleId {
    return PublicArticleId(nanoid())
  }

  generateBodyKey(): BodyKey {
    return BodyKey(`${uuidv7()}.md`)
  }

  generateTagId(): TagId {
    return TagId(uuidv7())
  }
}
