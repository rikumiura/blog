import type { PostRepository } from '../domain/repositories/post-repository'

export function listPosts(repository: PostRepository) {
  return repository.findAll()
}
