import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function CarregandoTelaCheia() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { autenticado, carregando, perfilUsuario } = useAuth()

  if (carregando) {
    return <CarregandoTelaCheia />
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(perfilUsuario?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
