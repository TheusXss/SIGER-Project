import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { autenticarUsuario, traduzirErroFirebase } from '../services/authService'

export default function Login() {
  const { autenticado, carregando: carregandoAuth } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!carregandoAuth && autenticado) {
    const destino = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha para continuar.')
      return
    }

    setEnviando(true)
    try {
      await autenticarUsuario({ email: email.trim(), senha })
      // onAuthStateChanged cuida do redirecionamento
    } catch (error) {
      setErro(traduzirErroFirebase(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 400 }}>
        <div className="card-body p-4">
          <h1 className="h4 text-center mb-1">Sistema Integrado de Gestão de Espaços e Reservas</h1>
          <p className="text-center text-muted mb-4">Entrar com e-mail institucional</p>

          {erro && (
            <div className="alert alert-danger py-2" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="nome@ifsul.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="senha" className="form-label">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className="form-control"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
