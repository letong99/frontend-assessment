import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '../../api/queries'
import { server } from '../../test/setup'
import Dashboard from './Dashboard'

const accounts = [
  {
    id: 'acc_checking',
    name: 'Everyday Checking',
    type: 'checking' as const,
    maskedNumber: '•••• 4821',
    balance: 4280.55,
    currency: 'SGD' as const,
  },
  {
    id: 'acc_savings',
    name: 'Savings Plus',
    type: 'savings' as const,
    maskedNumber: '•••• 9930',
    balance: 12840,
    currency: 'SGD' as const,
  },
  {
    id: 'acc_credit',
    name: 'Rewards Card',
    type: 'credit' as const,
    maskedNumber: '•••• 7712',
    balance: -420.3,
    currency: 'SGD' as const,
  },
]

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const view = render(
    <QueryClientProvider client={queryClient}>
      <Dashboard onNewTransfer={vi.fn()} />
    </QueryClientProvider>,
  )

  return { ...view, queryClient }
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.segment = 'retail'
})

afterEach(() => cleanup())

describe('Dashboard', () => {
  it('renders the customer name returned by the API', async () => {
    server.use(
      http.get('*/api/customer', () =>
        HttpResponse.json({
          customer: {
            id: 'cus_dynamic',
            firstName: 'Mei',
            lastName: 'Lin',
            email: 'mei.lin@example.com',
            segment: 'retail',
            dailyTransferLimit: 5000,
            transferredToday: 0,
          },
        }),
      ),
    )

    renderDashboard()

    expect(
      await screen.findByRole('heading', { name: 'Good evening, Mei' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Good evening, Ava' }),
    ).not.toBeInTheDocument()
  })

  it('shows Retry and recovers when a successful response contains HTML', async () => {
    let customerRequests = 0
    server.use(
      http.get('*/api/customer', () => {
        customerRequests += 1
        if (customerRequests === 1) {
          return HttpResponse.text('<!doctype html><title>Vite</title>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          })
        }

        return HttpResponse.json({
          customer: {
            id: 'cus_001',
            firstName: 'Ava',
            lastName: 'Chen',
            email: 'ava.chen@example.com',
            segment: 'retail',
            dailyTransferLimit: 5000,
            transferredToday: 0,
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderDashboard()

    expect(
      await screen.findByRole('heading', {
        name: "We couldn't load your dashboard.",
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Total available')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByRole('heading', { name: 'Good evening, Ava' }),
    ).toBeInTheDocument()
    expect(customerRequests).toBe(2)
  })

  it('retains loaded content when a background response contains HTML', async () => {
    const { queryClient } = renderDashboard()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })

    server.use(
      http.get('*/api/customer', () =>
        HttpResponse.text('<!doctype html><title>Vite</title>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    await queryClient.refetchQueries({ queryKey: queryKeys.customer })

    expect(
      screen.getByRole('heading', { name: 'Good evening, Ava' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total available')).toBeInTheDocument()
    expect(
      screen.queryByText("We couldn't load your dashboard."),
    ).not.toBeInTheDocument()
    expect(queryClient.getQueryState(queryKeys.customer)).toMatchObject({
      status: 'error',
    })
  })

  it('loads account data and filters transactions by category', async () => {
    const user = userEvent.setup()
    renderDashboard()

    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard')
    expect(
      await screen.findByRole('heading', { name: 'Good evening, Ava' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total available').nextElementSibling).toHaveTextContent(
      'SGD 17,120.55',
    )
    expect(screen.getByText('Across 2 deposit accounts')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(11)

    await user.type(
      screen.getByRole('searchbox', { name: 'Search transactions' }),
      'subscriptions',
    )

    expect(screen.getByText('Spotify')).toBeInTheDocument()
    expect(screen.queryByText('FairPrice Finest')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 result')

    await user.clear(
      screen.getByRole('searchbox', { name: 'Search transactions' }),
    )
    await user.type(
      screen.getByRole('searchbox', { name: 'Search transactions' }),
      'not-a-real-transaction',
    )

    expect(
      screen.getByText('No transactions match your search.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByText('FairPrice Finest')).toBeInTheDocument()
  })

  it('recovers when Retry refetches a failed dashboard request', async () => {
    let accountRequests = 0
    server.use(
      http.get('*/api/accounts', () => {
        accountRequests += 1
        if (accountRequests === 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          )
        }

        return HttpResponse.json({ accounts })
      }),
    )

    const user = userEvent.setup()
    renderDashboard()

    expect(
      await screen.findByRole('heading', {
        name: "We couldn't load your dashboard.",
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByRole('heading', { name: 'Good evening, Ava' }),
    ).toBeInTheDocument()
    expect(accountRequests).toBe(2)
  })

  it('shows explicit empty states for accounts and recent transactions', async () => {
    server.use(
      http.get('*/api/accounts', () =>
        HttpResponse.json({ accounts: [] }),
      ),
      http.get('*/api/transactions', () =>
        HttpResponse.json({ transactions: [], total: 0 }),
      ),
    )

    renderDashboard()

    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    expect(screen.getByText('No accounts are available.')).toBeInTheDocument()
    expect(screen.getByText('No recent transactions yet.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /New transfer/ }),
    ).toBeDisabled()
  })
})
