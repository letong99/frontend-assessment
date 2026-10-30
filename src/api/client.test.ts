import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/setup'
import { apiFetch } from './client'

describe('apiFetch response validation', () => {
  it('rejects an HTML 200 response instead of returning null data', async () => {
    server.use(
      http.get('*/api/html-fallback', () =>
        HttpResponse.text('<!doctype html><title>Vite fallback</title>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    await expect(apiFetch('/api/html-fallback')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      code: 'INVALID_RESPONSE',
      message: 'The API returned an invalid response.',
    })
  })

  it('rejects a null JSON 200 response', async () => {
    server.use(
      http.get('*/api/null-response', () => HttpResponse.json(null)),
    )

    await expect(apiFetch('/api/null-response')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INVALID_RESPONSE',
    })
  })

  it('rejects an error envelope even when its HTTP status is 200', async () => {
    server.use(
      http.get('*/api/error-envelope', () =>
        HttpResponse.json({
          error: { code: 'UPSTREAM_ERROR', message: 'Unexpected envelope' },
        }),
      ),
    )

    await expect(apiFetch('/api/error-envelope')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INVALID_RESPONSE',
    })
  })

  it('keeps malformed HTTP failures as typed API errors', async () => {
    server.use(
      http.get('*/api/non-json-error', () =>
        HttpResponse.text('Unavailable', { status: 503 }),
      ),
    )

    await expect(apiFetch('/api/non-json-error')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      code: 'UNKNOWN',
      message: 'Request failed (503)',
    })
  })
})
