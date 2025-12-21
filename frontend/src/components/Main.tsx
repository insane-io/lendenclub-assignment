import React from 'react'

type User = { id: number; name: string; email: string }

interface MainProps {
  amount: string
  amountInputRef: React.RefObject<HTMLInputElement | null>
  recipientInputRef: React.RefObject<HTMLInputElement | null>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  searchResults: User[]
  searchLoading: boolean
  searchError: string | null
  showResults: boolean
  setShowResults: React.Dispatch<React.SetStateAction<boolean>>
  selectedUser: User | null
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleAmountBlur: () => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  note: string
  setNote: React.Dispatch<React.SetStateAction<string>>
  transferLoading: boolean
  transferError: string | null
  setSearchResults: React.Dispatch<React.SetStateAction<User[]>>
  setSearchError: React.Dispatch<React.SetStateAction<string | null>>
}

const Main: React.FC<MainProps> = ({
  amount,
  amountInputRef,
  recipientInputRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLoading,
  searchError,
  showResults,
  setShowResults,
  selectedUser,
  setSelectedUser,
  handleAmountChange,
  handleAmountBlur,
  handleSubmit,
  note,
  setNote,
  transferLoading,
  transferError,
  setSearchResults,
  setSearchError,
}) => {
  return (
    <div className="w-full md:w-3/4 p-6 md:p-10 flex flex-col relative">
      <div className="hidden md:flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button className="md:hidden text-gray-500 hover:text-gray-700">
            <span className="material-icons">menu</span>
          </button>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Pay</h2>
          <p className="text-sm text-gray-500">Fast, secure payments</p>
        </div>
        <div className="flex items-center space-x-3">
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6">
          {/* Recipient Input - clean */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Send to</label>
            <div className="flex items-center gap-2">
              <input
                ref={recipientInputRef}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 transition-all outline-none"
                id="recipient"
                placeholder="Name or email"
                type="text"
                value={selectedUser ? selectedUser.email : searchQuery}
                onChange={(e) => {
                  const q = e.target.value
                  if (selectedUser) setSelectedUser(null)
                  setSearchQuery(q)
                  setShowResults(Boolean(q))
                  setSearchError(null)
                }}
                onFocus={() => setShowResults(Boolean(searchQuery))}
              />
            </div>

            {/* Search results dropdown */}
            {showResults && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-auto">
                {searchLoading && <div className="p-3 text-sm text-gray-500">Searching...</div>}
                {searchError && <div className="p-3 text-sm text-red-500">{searchError}</div>}
                {!searchLoading && !searchError && searchResults.length === 0 && searchQuery && (
                  <div className="p-3 text-sm text-gray-500">No results</div>
                )}
                {!searchLoading &&
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchQuery('')
                        setShowResults(false)
                        setSearchResults([])
                        setSearchError(null)
                      }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">Select</div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Amount Card - refined */}
          <div className="bg-white rounded-xl shadow p-6">
            <label className="block text-sm text-gray-600 mb-2">Amount</label>
            <div className="flex items-end gap-4">
              <div className="flex items-center text-gray-500 text-2xl">₹</div>
              <input
                ref={amountInputRef}
                value={amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                inputMode="decimal"
                className="text-4xl md:text-5xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 text-left flex-1"
                placeholder="0.00"
                type="text"
                style={{ outline: 'none' }}
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Note (optional)</label>
            <div>
              <input
                className="w-full py-3 px-4 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 transition-all outline-none"
                id="note"
                placeholder="Add a note (e.g., Rent, Dinner)"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          {transferError && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{transferError}</div>}
          <button
            disabled={transferLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 ${
              transferLoading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            type="submit"
          >
            <span>{transferLoading ? 'Sending...' : 'Pay now'}</span>
            <span className="material-icons text-white">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Main
