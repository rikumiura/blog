import DOMPurify from 'dompurify'
import { marked } from 'marked'

type Props = {
  body: string
}

export function BlogArticleContent({ body }: Props) {
  const html = DOMPurify.sanitize(marked.parse(body) as string)

  return (
    <div
      className="prose max-w-none dark:prose-invert"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
