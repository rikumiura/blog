import type { ArticleRepository } from '../domain/repositories/article-repository'

/**
 * 記事一覧を取得するクエリユースケース。
 * 現時点ではリポジトリ委譲のみだが、フィルタ・ソート・ページネーション等の
 * ビジネスロジックが追加される際の拡張ポイントとして維持する。
 */
export function listArticles(repository: ArticleRepository) {
  return repository.findAll()
}
