import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const BottomNav: React.FC = () => {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-white shadow-lg rounded-xl p-2 flex items-center justify-between md:hidden z-50 border border-gray-100">
      <NavLink
        to="/history"
        className={({ isActive }) => `flex-1 text-center py-2 rounded-md ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
      >
        <div className="flex flex-col items-center text-sm">
          <span className="material-icons">history</span>
          <span className="text-xs">History</span>
        </div>
      </NavLink>

      <button
        onClick={() => navigate('/?openPay=1')}
        className="-mt-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        aria-label="Pay"
      >
        <span className="material-icons">payment</span>
      </button>

      <NavLink
        to="/qr"
        className={({ isActive }) => `flex-1 text-center py-2 rounded-md ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
      >
        <div className="flex flex-col items-center text-sm">
          <span className="material-icons">qr_code_scanner</span>
          <span className="text-xs">Scan</span>
        </div>
      </NavLink>
    </nav>
  )
}

export default BottomNav
