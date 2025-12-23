import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import useSSE from '../sse/useSSE'
import { toast } from 'react-toastify'

const MobileTopBar: React.FC<{ balance?: any }> = ({ balance }) => {

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="md:hidden w-full bg-white p-3 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center space-x-3 text-primary">
        <span className="material-icons text-2xl">account_balance_wallet</span>
        <h1 className="text-lg font-semibold text-gray-800">FinApp</h1>
      </div>
      <div className="text-right flex items-center gap-6">
        <div className='flex flex-col'>
        <div className="text-xs text-gray-500">Balance</div>
        <div className="text-lg font-bold">₹ {balance ?? '0.00'}</div>
        </div>
        <span onClick={handleLogout} className="material-icons text-red-600">logout</span>
      </div>
    </div>
  )
}

const MainLayout: React.FC = () => {
  const [userDetails, setUserDetails] = useState<any>({})

  useEffect(() => {
    let mounted = true
    async function getDetails() {
      try {
        const response = await axiosInstance.get('/auth/me')
        if (mounted) setUserDetails(response.data)
      } catch (err) {
        // ignore for now
        console.error('Failed to fetch user details', err)
      }
    }
    getDetails()
    return () => { mounted = false }
  }, [])

  // Start SSE and handle incoming transfer events
  useSSE((data: any) => {
    if (!data || data.event !== 'transfer') return
    const meId = userDetails?.id
    if (!meId) {
      // if user not loaded yet, we can optionally refetch on first event
      return
    }
    if (data.receiver_id === meId) {
      setUserDetails((prev: any) => ({ ...(prev || {}), balance: data.receiver_balance }))
      toast.success(`Received ₹ ${data.amount}`)
    } else if (data.sender_id === meId) {
      // update local balance for sender, but avoid showing a duplicate toast
      setUserDetails((prev: any) => ({ ...(prev || {}), balance: data.sender_balance }))
      // UI that initiated the transfer already shows a success toast, so skip another one here
    }
  })

  return (
    <div className="w-full min-h-screen bg-surface-light rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-auto border border-gray-100">
      <Sidebar userDetails={userDetails} />

      {/* Mobile top bar with balance - visible only on small screens */}
      <MobileTopBar balance={userDetails?.balance} />

      {/* Render child route content. Provide userDetails and setter via outlet context */}
      <Outlet context={{ userDetails, setUserDetails }} />

      {/* Mobile bottom navigation */}
      <BottomNav />
      {/* ToastContainer is provided at application root in src/main.tsx */}
    </div>
  )
}

export default MainLayout
