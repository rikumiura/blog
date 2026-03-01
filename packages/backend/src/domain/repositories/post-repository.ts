import type { Post } from '../models/post'

export interface PostRepository {
  findAll(): Promise<Post[]>
}
