import { Hono } from 'hono'
import type { AppEnv } from '../env'
import {
  isAllowedImageContentType,
  MAX_IMAGE_SIZE_BYTES,
} from '../infrastructure/storage/r2-image-storage'

export const imageRoutes = new Hono<AppEnv>().post('/', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('image')

  if (!file || !(file instanceof File)) {
    return c.json({ error: '画像ファイルが指定されていません' }, 400)
  }

  if (!isAllowedImageContentType(file.type)) {
    return c.json(
      {
        error:
          'サポートされていないファイル形式です。JPEG / PNG / GIF / WebP のみ使用できます',
      },
      400,
    )
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return c.json({ error: '画像サイズは 5MB 以内にしてください' }, 400)
  }

  const ext = file.type.split('/')[1]
  const { uuidv7 } = await import('uuidv7')
  const key = `${uuidv7()}.${ext}`

  const { imageStorage } = c.get('deps')
  const data = await file.arrayBuffer()
  await imageStorage.save(key, data, file.type)

  const url = `/api/public/images/${key}`
  return c.json({ key, url }, 201)
})
