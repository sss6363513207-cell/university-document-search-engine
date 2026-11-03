import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/student/Dashboard'
import SearchPage from '../pages/student/SearchPage'
import DocumentsPage from '../pages/student/DocumentsPage'
import UploadPage from '../pages/faculty/UploadPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import IndexManagement from '../pages/admin/IndexManagement'
import UserManagement from '../pages/admin/UserManagement'
import SystemHealth from '../pages/admin/SystemHealth'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/indexes" element={<IndexManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/system-health" element={<SystemHealth />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}