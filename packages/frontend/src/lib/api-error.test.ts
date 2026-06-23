import { describe, expect, it } from 'vitest'
import { createApiError, extractErrorMessage, throwApiError } from './api-error'

describe('extractErrorMessage', () => {
  it('error フィールドが文字列なら、その値を返す', () => {
    expect(extractErrorMessage({ error: 'タイトルは空にできません' })).toBe(
      'タイトルは空にできません',
    )
  })

  it('error フィールドが文字列でなければ undefined を返す', () => {
    expect(extractErrorMessage({ error: 123 })).toBeUndefined()
  })

  it('error フィールドを持たないオブジェクトなら undefined を返す', () => {
    expect(extractErrorMessage({ message: 'foo' })).toBeUndefined()
  })

  it('null なら undefined を返す', () => {
    expect(extractErrorMessage(null)).toBeUndefined()
  })

  it('オブジェクト以外（文字列）なら undefined を返す', () => {
    expect(extractErrorMessage('not json')).toBeUndefined()
  })
})

describe('throwApiError', () => {
  it('ボディに error メッセージがあれば、それを使って throw する', async () => {
    const res = new Response(
      JSON.stringify({ error: '同名のタグが既に存在します' }),
      {
        status: 409,
      },
    )

    await expect(
      throwApiError(res, 'タグの作成に失敗しました'),
    ).rejects.toThrow('同名のタグが既に存在します')
  })

  it('ボディに error メッセージがなければ、デフォルトメッセージ + ステータスで throw する', async () => {
    const res = new Response(JSON.stringify({}), { status: 400 })

    await expect(
      throwApiError(res, '記事の作成に失敗しました'),
    ).rejects.toThrow('記事の作成に失敗しました: 400')
  })

  it('ボディが JSON でなくても、デフォルトメッセージ + ステータスで throw する', async () => {
    const res = new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })

    await expect(
      throwApiError(res, '記事の作成に失敗しました'),
    ).rejects.toThrow('記事の作成に失敗しました: 500')
  })
})

describe('createApiError', () => {
  it('ボディに error メッセージがあれば、それを使った Error を返す（throwしない）', async () => {
    const res = new Response(
      JSON.stringify({ error: '同名のタグが既に存在します' }),
      {
        status: 409,
      },
    )

    const error = await createApiError(res, 'タグの作成に失敗しました')

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('同名のタグが既に存在します')
  })

  it('ボディに error メッセージがなければ、デフォルトメッセージ + ステータスの Error を返す', async () => {
    const res = new Response(JSON.stringify({}), { status: 400 })

    const error = await createApiError(res, '記事の作成に失敗しました')

    expect(error.message).toBe('記事の作成に失敗しました: 400')
  })

  it('ボディが JSON でなくても、デフォルトメッセージ + ステータスの Error を返す', async () => {
    const res = new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })

    const error = await createApiError(res, '記事の作成に失敗しました')

    expect(error.message).toBe('記事の作成に失敗しました: 500')
  })
})
