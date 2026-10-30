import type { ApiErrorBody } from './types'

/**
 * Small typed fetch wrapper. Build your query functions on top of this.
 *
 * MSW intercepts these requests in the browser and in tests, so the same
 * `/api/...` paths work locally and in the deployed demo.
 */
const BASE_URL = import.meta.env.BASE_URL

const INVALID_RESPONSE_BODY: ApiErrorBody = {
  error: {
    code: 'INVALID_RESPONSE',
    message: 'The API returned an invalid response.',
  },
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!isJsonObject(value) || !isJsonObject(value.error)) return false

  return (
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  )
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>
  readonly meta?: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.error.code ?? 'UNKNOWN'
    this.fields = body?.error.fields
    this.meta = body?.error.meta
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path.replace(/^\//, '')}`
  const response = await fetch(url, init)
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      isApiErrorBody(body) ? body : null,
    )
  }

  // Every supplied endpoint returns a top-level JSON object. If MSW is not
  // controlling a development tab, Vite can answer `/api/*` with index.html
  // and HTTP 200. Treat that protocol mismatch as an error instead of caching
  // `null` as successful query data and leaving the dashboard with no branch
  // to render.
  if (!isJsonObject(body) || isApiErrorBody(body)) {
    throw new ApiError(response.status, INVALID_RESPONSE_BODY)
  }

  return body as T
}
