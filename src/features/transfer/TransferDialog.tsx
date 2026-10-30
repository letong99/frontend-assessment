import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  useForm,
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormSetError,
} from 'react-hook-form'
import { ApiError } from '../../api/client'
import {
  fetchAccounts,
  fetchCustomer,
  fetchPayees,
  queryKeys,
} from '../../api/queries'
import { createTransfer } from '../../api/transfers'
import type { Payee, TransferResponse } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { toCreateTransferRequest } from './transferRequest'
import {
  createTransferSchema,
  defaultTransferValues,
  type TransferFormValues,
} from './transferSchema'
import './transfer.css'

type TransferStep = 'recipient' | 'amount' | 'review'
type SyncStatus = 'idle' | 'syncing' | 'ready' | 'error'

interface TransferDialogProps {
  open: boolean
  onClose: () => void
}

const GENERAL_SEND_ERROR =
  "Something went wrong. Your money hasn't left your account. Try again."

const serverFieldMap: Record<string, FieldPath<TransferFormValues>> = {
  fromAccountId: 'fromAccountId',
  payeeId: 'payeeId',
  'recipient.name': 'recipient.name',
  'recipient.accountNumber': 'recipient.accountNumber',
  'recipient.bank': 'recipient.bank',
  amount: 'amount',
  note: 'note',
}

function freshValues(fromAccountId = ''): TransferFormValues {
  return {
    ...defaultTransferValues,
    recipient: { ...defaultTransferValues.recipient },
    fromAccountId,
  }
}

