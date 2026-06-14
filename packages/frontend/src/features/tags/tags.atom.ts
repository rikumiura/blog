import { atom } from 'jotai'
import type { TagRepository } from '@/core/ports/tag-repository'
import { tagsApi } from './tags.api'

/** タグリポジトリの依存注入用atom（テスト時に差し替え可能） */
export const tagRepositoryAtom = atom<TagRepository>(tagsApi)
