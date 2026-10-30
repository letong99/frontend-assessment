import { apiFetch } from './client'
import type {
  AccountsResponse,
  CustomerResponse,
  PayeesResponse,
  TransactionsResponse,
} from './types'

export const RECENT_TRANSACTIONS_LIMIT = 8
export const TRANSACTION_HISTORY_LIMIT = 50

const transactionsRoot = ['transactions'] as const

export const queryKeys = {
  customer: ['customer'] as const,
  accounts: ['accounts'] as const,
  transactionsRoot,
  transactions: (limit = RECENT_TRANSACTIONS_LIMIT) =>
    [...transactionsRoot, { limit }] as const,
  payees: ['payees'] as const,
}

export function fetchCustomer(signal?: AbortSignal): Promise<CustomerResponse> {
  return apiFetch<CustomerResponse>('/api/customer', { signal })
}

export function fetchAccounts(signal?: AbortSignal): Promise<AccountsResponse> {
  return apiFetch<AccountsResponse>('/api/accounts', { signal })
}

export function fetchTransactions(
  signal?: AbortSignal,
  limit = RECENT_TRANSACTIONS_LIMIT,
): Promise<TransactionsResponse> {
  return apiFetch<TransactionsResponse>(`/api/transactions?limit=${limit}`, {
    signal,
  })
}

export function fetchPayees(signal?: AbortSignal): Promise<PayeesResponse> {
  return apiFetch<PayeesResponse>('/api/payees', { signal })
}
