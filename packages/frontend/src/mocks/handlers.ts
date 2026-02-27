import { HttpResponse, http } from 'msw'

export const handlers = [
  http.get(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'}/api/hello`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
]
