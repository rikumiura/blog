import { useEffect, useState } from 'react'
import { hc } from 'hono/client'
// バックエンドから型だけをインポート！
import type { AppType } from '@my-blog/backend/src/index'

// Hono RPC クライアントの初期化 (Wranglerのデフォルトポートは8787)
const client = hc<AppType>('http://localhost:8787')

function App() {
  const [message, setMessage] = useState('Loading...')

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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{message}</h1>
      <p>Frontend: React Router v7 + Vite</p>
      <p>Backend: Hono</p>
    </div>
  )
}

export default App
