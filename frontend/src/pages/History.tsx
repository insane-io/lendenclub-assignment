import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

type Tx = {
  id: number
  type: 'debited' | 'credited'
  sender_name: string
  receiver_name: string
  amount: number
  created_at: string
  note?: string | null
}

type LayoutContext = { userDetails: any }

const History: React.FC = () => {
  const { userDetails } = useOutletContext<LayoutContext>()
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchTx = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.get('/transactions')
        if (!mounted) return
        // expect newest first already, but ensure sorted
        const data: Tx[] = Array.isArray(res.data) ? res.data : []
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setTxs(data)
      } catch (err: any) {
        console.error('Failed to load transactions', err)
        setError(err?.response?.data || err.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchTx()
    return () => { mounted = false }
  }, [])

  const totalSent = txs.filter(t => t.type === 'debited').reduce((s, t) => s + t.amount, 0)
  const totalReceived = txs.filter(t => t.type === 'credited').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="w-full md:w-3/4 p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        <div className="text-sm text-gray-500">{userDetails?.name || ''}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">Total Sent</div>
          <div className="text-xl font-semibold text-red-600">₹ {totalSent.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">Total Received</div>
          <div className="text-xl font-semibold text-green-600">₹ {totalReceived.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500">Transactions</div>
          <div className="text-xl font-semibold text-gray-900">{txs.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading && <div className="text-sm text-gray-500">Loading transactions...</div>}
        {error && <div className="text-sm text-red-600">{String(error)}</div>}

        {!loading && txs.length === 0 && !error && (
          <div className="text-sm text-gray-500">No transactions to show yet.</div>
        )}

        {!loading && txs.length > 0 && (
          <ul className="space-y-4">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center space-x-4">
                <div className="w-12 ">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${t.type === 'credited' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className="text-lg font-semibold">{t.type === 'credited' ? '+' : '-'}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium text-gray-800">{t.type === 'credited' ? t.sender_name : t.receiver_name}</div>
                    </div>
                    {/* amount moved to below with larger desktop font */}
                  </div>

                    <div className="mt-2 flex items-center justify-between w-full">
                      <div>
                        <div className="text-xs md:text-sm text-gray-400">{new Date(t.created_at).toLocaleString()}</div>
                        {t.note && <div className="text-sm text-gray-600 mt-1">{t.note}</div>}
                      </div>
                      <div>
                        <div className={`text-lg md:text-2xl font-semibold ${t.type === 'credited' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'credited' ? '+' : '-'} ₹ {t.amount.toLocaleString()}</div>
                      </div>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default History
