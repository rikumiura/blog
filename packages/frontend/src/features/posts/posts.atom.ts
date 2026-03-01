import { atom } from 'jotai'
import type { Post } from '@/core/types/post'
import { postApi } from './posts.api'

/** 投稿一覧の状態 */
export const postsAtom = atom<Post[]>([])

/** 投稿一覧を取得して状態を更新するアクション */
export const fetchPostsAtom = atom(null, async (_get, set) => {
  const posts = await postApi.findAll()
  set(postsAtom, posts)
})
