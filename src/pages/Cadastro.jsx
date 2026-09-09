import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { cadastrarUsuario, emailInstitucionalValido, traduzirErroFirebase } from '../services/authService'
import { criarDocumentoUsuario } from '../services/userService'

const ESTADO_INICIAL = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  tipoConta: 'aluno',
}

export default function Cadastro() {
  const { autenticado, carregando: carregandoAuth, refreshPerfilUsuario } = useAuth()

  const [form, setForm] = useState(ESTADO_INICIAL)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!carregandoAuth && autenticado) {
    return <Navigate to="/dashboard" replace />
  }

  function handleChange(campo) {
    return (event) => {
      setForm((atual) => ({ ...atual, [campo]: event.target.value }))
    }
  }

  function validar() {
    const { nome, email, senha, confirmarSenha } = form

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      return 'Preencha todos os campos obrigatórios.'
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValido) {
      return 'Informe um e-mail em formato válido.'
    }

    if (!emailInstitucionalValido(email)) {
      return 'O cadastro é permitido somente com e-mail institucional (@ifsul.edu.br).'
    }

    if (senha.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.'
    }

    if (senha !== confirmarSenha) {
      return 'As senhas não coincidem.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    const mensagemValidacao = validar()
    if (mensagemValidacao) {
      setErro(mensagemValidacao)
      return
    }

    setEnviando(true)
    try {
      const { nome, email, senha, tipoConta } = form
      const usuario = await cadastrarUsuario({ nome: nome.trim(), email: email.trim(), senha })

      await criarDocumentoUsuario(usuario.uid, {
        name: nome.trim(),
        email: email.trim(),
        role: tipoConta,
      })

      await refreshPerfilUsuario(usuario.uid)

      setSucesso('Cadastro realizado com sucesso! Redirecionando...')
      // onAuthStateChanged cuida do redirecionamento para /dashboard
    } catch (error) {
      setErro(traduzirErroFirebase(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h1 className="h4 text-center mb-1">Criar conta</h1>
          <p className="text-center text-muted mb-4">Use seu e-mail institucional @ifsul.edu.br</p>

          {erro && (
            <div className="alert alert-danger py-2" role="alert">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="alert alert-success py-2" role="alert">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="nome" className="form-label">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                className="form-control"
                value={form.nome}
                onChange={handleChange('nome')}
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="nome@ifsul.edu.br"
                value={form.email}
                onChange={handleChange('email')}
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
                value={form.senha}
                onChange={handleChange('senha')}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmarSenha" className="form-label">
                Confirmar senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                className="form-control"
                value={form.confirmarSenha}
                onChange={handleChange('confirmarSenha')}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="tipoConta" className="form-label">
                Tipo de conta
              </label>
              <select
                id="tipoConta"
                className="form-select"
                value={form.tipoConta}
                onChange={(event) => setForm((atual) => ({ ...atual, tipoConta: event.target.value }))}
              >
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
