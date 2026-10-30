import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard onNewTransfer={vi.fn()} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.segment = 'retail'
})

afterEach(() => cleanup())

describe('Dashboard', () => {
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
})
