import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
