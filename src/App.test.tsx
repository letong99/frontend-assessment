import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
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

  const recipientHeading = await screen.findByRole('heading', {
    name: 'Who are you sending to?',
  })
  await waitFor(() => expect(recipientHeading).toHaveFocus())

  const jamie = await screen.findByRole('radio', { name: /Jamie Tan/ })
  await user.click(jamie)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  const amountHeading = await screen.findByRole('heading', { name: 'How much?' })
  await waitFor(() => expect(amountHeading).toHaveFocus())
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.segment = 'retail'
})

describe('Meridian transfer flow', () => {
  it('closes with the close control or Escape and restores opener focus', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    const opener = screen.getByRole('button', { name: /New transfer/ })

    await user.click(opener)
    const recipientHeading = await screen.findByRole('heading', {
      name: 'Who are you sending to?',
    })
    await waitFor(() => expect(recipientHeading).toHaveFocus())
    const dialog = document.querySelector('dialog')
    expect(dialog).not.toBeNull()
    expect(dialog).toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: 'Close new transfer' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    await waitFor(() => expect(opener).toHaveFocus())

    await user.click(opener)
    await screen.findByRole('heading', { name: 'Who are you sending to?' })
    fireEvent(dialog!, new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('supports arrow-key selection within the saved-payee radio group', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    await user.click(screen.getByRole('button', { name: /New transfer/ }))

    const jamie = await screen.findByRole('radio', { name: /Jamie Tan/ })
    const marcus = screen.getByRole('radio', { name: /Marcus Lee/ })
    jamie.focus()
    await user.keyboard('{ArrowDown}')

    expect(marcus).toHaveFocus()
    expect(marcus).toBeChecked()
    expect(jamie).not.toBeChecked()
  })

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
    expect(screen.getByLabelText('Amount')).toHaveFocus()
    expect(screen.getByLabelText('Amount')).toHaveAttribute(
      'aria-describedby',
      'amount-error',
    )
    expect(screen.getByLabelText('Amount')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(transferRequests).toBe(0)
  })

  it('retains review data after a failed transfer and allows a safe retry', async () => {
    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)

    await user.type(screen.getByLabelText('Amount'), '120')
    await user.type(screen.getByLabelText('Note (optional)'), '#fail')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Check the details' })

    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      "Something went wrong. Your money hasn't left your account. Try again.",
    )
    expect(
      screen.getByRole('heading', { name: 'Check the details' }),
    ).toBeInTheDocument()
    expect(screen.getByText('#fail')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Transfer sent' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Amount')).toHaveValue('120')
    expect(screen.getByLabelText('Note (optional)')).toHaveValue('#fail')
    await user.clear(screen.getByLabelText('Note (optional)'))
    await user.type(screen.getByLabelText('Note (optional)'), 'Dinner')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))

    const successHeading = await screen.findByRole('heading', {
      name: 'Transfer sent',
    })
    await waitFor(() => expect(successHeading).toHaveFocus())
  })

  it('maps backend field errors into the review alert and source field', async () => {
    server.use(
      http.post('*/api/transfers', () =>
        HttpResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Amount exceeds available balance.',
              fields: { amount: 'The available balance changed. Enter less.' },
            },
          },
          { status: 422 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)
    await user.type(screen.getByLabelText('Amount'), '120')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Check the details' })
    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Amount exceeds available balance.')
    expect(alert).toHaveTextContent('The available balance changed. Enter less.')
    expect(
      screen.queryByRole('heading', { name: 'Transfer sent' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    const amount = screen.getByLabelText('Amount')
    expect(amount).toHaveValue('120')
    expect(amount).toHaveAttribute('aria-describedby', 'amount-error')
    expect(
      screen.getByText('The available balance changed. Enter less.'),
    ).toBeInTheDocument()
  })

  it('recovers when saved payees fail to load', async () => {
    let payeeRequests = 0
    server.use(
      http.get('*/api/payees', () => {
        payeeRequests += 1
        if (payeeRequests === 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          )
        }

        return HttpResponse.json({
          payees: [
            {
              id: 'pay_001',
              name: 'Jamie Tan',
              bank: 'DBS',
              accountNumberMasked: '•••• 3391',
              initials: 'JT',
              lastUsedAt: '2026-10-19T09:10:00+08:00',
            },
          ],
        })
      }),
    )

    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    await user.click(screen.getByRole('button', { name: /New transfer/ }))

    expect(
      await screen.findByText("We couldn't load your saved payees."),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByRole('radio', { name: /Jamie Tan/ }),
    ).toBeInTheDocument()
    expect(payeeRequests).toBe(2)
  })

  it('keeps new-recipient entry available when there are no saved payees', async () => {
    server.use(
      http.get('*/api/payees', () => HttpResponse.json({ payees: [] })),
    )

    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    await user.click(screen.getByRole('button', { name: /New transfer/ }))

    expect(await screen.findByText('No saved payees yet.')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Send to someone new' }),
    )
    expect(screen.getByLabelText('Recipient name')).toBeInTheDocument()
    expect(screen.getByLabelText('Account number')).toBeInTheDocument()
    expect(screen.getByLabelText('Bank')).toBeInTheDocument()
  })

  it('sends a new recipient without a saved payee id', async () => {
    let requestBody: unknown
    server.use(
      http.post('*/api/transfers', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          {
            transfer: {
              id: 'trf_new',
              reference: 'TRF-NEW123',
              status: 'completed',
              fromAccountId: 'acc_checking',
              recipient: {
                name: 'Alex Lim',
                bank: 'OCBC',
                accountNumberMasked: '•••• 5678',
              },
              amount: 75,
              fee: 0,
              currency: 'SGD',
              note: 'Gift',
              createdAt: '2026-10-30T08:00:00.000Z',
            },
            account: { id: 'acc_checking', balance: 4205.55 },
            dailyLimit: { limit: 5000, used: 75, remaining: 4925 },
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    await user.click(screen.getByRole('button', { name: /New transfer/ }))
    await screen.findByRole('heading', { name: 'Who are you sending to?' })
    await user.click(
      screen.getByRole('button', { name: 'Send to someone new' }),
    )
    await user.type(screen.getByLabelText('Recipient name'), 'Alex Lim')
    await user.type(screen.getByLabelText('Account number'), '12345678')
    await user.type(screen.getByLabelText('Bank'), 'OCBC')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await screen.findByRole('heading', { name: 'How much?' })
    await user.type(screen.getByLabelText('Amount'), '75')
    await user.type(screen.getByLabelText('Note (optional)'), 'Gift')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText(/Alex Lim · OCBC · •••• 5678/)).toBeInTheDocument()
    expect(screen.queryByText('12345678')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))
    await screen.findByRole('heading', { name: 'Transfer sent' })

    expect(requestBody).toEqual({
      fromAccountId: 'acc_checking',
      amount: 75,
      note: 'Gift',
      recipient: {
        name: 'Alex Lim',
        accountNumber: '12345678',
        bank: 'OCBC',
      },
    })
    expect(requestBody).not.toHaveProperty('payeeId')
  })

  it('sends only one request when Confirm transfer is activated twice', async () => {
    let transferRequests = 0
    server.use(
      http.post('*/api/transfers', async () => {
        transferRequests += 1
        await delay(250)
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Simulated failure' } },
          { status: 500 },
        )
      }),
    )

    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)
    await user.type(screen.getByLabelText('Amount'), '120')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Check the details' })

    await user.dblClick(
      screen.getByRole('button', { name: 'Confirm transfer' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Sending…' }),
    ).toBeDisabled()
    await screen.findByRole('alert')
    expect(transferRequests).toBe(1)
  })

  it('keeps confirmed success visible until a failed dashboard refresh recovers', async () => {
    const user = userEvent.setup()
    renderApp()
    await reachAmountStep(user)
    await user.type(screen.getByLabelText('Amount'), '120')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Check the details' })

    let accountRefreshes = 0
    server.use(
      http.get('*/api/accounts', () => {
        accountRefreshes += 1
        if (accountRefreshes === 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Refresh failed' } },
            { status: 500 },
          )
        }

        return HttpResponse.json({
          accounts: [
            {
              id: 'acc_checking',
              name: 'Everyday Checking',
              type: 'checking',
              maskedNumber: '•••• 4821',
              balance: 4160.55,
              currency: 'SGD',
            },
            {
              id: 'acc_savings',
              name: 'Savings Plus',
              type: 'savings',
              maskedNumber: '•••• 9930',
              balance: 12840,
              currency: 'SGD',
            },
            {
              id: 'acc_credit',
              name: 'Rewards Card',
              type: 'credit',
              maskedNumber: '•••• 7712',
              balance: -420.3,
              currency: 'SGD',
            },
          ],
        })
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))
    expect(
      await screen.findByRole('heading', { name: 'Transfer sent' }),
    ).toBeInTheDocument()
    const dialog = document.querySelector('dialog')
    expect(await within(dialog!).findByRole('alert')).toHaveTextContent(
      "Your transfer was sent, but we couldn't refresh the dashboard.",
    )
    expect(
      screen.queryByText("We couldn't load your dashboard."),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Total available')).toBeInTheDocument()

    const backToDashboard = screen.getByRole('button', {
      name: 'Back to dashboard',
    })
    expect(backToDashboard).toBeDisabled()
    fireEvent(dialog!, new Event('cancel', { cancelable: true }))
    expect(dialog).toHaveAttribute('open')

    await user.click(
      screen.getByRole('button', { name: 'Retry dashboard refresh' }),
    )
    await waitFor(() => expect(backToDashboard).toBeEnabled())
    await user.click(backToDashboard)

    expect(accountRefreshes).toBe(2)
    expect(screen.getByText('Transfer to Jamie Tan')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Everyday Checking' }).parentElement
        ?.parentElement?.textContent,
    ).toContain(formatMoney(4160.55))
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
