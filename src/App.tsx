import { useState } from 'react'
import Dashboard from './features/dashboard/Dashboard'
import TransferDialog from './features/transfer/TransferDialog'

export default function App() {
  const [transferOpen, setTransferOpen] = useState(false)

  return (
    <>
      <Dashboard onNewTransfer={() => setTransferOpen(true)} />
      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </>
  )
}
