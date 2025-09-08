import AdminDashboard from './components/admin/AdminDashboard'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminDashboard />
      </div>
    </AuthProvider>
  )
}

export default App
