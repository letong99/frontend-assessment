import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  fetchAccounts,
  fetchCustomer,
  fetchTransactions,
  queryKeys,
} from '../../api/queries'
import type { Account, Customer, Segment, Transaction } from '../../api/types'
import { formatMoney, formatShortDate } from '../../lib/format'
import {
  PreferenceControls,
  usePreferences,
  type Theme,
} from '../preferences/Preferences'
import './dashboard.css'

interface DashboardProps {
  onNewTransfer: () => void
}

interface AppHeaderProps {
  segment: Segment
  theme: Theme
  onSegmentChange: (segment: Segment) => void
  onThemeToggle: () => void
}

function AppHeader({
  segment,
  theme,
  onSegmentChange,
  onThemeToggle,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#main-content" aria-label="Meridian home">
          <span className="brand__mark" aria-hidden="true">
            M
          </span>
          <span>Meridian</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#main-content" aria-current="page">
            Overview
          </a>
          <button type="button" disabled>
            Cards
          </button>
          <button type="button" disabled>
            Payments
          </button>
          <button type="button" disabled>
            Insights
          </button>
        </nav>

        <div className="app-header__actions">
          <PreferenceControls
            theme={theme}
            segment={segment}
            onThemeToggle={onThemeToggle}
            onSegmentChange={onSegmentChange}
          />
          <span className="avatar" aria-label="Ava Chen">
            AC
          </span>
        </div>
      </div>
    </header>
  )
}

function DashboardSkeleton() {
  return (
    <main id="main-content" className="dashboard-main dashboard-main--loading">
      <p className="visually-hidden" role="status">
        Loading dashboard
      </p>
      <div className="skeleton-stack" aria-hidden="true">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--hero" />
        <div className="skeleton-layout">
          <div className="skeleton-main">
            <div className="skeleton-grid">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
            <div className="skeleton skeleton--list" />
          </div>
          <div className="skeleton skeleton--rail" />
        </div>
      </div>
    </main>
  )
}

interface DashboardErrorProps {
  isRetrying: boolean
  onRetry: () => void
}

function DashboardError({ isRetrying, onRetry }: DashboardErrorProps) {
  return (
    <main id="main-content" className="dashboard-main">
      <section className="dashboard-error" role="alert">
        <div className="dashboard-error__icon" aria-hidden="true">
          !
        </div>
        <h1>We couldn't load your dashboard.</h1>
        <p>Please check your connection and try again.</p>
        <button
          className="button button--primary"
          type="button"
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? 'Retrying…' : 'Retry'}
        </button>
      </section>
    </main>
  )
}

function AccountCard({ account }: { account: Account }) {
  const isCredit = account.type === 'credit'

  return (
    <li className={`account-card account-card--${account.type}`}>
      <div>
        <h3>{account.name}</h3>
        <p className="account-card__number">{account.maskedNumber}</p>
      </div>
      <div>
        <p className="account-card__balance amount">
          {formatMoney(account.balance)}
        </p>
        {isCredit ? <p className="account-card__due">Amount due</p> : null}
      </div>
    </li>
  )
}

function displayCategory(category: string): string {
  return category.length === 0
    ? category
    : `${category.charAt(0).toUpperCase()}${category.slice(1)}`
}

function displayTransactionAmount(transaction: Transaction): string {
  if (transaction.direction === 'in') {
    return `+${formatMoney(transaction.amount)}`
  }

  return formatMoney(-transaction.amount)
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const incoming = transaction.direction === 'in'

  return (
    <li className="transaction-row">
      <div className="transaction-row__details">
        <strong>{transaction.description}</strong>
        <span>
          {displayCategory(transaction.category)} ·{' '}
          {formatShortDate(transaction.date)}
        </span>
      </div>
      <div className="transaction-row__amounts">
        <span
          className={`transaction-row__amount amount${incoming ? ' transaction-row__amount--incoming' : ''}`}
        >
          {displayTransactionAmount(transaction)}
        </span>
        {transaction.status === 'pending' ? (
          <span className="status-chip">Pending</span>
        ) : null}
      </div>
    </li>
  )
}

interface DashboardContentProps {
  accounts: Account[]
  customer: Customer
  onNewTransfer: () => void
  transactions: Transaction[]
}

