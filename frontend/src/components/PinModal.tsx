import React, { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => void
  loading?: boolean
  error?: string | null
}

const PinModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, loading, error }) => {
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!/^\d{4,6}$/.test(pin)) return
    onConfirm(pin)
    setPin("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Enter Payment PIN</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your 4-6 digit payment PIN to confirm this transaction.</p>

        <div className="relative">
          <input
            autoFocus
            inputMode="numeric"
            className="w-full py-3 px-4 rounded-md border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 outline-none"
            type={show ? 'text' : 'password'}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-blue-500"
            onClick={() => setShow((s) => !s)}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        {!error && pin && !/^\d{4,6}$/.test(pin) && (
          <div className="text-sm text-yellow-700 mt-3">PIN must be 4-6 digits</div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="px-4 py-2 rounded-md bg-gray-100 text-gray-700" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleConfirm}
            disabled={loading || !/^\d{4,6}$/.test(pin)}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PinModal
