type BlogArticleCountProps = {
  /** 表示する総件数（検索・タグ絞り込みを反映したサーバ集計値） */
  count: number
  /** 確定済みの検索キーワード（未検索時は空文字） */
  searchQuery: string
  /** タグによる絞り込みが有効かどうか */
  hasTagFilter: boolean
}

/** 公開記事一覧の件数を表示する。件数が0のときは何も表示しない。 */
export function BlogArticleCount({
  count,
  searchQuery,
  hasTagFilter,
}: BlogArticleCountProps) {
  if (count === 0) return null

  const label = searchQuery
    ? `「${searchQuery}」の検索結果: ${count}件`
    : hasTagFilter
      ? `絞り込み結果: ${count}件`
      : `全${count}件`

  return <p className="mb-4 text-sm text-muted-foreground">{label}</p>
}
