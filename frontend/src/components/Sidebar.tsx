import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

interface SidebarProps {
  userDetails: any
}

const Sidebar: React.FC<SidebarProps> = ({ userDetails }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()

    navigate('/login')
  }

  return (
    <div className="hidden md:flex md:w-1/3 bg-blue-50 p-8 flex-col justify-between border-r border-gray-100">
      
      {/* TOP SECTION */}
      <div>
        <div className="flex items-center space-x-3 mb-8 text-primary">
          <span className="material-icons text-3xl">account_balance_wallet</span>
          <h1 className="text-2xl font-bold text-gray-800">FinApp</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 py-8 rounded-xl shadow-sm border border-blue-100">
            <p className="text-sm text-secondary-text-light mb-1">Total Balance</p>
            <h2 className="text-5xl font-bold text-gray-900">
              ₹ {userDetails?.balance}
            </h2>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`
              }
            >
              <span className="material-icons">payment</span>
              <span>Pay</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`
              }
            >
              <span className="material-icons">history</span>
              <span>Transaction History</span>
            </NavLink>

            <NavLink
              to="/qr"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`
              }
            >
              <span className="material-icons">qr_code_scanner</span>
              <span>Scan QR Code</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* LOGOUT SECTION */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition"
      >
        <span className="material-icons">logout</span>
        <span>Logout</span>
      </button>
    </div>
  )
}

export default Sidebar
