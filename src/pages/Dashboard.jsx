import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { encerrarSessao } from '../services/authService'
import { listarLocais } from '../services/locationService'
import {
  criarSolicitacao,
  listarSolicitacoesPorUsuario,
  atualizarStatusSolicitacao,
  STATUS_SOLICITACAO,
  STATUS_SOLICITACAO_LABELS,
  STATUS_SOLICITACAO_CORES,
} from '../services/solicitacaoService'

export default function Dashboard() {
  const { usuarioAtual, perfilUsuario } = useAuth()
  const navigate = useNavigate()

  const nomeExibido = perfilUsuario?.name || usuarioAtual?.displayName || 'usuário'
  const tipoUsuario = perfilUsuario?.role
  const ehAdmin = tipoUsuario === 'admin'
  const perfilLabel =
    tipoUsuario === 'admin' ? 'Administrador' : tipoUsuario === 'professor' ? 'Professor' : 'Aluno'

  const [locais, setLocais] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(true)

  const [localSelecionado, setLocalSelecionado] = useState('')
  const [dataReserva, setDataReserva] = useState('')
  const [horarioInicio, setHorarioInicio] = useState('')
  const [horarioFim, setHorarioFim] = useState('')
  const [proposito, setProposito] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [sucessoEnvio, setSucessoEnvio] = useState('')

  const [modalCancelar, setModalCancelar] = useState(null)
  const [processandoCancelar, setProcessandoCancelar] = useState(false)
  const [erroCancelar, setErroCancelar] = useState('')
  const [abaSolicitacoes, setAbaSolicitacoes] = useState('ativas')

  useEffect(() => {
    async function carregarDados() {
      try {
        const dadosLocais = await listarLocais()
        setLocais(dadosLocais.filter((l) => l.status === 'Disponível'))
      } catch (error) {
        console.error('Erro ao carregar locais:', error)
      }
    }
    carregarDados()
  }, [])

  async function carregarMinhasSolicitacoes() {
    if (!usuarioAtual?.uid) return
    setCarregandoSolicitacoes(true)
    try {
      const dados = await listarSolicitacoesPorUsuario(usuarioAtual.uid)
      setSolicitacoes(dados)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setCarregandoSolicitacoes(false)
    }
  }

  useEffect(() => {
    carregarMinhasSolicitacoes()
  }, [usuarioAtual?.uid])

  async function handleSair() {
    await encerrarSessao()
    navigate('/login', { replace: true })
  }

  async function handleEnviarSolicitacao(e) {
    e.preventDefault()
    setErroEnvio('')
    setSucessoEnvio('')

    if (!localSelecionado) {
      setErroEnvio('Por favor, selecione um local.')
      return
    }
    if (!dataReserva) {
      setErroEnvio('Por favor, selecione uma data.')
      return
    }
    if (!horarioInicio) {
      setErroEnvio('Por favor, informe o horário de início.')
      return
    }
    if (!horarioFim) {
      setErroEnvio('Por favor, informe o horário de término.')
      return
    }
    if (horarioInicio >= horarioFim) {
      setErroEnvio('O horário de término deve ser posterior ao horário de início.')
      return
    }
    if (!proposito.trim()) {
      setErroEnvio('Por favor, informe o propósito da reserva.')
      return
    }

    const localEncontrado = locais.find((l) => l.id === localSelecionado)

    setEnviando(true)
    try {
      await criarSolicitacao({
        localId: localSelecionado,
        localNome: localEncontrado?.name || '',
        dataReserva,
        horarioInicio,
        horarioFim,
        proposito,
        usuarioId: usuarioAtual.uid,
        usuarioNome: nomeExibido,
        usuarioEmail: usuarioAtual.email,
        usuarioTipo: tipoUsuario,
      })

      setSucessoEnvio('Solicitação enviada com sucesso!')
      setLocalSelecionado('')
      setDataReserva('')
      setHorarioInicio('')
      setHorarioFim('')
      setProposito('')
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error)
      setErroEnvio('Não foi possível enviar a solicitação. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  function abrirCancelar(solicitacao) {
    setModalCancelar(solicitacao)
    setErroCancelar('')
  }

  function fecharCancelar() {
    setModalCancelar(null)
    setErroCancelar('')
  }

  async function confirmarCancelar() {
    if (!modalCancelar) return
    setProcessandoCancelar(true)
    setErroCancelar('')
    try {
      await atualizarStatusSolicitacao(modalCancelar.id, {
        status: STATUS_SOLICITACAO.CANCELADA,
        observacaoAdmin: 'Solicitação cancelada pelo solicitante.',
      })
      fecharCancelar()
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error)
      setErroCancelar('Não foi possível cancelar a solicitação. Tente novamente.')
    } finally {
      setProcessandoCancelar(false)
    }
  }

  const STATUS_ATIVOS = [STATUS_SOLICITACAO.PENDENTE, STATUS_SOLICITACAO.EM_PROCESSO, STATUS_SOLICITACAO.APROVADA, STATUS_SOLICITACAO.REJEITADA, STATUS_SOLICITACAO.CANCELADA]
  const solicitacoesAtivas = solicitacoes.filter((s) => STATUS_ATIVOS.includes(s.status))
  const solicitacoesArquivadas = solicitacoes.filter((s) => s.status === STATUS_SOLICITACAO.ARQUIVADA)

  const solicitacoesExibidas = abaSolicitacoes === 'ativas' ? solicitacoesAtivas : solicitacoesArquivadas

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Sistema Integrado de Gestão de Espaços e Reservas</span>
        </div>
      </nav>

      <div className="container py-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body p-4 text-center">
            <h2 className="h5">Olá, {nomeExibido}!</h2>
            <p className="text-muted mb-2">E-mail: {usuarioAtual?.email}</p>
            <p className="text-muted mb-3">Perfil: {perfilLabel}</p>

            {tipoUsuario === 'professor' && (
              <div className="alert alert-info py-2 small mb-3" role="alert">
                Você está acessando como professor. Seu perfil é de usuário comum, sem privilégios de administrador.
              </div>
            )}

            {tipoUsuario === 'aluno' && (
              <div className="alert alert-light border py-2 small mb-3" role="alert">
                Você está acessando como aluno.
              </div>
            )}

            {ehAdmin && (
              <Link to="/admin" className="btn btn-primary w-100 mb-2">
                Painel Administrativo
              </Link>
            )}

            <button type="button" className="btn btn-outline-danger w-100" onClick={handleSair}>
              Sair
            </button>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            <h3 className="h5 mb-3">Solicitar Reserva</h3>

            {sucessoEnvio && (
              <div className="alert alert-success py-2" role="alert">
                {sucessoEnvio}
              </div>
            )}

            {erroEnvio && (
              <div className="alert alert-danger py-2" role="alert">
                {erroEnvio}
              </div>
            )}

            <form onSubmit={handleEnviarSolicitacao}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="local" className="form-label">
                    Local
                  </label>
                  <select
                    id="local"
                    className="form-select"
                    value={localSelecionado}
                    onChange={(e) => setLocalSelecionado(e.target.value)}
                  >
                    <option value="">Selecione um local</option>
                    {locais.map((local) => (
                      <option key={local.id} value={local.id}>
                        {local.name} - {local.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="data" className="form-label">
                    Data da Reserva
                  </label>
                  <input
                    id="data"
                    type="date"
                    className="form-control"
                    value={dataReserva}
                    onChange={(e) => setDataReserva(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="horario-inicio" className="form-label">
                    Horário de Início
                  </label>
                  <input
                    id="horario-inicio"
                    type="time"
                    className="form-control"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="horario-fim" className="form-label">
                    Horário de Término
                  </label>
                  <input
                    id="horario-fim"
                    type="time"
                    className="form-control"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="proposito" className="form-label">
                    Propósito / Observação
                  </label>
                  <textarea
                    id="proposito"
                    className="form-control"
                    rows="3"
                    value={proposito}
                    onChange={(e) => setProposito(e.target.value)}
                    placeholder="Descreva o motivo da reserva (ex: aula prática, reunião de projeto, etc.)"
                  />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={enviando}
                  >
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitação'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h3 className="h5 mb-3">Minhas Solicitações</h3>

            <ul className="nav nav-pills mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${abaSolicitacoes === 'ativas' ? 'active' : ''}`}
                  onClick={() => setAbaSolicitacoes('ativas')}
                >
                  Ativas ({solicitacoesAtivas.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${abaSolicitacoes === 'arquivadas' ? 'active' : ''}`}
                  onClick={() => setAbaSolicitacoes('arquivadas')}
                >
                  Arquivadas ({solicitacoesArquivadas.length})
                </button>
              </li>
            </ul>

            {carregandoSolicitacoes ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : solicitacoesExibidas.length === 0 ? (
              <div className="text-center text-muted py-4">
                {abaSolicitacoes === 'ativas'
                  ? 'Você ainda não possui solicitações ativas.'
                  : 'Nenhuma solicitação arquivada.'}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {solicitacoesExibidas.map((sol) => (
                  <div key={sol.id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <strong>{sol.localNome}</strong>
                            <div className="small text-muted mt-1">
                              Data: {new Date(sol.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')} |{' '}
                              Horário: {sol.horarioInicio} - {sol.horarioFim}
                            </div>
                            <div className="small text-muted mt-1">
                              Propósito: {sol.proposito}
                            </div>
                            {sol.observacaoAdmin && (
                              <div className="small mt-2 p-2 bg-light rounded">
                                <strong>Observação do Admin:</strong> {sol.observacaoAdmin}
                              </div>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${STATUS_SOLICITACAO_CORES[sol.status] || 'bg-secondary'}`}>
                              {STATUS_SOLICITACAO_LABELS[sol.status] || sol.status}
                            </span>
                            {sol.status === STATUS_SOLICITACAO.PENDENTE && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => abrirCancelar(sol)}
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalCancelar && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Cancelar Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharCancelar}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Tem certeza que deseja cancelar a solicitação para o local{' '}
                    <strong>{modalCancelar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    Esta ação irá alterar o status da solicitação para "Cancelada".
                  </p>
                  {erroCancelar && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroCancelar}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharCancelar}
                    disabled={processandoCancelar}
                  >
                    Manter Solicitação
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarCancelar}
                    disabled={processandoCancelar}
                  >
                    {processandoCancelar ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Cancelando...
                      </>
                    ) : (
                      'Confirmar Cancelamento'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
    </>
  )
}
