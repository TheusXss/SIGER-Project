import ProtectedRoute from './ProtectedRoute'

export default function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
}
