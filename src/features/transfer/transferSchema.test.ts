import { describe, expect, it } from 'vitest'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import {
  createTransferSchema,
  defaultTransferValues,
  type TransferFormValues,
} from './transferSchema'

const accounts: Account[] = [
  {
    id: 'checking',
    name: 'Checking',
    type: 'checking',
    maskedNumber: '•••• 1234',
    balance: 100,
    currency: 'SGD',
  },
  {
    id: 'credit',
    name: 'Credit',
    type: 'credit',
    maskedNumber: '•••• 9999',
    balance: -10,
    currency: 'SGD',
  },
]

function validValues(overrides: Partial<TransferFormValues> = {}) {
  return {
    ...defaultTransferValues,
    recipientMode: 'saved' as const,
    payeeId: 'payee',
    fromAccountId: 'checking',
    amount: '10.00',
    ...overrides,
  }
}

describe('createTransferSchema', () => {
  it('accepts valid decimal shapes and rejects a third decimal place', () => {
    const schema = createTransferSchema(accounts, 500)

    expect(schema.safeParse(validValues({ amount: '1' })).success).toBe(true)
    expect(schema.safeParse(validValues({ amount: '1.0' })).success).toBe(
      true,
    )
    expect(schema.safeParse(validValues({ amount: '1.00' })).success).toBe(
      true,
    )

    const result = schema.safeParse(validValues({ amount: '1.001' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toContain(
        'Use at most 2 decimal places.',
      )
    }
  })

  it('uses the selected balance before the daily limit', () => {
    const result = createTransferSchema(accounts, 50).safeParse(
      validValues({ amount: '101' }),
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toContain(
        `Amount can't be more than your available balance (${formatMoney(100)}).`,
      )
    }
  })

  it('validates only the active recipient branch', () => {
    const schema = createTransferSchema(accounts, 500)
    expect(schema.safeParse(validValues()).success).toBe(true)

    const result = schema.safeParse(
      validValues({
        recipientMode: 'new',
        payeeId: '',
        recipient: { name: 'A', accountNumber: '12', bank: '' },
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'recipient.name',
          'recipient.accountNumber',
          'recipient.bank',
        ]),
      )
    }
  })

  it('does not allow a credit account as the source', () => {
    const result = createTransferSchema(accounts, 500).safeParse(
      validValues({ fromAccountId: 'credit' }),
    )
    expect(result.success).toBe(false)
  })
})
