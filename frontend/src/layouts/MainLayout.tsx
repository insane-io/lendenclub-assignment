import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'

const MobileTopBar: React.FC<{ balance?: any }> = ({ balance }) => {
  return (
    <div className="md:hidden w-full bg-white p-3 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center space-x-3 text-primary">
        <span className="material-icons text-2xl">account_balance_wallet</span>
        <h1 className="text-lg font-semibold text-gray-800">FinApp</h1>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-500">Balance</div>
        <div className="text-lg font-bold">₹ {balance ?? '0.00'}</div>
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

  return (
    <div className="w-full min-h-screen bg-surface-light rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-auto border border-gray-100">
      <Sidebar userDetails={userDetails} />

      {/* Mobile top bar with balance - visible only on small screens */}
      <MobileTopBar balance={userDetails?.balance} />

      {/* Render child route content. Provide userDetails and setter via outlet context */}
      <Outlet context={{ userDetails, setUserDetails }} />

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}

export default MainLayout
