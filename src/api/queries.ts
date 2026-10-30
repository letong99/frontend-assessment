import { apiFetch } from './client'
import type {
  AccountsResponse,
  CustomerResponse,
  PayeesResponse,
  TransactionsResponse,
} from './types'

export const queryKeys = {
  customer: ['customer'] as const,
  accounts: ['accounts'] as const,
  transactions: (limit = 8) => ['transactions', { limit }] as const,
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
  limit = 8,
): Promise<TransactionsResponse> {
  return apiFetch<TransactionsResponse>(`/api/transactions?limit=${limit}`, {
    signal,
  })
}

export function fetchPayees(signal?: AbortSignal): Promise<PayeesResponse> {
  return apiFetch<PayeesResponse>('/api/payees', { signal })
}
