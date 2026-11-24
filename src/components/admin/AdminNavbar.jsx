import { useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { encerrarSessao } from '../../services/authService'

const abasAdmin = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/locais', label: 'Locais' },
  { to: '/admin/solicitacoes', label: 'Solicitações' },
  { to: '/admin/aulas-extras', label: 'Aulas Extras' },
  { to: '/admin/contas', label: 'Gerenciamento de contas' },
  { to: '/admin/qrcodes', label: 'Gerenciar QR Codes' },
]

export default function AdminNavbar() {
  const navigate = useNavigate()

  const handleSair = useCallback(async () => {
    await encerrarSessao()
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <>
      <nav className="topbar">
        <div className="container topbar-inner">
          <div className="brand-wrap">
            <span className="brand-mark">SIGER</span>
            <span className="brand-title">Painel Administrativo</span>
          </div>
          <div className="topbar-actions">
            <Link to="/dashboard" className="topbar-admin-link" aria-label="Ir ao dashboard">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="3.5" y="4" width="7" height="7" rx="1" />
                <rect x="13.5" y="4" width="7" height="7" rx="1" />
                <rect x="3.5" y="14" width="7" height="6" rx="1" />
                <rect x="13.5" y="14" width="7" height="6" rx="1" />
              </svg>
              Ir ao dashboard
            </Link>
            <button type="button" className="btn btn-light btn-sm" onClick={handleSair}>
              Sair
            </button>
          </div>
        </div>
      </nav>
      <div className="container app-shell">
        <div className="card shell-card mb-4">
          <div className="tab-nav admin-tabs" role="tablist" aria-label="Navegação do admin">
            {abasAdmin.map(({ to, label, end }) => (
              <NavLink
                key={to}
                end={end}
                to={to}
                className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}