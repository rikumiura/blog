import { describe, expect, it } from 'vitest'
import { escapeLikePattern } from '../repositories/drizzle-article-repository'

describe('escapeLikePattern', () => {
  it('% をエスケープする', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%')
  })

  it('_ をエスケープする', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b')
  })

  it('バックスラッシュをエスケープする', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b')
  })

  it('複数のメタ文字を同時にエスケープする', () => {
    expect(escapeLikePattern('50%_off')).toBe('50\\%\\_off')
  })

  it('メタ文字を含まない文字列はそのまま返す', () => {
    expect(escapeLikePattern('TypeScript入門')).toBe('TypeScript入門')
  })
})
