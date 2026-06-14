import { atom } from 'jotai'
import type { CommentRepository } from '@/core/ports/comment-repository'
import { commentsApi } from './comments.api'

/** コメントリポジトリの依存注入用atom（テスト時に差し替え可能） */
export const commentRepositoryAtom = atom<CommentRepository>(commentsApi)
