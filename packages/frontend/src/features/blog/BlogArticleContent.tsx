import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'

type Props = {
  body: string
}

export function BlogArticleContent({ body }: Props) {
  const html = useMemo(() => {
    const parsed = marked.parse(body)
    return DOMPurify.sanitize(typeof parsed === 'string' ? parsed : '')
  }, [body])

  return (
    <div
      className="prose max-w-none dark:prose-invert"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