function DashboardContent({
  accounts,
  customer,
  onNewTransfer,
  transactions,
}: DashboardContentProps) {
  const [search, setSearch] = useState('')
  const depositAccounts = accounts.filter((account) => account.type !== 'credit')
  const totalAvailable = depositAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  )
  const remainingLimit = Math.max(
    0,
    customer.dailyTransferLimit - customer.transferredToday,
  )
  const normalizedSearch = search.trim().toLowerCase()
  const filteredTransactions = useMemo(() => {
    if (!normalizedSearch) return transactions

    return transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(normalizedSearch) ||
        transaction.category.toLowerCase().includes(normalizedSearch),
    )
  }, [normalizedSearch, transactions])

  return (
    <main id="main-content" className="dashboard-main">
      <section className="welcome" aria-labelledby="welcome-title">
        <p className="eyebrow">Overview</p>
        <h1 id="welcome-title">Good evening, {customer.firstName}</h1>
      </section>

      <section className="balance-hero" aria-labelledby="total-title">
        <div>
          <p id="total-title">Total available</p>
          <p className="balance-hero__amount amount">
            {formatMoney(totalAvailable)}
          </p>
          <p>Across {depositAccounts.length} deposit accounts</p>
        </div>
        <button
          className="button button--primary new-transfer-button"
          type="button"
          disabled={depositAccounts.length === 0}
          onClick={onNewTransfer}
        >
          <span aria-hidden="true">+</span> New transfer
        </button>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-layout__primary">
          <section className="dashboard-section" aria-labelledby="accounts-title">
            <div className="section-heading">
              <h2 id="accounts-title">Accounts</h2>
            </div>
            {accounts.length === 0 ? (
              <div className="empty-state">
                <p>No accounts are available.</p>
              </div>
            ) : (
              <ul className="account-list">
                {accounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </ul>
            )}
          </section>

          <section
            className="dashboard-section transactions-section"
            aria-labelledby="transactions-title"
          >
            <div className="section-heading section-heading--transactions">
              <div>
                <h2 id="transactions-title">Recent transactions</h2>
                {normalizedSearch ? (
                  <p className="result-count" role="status">
                    {filteredTransactions.length}{' '}
                    {filteredTransactions.length === 1 ? 'result' : 'results'}
                  </p>
                ) : null}
              </div>
              <div className="search-control">
                <label className="visually-hidden" htmlFor="transaction-search">
                  Search transactions
                </label>
                <input
                  id="transaction-search"
                  type="search"
                  placeholder="Search transactions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {normalizedSearch ? (
                  <button type="button" onClick={() => setSearch('')}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>No recent transactions yet.</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions match your search.</p>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <ul className="transaction-list">
                {filteredTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="daily-limit" aria-labelledby="daily-limit-label">
          <p className="eyebrow" id="daily-limit-label">
            Daily limit
          </p>
          <h2 className="amount">
            {formatMoney(remainingLimit)}
          </h2>
          <p>remaining today</p>
          <hr />
          <p>Resets daily. Applies to all transfers.</p>
        </aside>
      </div>
    </main>
  )
}

export default function Dashboard({ onNewTransfer }: DashboardProps) {
  const customerQuery = useQuery({
    queryKey: queryKeys.customer,
    queryFn: ({ signal }) => fetchCustomer(signal),
    retry: false,
  })
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => fetchAccounts(signal),
    retry: false,
  })
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions(8),
    queryFn: ({ signal }) => fetchTransactions(signal, 8),
    retry: false,
  })
  const preferences = usePreferences(customerQuery.data?.customer.segment)

  const queries = [customerQuery, accountsQuery, transactionsQuery]
  const isPending = queries.some((query) => query.isPending)
  const hasDashboardData = Boolean(
    customerQuery.data && accountsQuery.data && transactionsQuery.data,
  )
  const shouldShowDashboardError = !isPending && !hasDashboardData
  const isRetrying = queries.some((query) => query.isFetching)

  const retryDashboard = () => {
    void Promise.all([
      customerQuery.refetch(),
      accountsQuery.refetch(),
      transactionsQuery.refetch(),
    ])
  }

  return (
    <div className="dashboard-shell">
      <AppHeader
        theme={preferences.theme}
        segment={preferences.segment}
        onThemeToggle={preferences.toggleTheme}
        onSegmentChange={preferences.setSegment}
      />
      {isPending ? <DashboardSkeleton /> : null}
      {shouldShowDashboardError ? (
        <DashboardError
          isRetrying={isRetrying}
          onRetry={retryDashboard}
        />
      ) : null}
      {!isPending &&
      !shouldShowDashboardError &&
      customerQuery.data &&
      accountsQuery.data &&
      transactionsQuery.data ? (
        <DashboardContent
          accounts={accountsQuery.data.accounts}
          customer={customerQuery.data.customer}
          transactions={transactionsQuery.data.transactions}
          onNewTransfer={onNewTransfer}
        />
      ) : null}
    </div>
  )
}
