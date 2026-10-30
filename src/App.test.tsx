import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { formatMoney } from './lib/format'
import { server } from './test/setup'

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

async function reachAmountStep(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'Good evening, Ava' })
  await user.click(screen.getByRole('button', { name: /New transfer/ }))

  const jamie = await screen.findByRole('radio', { name: /Jamie Tan/ })
  await user.click(jamie)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('heading', { name: 'How much?' })
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.segment = 'retail'
})

describe('Meridian transfer flow', () => {
  it('shows an over-balance error and sends no request', async () => {
    let transferRequests = 0
    server.use(
      http.post('*/api/transfers', () => {
        transferRequests += 1
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Unexpected request' } },
          { status: 500 },
        )
      }),
    )

    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)

    await user.type(screen.getByLabelText('Amount'), '5000')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    const expectedError =
      "Amount can't be more than your available balance (" +
      formatMoney(4280.55) +
      ').'
    expect(
      await screen.findByText(
        (_, element) => element?.textContent === expectedError,
      ),
    ).toBeInTheDocument()
    expect(transferRequests).toBe(0)
  })

  it('shows success and refreshes dashboard data after a transfer', async () => {
    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)

    await user.type(screen.getByLabelText('Amount'), '120')
    await user.type(screen.getByLabelText('Note (optional)'), 'Dinner')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      await screen.findByRole('heading', { name: 'Check the details' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))

    expect(
      await screen.findByRole('heading', { name: 'Transfer sent' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^TRF-/)).toBeInTheDocument()

    const backToDashboard = screen.getByRole('button', {
      name: 'Back to dashboard',
    })
    await waitFor(() => expect(backToDashboard).toBeEnabled())
    await user.click(backToDashboard)

    expect(screen.getByText('Transfer to Jamie Tan')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Everyday Checking' }).parentElement
        ?.parentElement?.textContent,
    ).toContain(formatMoney(4160.55))
    expect(
      screen.getByText('Total available').parentElement?.textContent,
    ).toContain(formatMoney(17000.55))
    expect(
      screen.getByRole('heading', {
        name: formatMoney(4880),
      }),
    ).toBeInTheDocument()
  })
})
