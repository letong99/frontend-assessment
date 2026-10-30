import type { CreateTransferRequest } from '../../api/types'
import type { TransferFormValues } from './transferSchema'

export function toCreateTransferRequest(
  values: TransferFormValues,
): CreateTransferRequest {
  const note = values.note.trim()
  const common = {
    fromAccountId: values.fromAccountId,
    amount: Number(values.amount.trim()),
    ...(note ? { note } : {}),
  }

  if (values.recipientMode === 'saved') {
    return {
      ...common,
      payeeId: values.payeeId,
    }
  }

  return {
    ...common,
    recipient: {
      name: values.recipient.name.trim(),
      accountNumber: values.recipient.accountNumber.trim(),
      bank: values.recipient.bank.trim(),
    },
  }
}
