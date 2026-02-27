// バックエンドから型だけをインポート！
import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import { useEffect, useState } from 'react'
import { add } from '../core/lib/math'

// Hono RPC クライアントの初期化
const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

function App() {
  const [message, setMessage] = useState('Loading...')
  const result = add(1, 2)

  useEffect(() => {
    const fetchHello = async () => {
      // client.api.hello... と打ち込むとTypeScriptの補完が効くことを確認してみてください！
      const res = await client.api.hello.$get()
      const data = await res.json()
      setMessage(data.message)
    }
    fetchHello()
  }, [])

  return (
    <div className="p-5 font-sans">
      <h1>{message}</h1>
      <p>1 + 2 = {result}</p>
      <p>Frontend: React Router v7 + Vite</p>
      <p>Backend: Hono</p>
    </div>
  )
}

export default App
