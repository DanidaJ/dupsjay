import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminScanPage from './pages/AdminScanPage'
import BookingPage from './pages/BookingPage'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          {/* Make the app a column with min height so footer sticks to bottom when content is short */}
          <div className="min-h-screen flex flex-col overflow-hidden">
          <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin-Only Protected Routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/scans" element={<AdminScanPage />} />
            </Route>

            {/* Public booking route */}
            <Route path="/book" element={<BookingPage />} />
              </Routes>
            </main>
            {/* Footer will sit after main and at the bottom because of min-h-screen */}
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App