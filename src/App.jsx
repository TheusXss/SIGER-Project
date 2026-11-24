import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

const Login = lazy(() => import('./pages/Login'))
const Cadastro = lazy(() => import('./pages/Cadastro'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
<<<<<<< HEAD
const Locais = lazy(() => import('./pages/admin/Locais'))
const Solicitacoes = lazy(() => import('./pages/admin/Solicitacoes'))
=======
const AulasExtras = lazy(() => import('./pages/AulasExtras'))
const Locais = lazy(() => import('./pages/admin/Locais'))
const Solicitacoes = lazy(() => import('./pages/admin/Solicitacoes'))
const Contas = lazy(() => import('./pages/admin/contas'))
const PresencasAdmin = lazy(() => import('./pages/admin/Presencas'))
>>>>>>> 4fcfbac (atualização geral)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="d-flex justify-content-center align-items-center vh-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
<<<<<<< HEAD
=======
              path="/admin/aulas-extras"
              element={
                <AdminRoute>
                  <AulasExtras modo="gerenciar" />
                </AdminRoute>
              }
            />
            <Route
>>>>>>> 4fcfbac (atualização geral)
              path="/admin/locais"
              element={
                <AdminRoute>
                  <Locais />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/solicitacoes"
              element={
                <AdminRoute>
                  <Solicitacoes />
                </AdminRoute>
              }
            />
<<<<<<< HEAD
=======
            <Route
              path="/admin/contas"
              element={
                <AdminRoute>
                  <Contas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/qrcodes"
              element={
                <AdminRoute>
                  <PresencasAdmin />
                </AdminRoute>
              }
            />
>>>>>>> 4fcfbac (atualização geral)
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