function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.slice(-4)}`
}

function closeNativeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') {
    dialog.close()
  } else {
    dialog.removeAttribute('open')
  }
}

function openNativeDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal()
  } else {
    dialog.setAttribute('open', '')
  }
}

function applyServerFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
) {
  for (const [serverPath, message] of Object.entries(error.fields ?? {})) {
    const formPath = serverFieldMap[serverPath]
    if (formPath) {
      setError(formPath as FieldPath<T>, { type: 'server', message })
    }
  }
}

export default function TransferDialog({
  open,
  onClose,
}: TransferDialogProps) {
  const queryClient = useQueryClient()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const submitLockRef = useRef(false)
  const syncRunRef = useRef(0)

  const [step, setStep] = useState<TransferStep>('recipient')
  const [payeeSearch, setPayeeSearch] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [serverFieldMessages, setServerFieldMessages] = useState<string[]>([])
  const [success, setSuccess] = useState<TransferResponse | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  const customerQuery = useQuery({
    queryKey: queryKeys.customer,
    queryFn: ({ signal }) => fetchCustomer(signal),
    retry: false,
    enabled: open,
  })
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => fetchAccounts(signal),
    retry: false,
    enabled: open,
  })
  const payeesQuery = useQuery({
    queryKey: queryKeys.payees,
    queryFn: ({ signal }) => fetchPayees(signal),
    retry: false,
    enabled: open,
  })

  const accounts = accountsQuery.data?.accounts
  const depositAccounts = useMemo(
    () => (accounts ?? []).filter((account) => account.type !== 'credit'),
    [accounts],
  )
  const remainingDailyLimit = customerQuery.data
    ? Math.max(
        0,
        customerQuery.data.customer.dailyTransferLimit -
          customerQuery.data.customer.transferredToday,
      )
    : 0
  const schema = useMemo(
    () => createTransferSchema(accounts ?? [], remainingDailyLimit),
    [accounts, remainingDailyLimit],
  )

  const {
    register,
    control,
    setValue,
    setError,
    clearErrors,
    trigger,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: freshValues(),
    mode: 'onBlur',
    shouldUnregister: false,
  })

  // RHF types a whole-form watch as deeply optional even when complete
  // defaultValues are supplied. This form never unregisters fields, so the
  // runtime shape remains TransferFormValues throughout the workflow.
  const values = useWatch({ control }) as TransferFormValues
  const recipientMode = values.recipientMode
  const selectedAccount = depositAccounts.find(
    (account) => account.id === values.fromAccountId,
  )
  const selectedPayee = payeesQuery.data?.payees.find(
    (payee) => payee.id === values.payeeId,
  )
  const noteLength = values.note.length

  const filteredPayees = useMemo(() => {
    const query = payeeSearch.trim().toLowerCase()
    const payees = payeesQuery.data?.payees ?? []
    if (!query) return payees
    return payees.filter(
      (payee) =>
        payee.name.toLowerCase().includes(query) ||
        payee.bank.toLowerCase().includes(query),
    )
  }, [payeeSearch, payeesQuery.data?.payees])

  const dialogDataError = customerQuery.isError || accountsQuery.isError
  const dialogDataPending = customerQuery.isPending || accountsQuery.isPending

  const mutation = useMutation({
    mutationFn: createTransfer,
    retry: false,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      openNativeDialog(dialog)
    }

    if (!open && dialog.open) {
      closeNativeDialog(dialog)
    }

    return () => {
      if (dialog.open) closeNativeDialog(dialog)
    }
  }, [open])

  useEffect(() => {
    if (!open || values.fromAccountId || depositAccounts.length === 0) return
    setValue('fromAccountId', depositAccounts[0].id)
  }, [depositAccounts, open, setValue, values.fromAccountId])

  useEffect(() => {
    if (!open || dialogDataPending || dialogDataError) return

    const timeout = window.setTimeout(() => {
      if (success) {
        successHeadingRef.current?.focus()
      } else {
        stepHeadingRef.current?.focus()
      }
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [dialogDataError, dialogDataPending, open, step, success])

  function resetWorkflow() {
    syncRunRef.current += 1
    submitLockRef.current = false
    setStep('recipient')
    setPayeeSearch('')
    setSubmitError(null)
    setServerFieldMessages([])
    setSuccess(null)
    setSyncStatus('idle')
    mutation.reset()
    reset(freshValues(depositAccounts[0]?.id ?? ''))
  }

  function requestClose() {
    if (mutation.isPending || (success && syncStatus !== 'ready')) return

    const dialog = dialogRef.current
    if (dialog?.open) closeNativeDialog(dialog)
    resetWorkflow()
    onClose()
    window.setTimeout(() => openerRef.current?.focus(), 0)
  }

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    requestClose()
  }

  async function continueFromRecipient() {
    setSubmitError(null)
    setServerFieldMessages([])
    const fields: FieldPath<TransferFormValues>[] =
      recipientMode === 'saved'
        ? ['payeeId']
        : [
            'recipient.name',
            'recipient.accountNumber',
            'recipient.bank',
          ]
    if (await trigger(fields, { shouldFocus: true })) setStep('amount')
  }

  async function continueFromAmount() {
    setSubmitError(null)
    setServerFieldMessages([])
    const fields: FieldPath<TransferFormValues>[] = [
      'fromAccountId',
      'amount',
      'note',
    ]
    if (await trigger(fields, { shouldFocus: true })) setStep('review')
  }

  async function synchronizeDashboard() {
    const run = syncRunRef.current + 1
    syncRunRef.current = run
    setSyncStatus('syncing')

    try {
      await Promise.all([
        queryClient.refetchQueries(
          { queryKey: queryKeys.customer, type: 'active' },
          { throwOnError: true },
        ),
        queryClient.refetchQueries(
          { queryKey: queryKeys.accounts, type: 'active' },
          { throwOnError: true },
        ),
        queryClient.refetchQueries(
          { queryKey: queryKeys.transactions(8), type: 'active' },
          { throwOnError: true },
        ),
      ])
      if (syncRunRef.current === run) setSyncStatus('ready')
    } catch {
      if (syncRunRef.current === run) setSyncStatus('error')
    }
  }

  async function handleConfirm() {
    if (submitLockRef.current || mutation.isPending) return
    submitLockRef.current = true

    try {
      if (!(await trigger(undefined, { shouldFocus: true }))) return

      setSubmitError(null)
      setServerFieldMessages([])
      clearErrors()
      const response = await mutation.mutateAsync(
        toCreateTransferRequest(values),
      )
      setSuccess(response)
      void synchronizeDashboard()
    } catch (error) {
      if (error instanceof ApiError) {
        applyServerFieldErrors(error, setError)
        setServerFieldMessages(Object.values(error.fields ?? {}))
        setSubmitError(
          error.fields && Object.keys(error.fields).length > 0
            ? error.message
            : GENERAL_SEND_ERROR,
        )
      } else {
        setServerFieldMessages([])
        setSubmitError(GENERAL_SEND_ERROR)
      }
    } finally {
      submitLockRef.current = false
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  function chooseSavedRecipient(payee: Payee) {
    setValue('recipientMode', 'saved')
    setValue('payeeId', payee.id, { shouldValidate: true })
    clearErrors(['payeeId', 'recipient'])
  }

  function chooseNewRecipient() {
    setValue('recipientMode', 'new')
    setValue('payeeId', '')
    clearErrors('payeeId')
  }

  const recipientSummary = selectedPayee
    ? {
        name: selectedPayee.name,
        bank: selectedPayee.bank,
        accountNumberMasked: selectedPayee.accountNumberMasked,
      }
    : {
        name: values.recipient.name.trim(),
        bank: values.recipient.bank.trim(),
        accountNumberMasked: maskAccountNumber(
          values.recipient.accountNumber.trim(),
        ),
      }

  return (
    <dialog
      className="transfer-dialog"
      ref={dialogRef}
      aria-labelledby="transfer-dialog-title"
      onCancel={handleCancel}
    >
      {success ? (
        <section className="success-panel" aria-live="polite">
          <div className="success-mark" aria-hidden="true">
            ✓
          </div>
          <h2
            id="transfer-dialog-title"
            ref={successHeadingRef}
            tabIndex={-1}
          >
            Transfer sent
          </h2>
          <p className="success-amount amount">
            {formatMoney(success.transfer.amount)}
          </p>
          <p>
            to {success.transfer.recipient.name} ·{' '}
            {success.transfer.recipient.bank} ·{' '}
            <span className="account-number">
              {success.transfer.recipient.accountNumberMasked}
            </span>
          </p>
          <dl className="success-reference">
            <dt>Reference</dt>
            <dd>{success.transfer.reference}</dd>
          </dl>
          <p>The money should arrive within minutes.</p>

          {syncStatus === 'syncing' && (
            <p role="status">Updating dashboard…</p>
          )}
          {syncStatus === 'error' && (
            <div className="transfer-alert" role="alert">
              <p>
                Your transfer was sent, but we couldn't refresh the dashboard.
              </p>
              <button
                className="button-secondary"
                type="button"
                onClick={() => void synchronizeDashboard()}
              >
                Retry dashboard refresh
              </button>
            </div>
          )}

          <button
            className="button-primary success-back"
            type="button"
            disabled={syncStatus !== 'ready'}
            onClick={requestClose}
          >
            Back to dashboard
          </button>
        </section>
      ) : (
        <form className="transfer-form" onSubmit={handleSubmit} noValidate>
          <header className="transfer-header">
            <div>
              <p className="eyebrow">Transfer money</p>
              <h2 id="transfer-dialog-title">New transfer</h2>
            </div>
            <button
              className="dialog-close"
              type="button"
              aria-label="Close new transfer"
              disabled={mutation.isPending}
              onClick={requestClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <ol className="stepper" aria-label="Transfer progress">
            {(['recipient', 'amount', 'review'] as const).map(
              (stepName, index) => (
                <li
                  key={stepName}
                  aria-current={step === stepName ? 'step' : undefined}
                >
                  <span>{index + 1}</span>
                  {stepName[0].toUpperCase() + stepName.slice(1)}
                </li>
              ),
            )}
          </ol>

          <div className="transfer-body">
            {dialogDataPending && (
              <p role="status">Preparing your transfer…</p>
            )}
            {dialogDataError && (
              <div className="transfer-alert" role="alert">
                <p>We couldn't prepare this transfer.</p>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => {
                    void customerQuery.refetch()
                    void accountsQuery.refetch()
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {!dialogDataPending && !dialogDataError && step === 'recipient' && (
              <section aria-labelledby="recipient-step-title">
                <h3
                  id="recipient-step-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  Who are you sending to?
                </h3>

                <label className="field-label" htmlFor="payee-search">
                  Search payees
                </label>
                <input
                  className="text-input"
                  id="payee-search"
                  type="search"
                  value={payeeSearch}
                  placeholder="Search payees"
                  onChange={(event) => setPayeeSearch(event.target.value)}
                />

                {payeesQuery.isPending && <p role="status">Loading payees…</p>}
                {payeesQuery.isError && (
                  <div className="inline-state" role="alert">
                    <p>We couldn't load your saved payees.</p>
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => void payeesQuery.refetch()}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!payeesQuery.isPending && !payeesQuery.isError && (
                  <fieldset
                    className="payee-list"
                    aria-describedby={errors.payeeId ? 'payee-error' : undefined}
                  >
                    <legend className="sr-only">Saved payees</legend>
                    {filteredPayees.length > 0 ? (
                      filteredPayees.map((payee) => (
                        <label className="payee-option" key={payee.id}>
                          <input
                            type="radio"
                            name="saved-payee"
                            value={payee.id}
                            aria-describedby={
                              errors.payeeId ? 'payee-error' : undefined
                            }
                            checked={
                              recipientMode === 'saved' &&
                              values.payeeId === payee.id
                            }
                            onChange={() => chooseSavedRecipient(payee)}
                          />
                          <span className="payee-initials" aria-hidden="true">
                            {payee.initials}
                          </span>
                          <span>
                            <strong>{payee.name}</strong>
                            <small>
                              {payee.bank} · {payee.accountNumberMasked}
                            </small>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="inline-state">
                        {payeesQuery.data?.payees.length === 0
                          ? 'No saved payees yet.'
                          : 'No payees match your search.'}
                      </p>
                    )}
                  </fieldset>
                )}
                {errors.payeeId && (
                  <p className="field-error" id="payee-error">
                    {errors.payeeId.message}
                  </p>
                )}

                <button
                  className="new-recipient-toggle"
                  type="button"
                  aria-expanded={recipientMode === 'new'}
                  aria-controls="new-recipient-fields"
                  onClick={chooseNewRecipient}
                >
                  <span aria-hidden="true">＋</span> Send to someone new
                </button>

                {recipientMode === 'new' && (
                  <div
                    className="new-recipient-fields"
                    id="new-recipient-fields"
                  >
                    <label className="field-label" htmlFor="recipient-name">
                      Recipient name
                    </label>
                    <input
                      className="text-input"
                      id="recipient-name"
                      aria-invalid={Boolean(errors.recipient?.name)}
                      aria-describedby={
                        errors.recipient?.name ? 'recipient-name-error' : undefined
                      }
                      {...register('recipient.name')}
                    />
                    {errors.recipient?.name && (
                      <p className="field-error" id="recipient-name-error">
                        {errors.recipient.name.message}
                      </p>
                    )}

                    <label className="field-label" htmlFor="account-number">
                      Account number
                    </label>
                    <input
                      className="text-input account-number"
                      id="account-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-invalid={Boolean(
                        errors.recipient?.accountNumber,
                      )}
                      aria-describedby={
                        errors.recipient?.accountNumber
                          ? 'account-number-error'
                          : undefined
                      }
                      {...register('recipient.accountNumber')}
                    />
                    {errors.recipient?.accountNumber && (
                      <p className="field-error" id="account-number-error">
                        {errors.recipient.accountNumber.message}
                      </p>
                    )}

                    <label className="field-label" htmlFor="recipient-bank">
                      Bank
                    </label>
                    <input
                      className="text-input"
                      id="recipient-bank"
                      aria-invalid={Boolean(errors.recipient?.bank)}
                      aria-describedby={
                        errors.recipient?.bank ? 'recipient-bank-error' : undefined
                      }
                      {...register('recipient.bank')}
                    />
                    {errors.recipient?.bank && (
                      <p className="field-error" id="recipient-bank-error">
                        {errors.recipient.bank.message}
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {!dialogDataPending && !dialogDataError && step === 'amount' && (
              <section aria-labelledby="amount-step-title">
                <h3
                  id="amount-step-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  How much?
                </h3>

                {depositAccounts.length === 0 ? (
                  <p className="inline-state" role="alert">
                    No deposit account is available for this transfer.
                  </p>
                ) : (
                  <>
                    <label className="field-label" htmlFor="from-account">
                      From account
                    </label>
                    <select
                      className="text-input"
                      id="from-account"
                      aria-invalid={Boolean(errors.fromAccountId)}
                      aria-describedby={
                        errors.fromAccountId ? 'from-account-error' : undefined
                      }
                      {...register('fromAccountId')}
                    >
                      {depositAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} · {account.maskedNumber}
                        </option>
                      ))}
                    </select>
                    {errors.fromAccountId && (
                      <p className="field-error" id="from-account-error">
                        {errors.fromAccountId.message}
                      </p>
                    )}
                    <p className="field-hint">Deposit accounts only</p>

                    <label className="field-label" htmlFor="transfer-amount">
                      Amount
                    </label>
                    <div className="amount-input-wrap">
                      <span>SGD</span>
                      <input
                        id="transfer-amount"
                        inputMode="decimal"
                        autoComplete="off"
                        aria-invalid={Boolean(errors.amount)}
                        aria-describedby={
                          errors.amount ? 'amount-error' : 'amount-help'
                        }
                        {...register('amount')}
                      />
                    </div>
                    {errors.amount && (
                      <p className="field-error" id="amount-error">
                        {errors.amount.message}
                      </p>
                    )}

                    <div className="quick-amounts" aria-label="Quick amounts">
                      {[50, 100, 250, 500].map((amount) => (
                        <button
                          type="button"
                          key={amount}
                          onClick={() =>
                            setValue('amount', String(amount), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    <div className="balance-help" id="amount-help">
                      <span>
                        Available{' '}
                        {selectedAccount
                          ? formatMoney(selectedAccount.balance)
                          : '—'}
                      </span>
                      <span>
                        Remaining daily limit{' '}
                        {formatMoney(remainingDailyLimit)}
                      </span>
                    </div>

                    <div className="label-row">
                      <label className="field-label" htmlFor="transfer-note">
                        Note (optional)
                      </label>
                      <span>{noteLength}/50</span>
                    </div>
                    <textarea
                      className="text-input"
                      id="transfer-note"
                      rows={3}
                      aria-invalid={Boolean(errors.note)}
                      aria-describedby={
                        errors.note ? 'transfer-note-error' : undefined
                      }
                      {...register('note')}
                    />
                    {errors.note && (
                      <p className="field-error" id="transfer-note-error">
                        {errors.note.message}
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            {!dialogDataPending && !dialogDataError && step === 'review' && (
              <section aria-labelledby="review-step-title">
                <h3
                  id="review-step-title"
                  ref={stepHeadingRef}
                  tabIndex={-1}
                >
                  Check the details
                </h3>

                {submitError && (
                  <div className="transfer-alert" role="alert">
                    <p>{submitError}</p>
                    {serverFieldMessages.map((message, index) => (
                      <p key={`${message}-${index}`}>{message}</p>
                    ))}
                  </div>
                )}

                <dl className="review-list">
                  <div>
                    <dt>From</dt>
                    <dd>
                      {selectedAccount?.name} · {selectedAccount?.maskedNumber}
                    </dd>
                  </div>
                  <div>
                    <dt>To</dt>
                    <dd>
                      {recipientSummary.name} · {recipientSummary.bank} ·{' '}
                      {recipientSummary.accountNumberMasked}
                    </dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd className="amount">{formatMoney(Number(values.amount))}</dd>
                  </div>
                  <div>
                    <dt>Fee</dt>
                    <dd className="amount">{formatMoney(0)}</dd>
                  </div>
                  {values.note.trim() && (
                    <div>
                      <dt>Note</dt>
                      <dd>{values.note.trim()}</dd>
                    </div>
                  )}
                  <div className="review-total">
                    <dt>Total</dt>
                    <dd className="amount">{formatMoney(Number(values.amount))}</dd>
                  </div>
                </dl>
                <p className="arrival-note">Usually arrives in minutes.</p>
              </section>
            )}
          </div>

          <footer className="transfer-footer">
            {step === 'recipient' && (
              <>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={requestClose}
                >
                  Cancel
                </button>
                <button
                  className="button-primary"
                  type="button"
                  disabled={dialogDataPending || dialogDataError}
                  onClick={() => void continueFromRecipient()}
                >
                  Continue
                </button>
              </>
            )}
            {step === 'amount' && (
              <>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setStep('recipient')}
                >
                  Back
                </button>
                <button
                  className="button-primary"
                  type="button"
                  disabled={depositAccounts.length === 0}
                  onClick={() => void continueFromAmount()}
                >
                  Continue
                </button>
              </>
            )}
            {step === 'review' && (
              <>
                <button
                  className="button-secondary"
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => setStep('amount')}
                >
                  Back
                </button>
                <button
                  className="button-primary"
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => void handleConfirm()}
                >
                  {mutation.isPending ? 'Sending…' : 'Confirm transfer'}
                </button>
              </>
            )}
          </footer>
        </form>
      )}
    </dialog>
  )
}
