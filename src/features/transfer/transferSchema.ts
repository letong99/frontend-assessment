import { z } from 'zod'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'

export type RecipientMode = 'saved' | 'new'

export interface TransferFormValues {
  recipientMode: RecipientMode
  payeeId: string
  recipient: {
    name: string
    accountNumber: string
    bank: string
  }
  fromAccountId: string
  amount: string
  note: string
}

export const defaultTransferValues: TransferFormValues = {
  recipientMode: 'saved',
  payeeId: '',
  recipient: {
    name: '',
    accountNumber: '',
    bank: '',
  },
  fromAccountId: '',
  amount: '',
  note: '',
}

const baseTransferSchema = z.object({
  recipientMode: z.enum(['saved', 'new']),
  payeeId: z.string(),
  recipient: z.object({
    name: z.string(),
    accountNumber: z.string(),
    bank: z.string(),
  }),
  fromAccountId: z.string(),
  amount: z.string(),
  note: z.string(),
})

function fieldIssue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  message: string,
) {
  context.addIssue({ code: 'custom', path, message })
}

export function createTransferSchema(
  accounts: Account[],
  remainingDailyLimit: number,
) {
  return baseTransferSchema.superRefine((values, context) => {
    if (values.recipientMode === 'saved') {
      if (!values.payeeId) {
        fieldIssue(context, ['payeeId'], 'Choose a recipient.')
      }
    } else {
      const nameLength = values.recipient.name.trim().length
      if (nameLength < 2 || nameLength > 50) {
        fieldIssue(
          context,
          ['recipient', 'name'],
          'Enter a recipient name between 2 and 50 characters.',
        )
      }

      if (!/^\d{8}$/.test(values.recipient.accountNumber.trim())) {
        fieldIssue(
          context,
          ['recipient', 'accountNumber'],
          'Enter a valid 8-digit account number.',
        )
      }

      const bankLength = values.recipient.bank.trim().length
      if (bankLength < 2 || bankLength > 30) {
        fieldIssue(
          context,
          ['recipient', 'bank'],
          'Enter a bank name between 2 and 30 characters.',
        )
      }
    }

    const selectedAccount = accounts.find(
      (account) =>
        account.id === values.fromAccountId && account.type !== 'credit',
    )

    if (!selectedAccount) {
      fieldIssue(
        context,
        ['fromAccountId'],
        'Choose an account to transfer from.',
      )
    }

    const amountText = values.amount.trim()
    if (!amountText) {
      fieldIssue(context, ['amount'], 'Enter an amount.')
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(amountText)) {
      const hasTooManyDecimals = /^\d+\.\d{3,}$/.test(amountText)
      fieldIssue(
        context,
        ['amount'],
        hasTooManyDecimals
          ? 'Use at most 2 decimal places.'
          : 'Enter a valid amount.',
      )
    } else {
      const amount = Number(amountText)
      if (amount < 1) {
        fieldIssue(
          context,
          ['amount'],
          'Enter an amount of at least SGD 1.00.',
        )
      } else if (selectedAccount && amount > selectedAccount.balance) {
        fieldIssue(
          context,
          ['amount'],
          `Amount can't be more than your available balance (${formatMoney(selectedAccount.balance)}).`,
        )
      } else if (amount > remainingDailyLimit) {
        fieldIssue(
          context,
          ['amount'],
          `This transfer exceeds your remaining daily limit (${formatMoney(remainingDailyLimit)}).`,
        )
      }
    }

    if (values.note.length > 50) {
      fieldIssue(
        context,
        ['note'],
        'Keep the note to 50 characters or fewer.',
      )
    }
  })
}
