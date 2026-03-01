import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchPostsAtom, postsAtom } from './posts.atom'

export function PostsTable() {
  const posts = useAtomValue(postsAtom)
  const fetchPosts = useSetAtom(fetchPostsAtom)

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead>内容</TableHead>
          <TableHead>作成日</TableHead>
          <TableHead>更新日</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              投稿がありません
            </TableCell>
          </TableRow>
        ) : (
          posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.id}</TableCell>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell className="max-w-xs truncate">
                {post.content}
              </TableCell>
              <TableCell>{post.createdAt}</TableCell>
              <TableCell>{post.updatedAt}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
