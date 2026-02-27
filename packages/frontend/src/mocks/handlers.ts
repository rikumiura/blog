import { HttpResponse, http } from 'msw'

export const handlers = [
  http.get('http://localhost:8787/api/hello', () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),
]
