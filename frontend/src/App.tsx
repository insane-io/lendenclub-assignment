import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MainLayout from './layouts/MainLayout'
import Qr from './pages/Qr'
import History from './pages/History'

function App() {
  const isAuthenticated = () => !!localStorage.getItem('access_token')

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />
  }

  const RedirectIfAuth = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated() ? <Navigate to="/" replace /> : children
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="history" element={<History />} />
          <Route path='/qr' element={<Qr />} />
        </Route>

        <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/signup" element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
