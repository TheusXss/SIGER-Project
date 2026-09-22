import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { encerrarSessao } from '../../services/authService'
import { listarLocais } from '../../services/locationService'
import { contarSolicitacoesPendentes } from '../../services/solicitacaoService'

const formatarDataIso = (data) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const AdminDashboard = memo(function AdminDashboard() {
  const { usuarioAtual, perfilUsuario } = useAuth()
  const navigate = useNavigate()

  const [resumo, setResumo] = useState(null)
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mesAtual, setMesAtual] = useState(() => new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(() => new Date())
  const [novoEvento, setNovoEvento] = useState({ titulo: '', tipo: 'Evento', descricao: '' })
  const [eventos, setEventos] = useState(() => {
    const hoje = new Date()
    const dataAtual = formatarDataIso(hoje)
    const mes = hoje.getMonth()
    const ano = hoje.getFullYear()

    return [
      {
        id: 'evento-sample-1',
        titulo: 'Festa Junina no IF',
        tipo: 'Evento',
        data: formatarDataIso(new Date(ano, mes, 6)),
        descricao: 'Celebração com comidas típicas, música e barracas no campus.',
      },
      {
        id: 'evento-sample-2',
        titulo: 'Reserva do Auditório',
        tipo: 'Reserva',
        data: formatarDataIso(new Date(ano, mes, 12)),
        descricao: 'Uso do auditório para reunião do projeto e apresentação de alunos.',
      },
      {
        id: 'evento-sample-3',
        titulo: 'Reunião de Coordenação',
        tipo: 'Evento',
        data: dataAtual,
        descricao: 'Planejamento semanal da área administrativa.',
      },
    ]
  })

  const carregarResumo = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const locais = await listarLocais()
      const disponiveis = locais.filter((l) => l.status === 'Disponível').length
      const manutencao = locais.filter((l) => l.status === 'Em manutenção').length
      const indisponiveis = locais.filter((l) => l.status === 'Indisponível').length

      setResumo({ total: locais.length, disponiveis, manutencao, indisponiveis })

      const pendentes = await contarSolicitacoesPendentes()
      setSolicitacoesPendentes(pendentes)
    } catch (error) {
      console.error('Erro ao carregar resumo da infraestrutura:', error)
      setErro('Não foi possível carregar o resumo da infraestrutura.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarResumo()
  }, [carregarResumo])

  const handleSair = useCallback(async () => {
    await encerrarSessao()
    navigate('/login', { replace: true })
  }, [navigate])

  const diasDoCalendario = useMemo(() => {
    const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
    const diaSemana = primeiroDiaMes.getDay()
    const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1
    const inicioCalendario = new Date(primeiroDiaMes)
    inicioCalendario.setDate(primeiroDiaMes.getDate() - deslocamento)

    const dias = []
    for (let index = 0; index < 42; index += 1) {
      const dia = new Date(inicioCalendario)
      dia.setDate(inicioCalendario.getDate() + index)
      dias.push(dia)
    }

    return dias
  }, [mesAtual])

  const eventosPorDia = useMemo(() => {
    return eventos.reduce((acumulador, evento) => {
      const chave = evento.data
      acumulador[chave] = acumulador[chave] ? [...acumulador[chave], evento] : [evento]
      return acumulador
    }, {})
  }, [eventos])

  const diaSelecionadoIso = formatarDataIso(diaSelecionado)
  const eventosSelecionados = eventosPorDia[diaSelecionadoIso] || []

  function selecionarDia(dia) {
    setDiaSelecionado(dia)
    setNovoEvento((atual) => ({ ...atual, titulo: '', descricao: '' }))
  }

  function adicionarEvento(event) {
    event.preventDefault()

    const titulo = novoEvento.titulo.trim()
    if (!titulo) return

    const eventoNovo = {
      id: crypto.randomUUID(),
      titulo,
      tipo: novoEvento.tipo,
      descricao: novoEvento.descricao.trim(),
      data: diaSelecionadoIso,
    }

    setEventos((atual) => [...atual, eventoNovo])
    setNovoEvento({ titulo: '', tipo: 'Evento', descricao: '' })
  }

  function excluirEvento(idEvento) {
    setEventos((atual) => atual.filter((evento) => evento.id !== idEvento))
  }

  return (
    <>
      <nav className="topbar">
        <div className="container topbar-inner">
          <div className="brand-wrap">
            <span className="brand-mark">SIGER</span>
            <span className="brand-title">Painel Administrativo</span>
          </div>

          <div className="topbar-actions">
            <Link to="/dashboard" className="btn btn-outline-light btn-sm">
              Ir ao dashboard
            </Link>
            <button type="button" className="btn btn-light btn-sm" onClick={handleSair}>
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="container app-shell">
        <div className="card shell-card profile-card">
          <div className="card-body profile-body">
            <div>
              <span className="eyebrow">Administração</span>
              <h2 className="h3 mb-1">
                Olá, {perfilUsuario?.name || usuarioAtual?.displayName || 'admin'}!
              </h2>
            </div>
            <p className="text-muted mb-0">Gerencie a infraestrutura física do campus.</p>
          </div>
        </div>

        <div className="card shell-card mb-4">
          <div className="tab-nav admin-tabs" role="tablist" aria-label="Navegação do admin">
            <NavLink end to="/admin" className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}>
              Visão geral
            </NavLink>
            <NavLink to="/admin/locais" className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}>
              Locais
            </NavLink>
            <NavLink to="/admin/solicitacoes" className={({ isActive }) => `tab-button ${isActive ? 'active' : ''}`}>
              Solicitações
            </NavLink>
          </div>
        </div>

        {erro && (
          <div className="alert alert-danger" role="alert">
            {erro}
          </div>
        )}

        <div className="stat-grid mb-4">
          <div className="stat-card">
            <span className="stat-label">Total de locais</span>
            <strong className="stat-value">{carregando ? '—' : resumo?.total ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Disponíveis</span>
            <strong className="stat-value success">{carregando ? '—' : resumo?.disponiveis ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Em manutenção</span>
            <strong className="stat-value warning">{carregando ? '—' : resumo?.manutencao ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Indisponíveis</span>
            <strong className="stat-value muted">{carregando ? '—' : resumo?.indisponiveis ?? 0}</strong>
          </div>
        </div>

        <div className="card shell-card mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="h5 mb-1">Gerenciamento de locais</h3>
              <p className="text-muted mb-0">
                Cadastre, edite, pesquise e remova laboratórios, salas de aula e demais espaços do campus.
              </p>
            </div>
            <Link to="/admin/locais" className="btn btn-primary">
              Gerenciar locais
            </Link>
          </div>
        </div>

        <div className="card shell-card mb-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="h5 mb-1">Solicitações de Reserva</h3>
              <p className="text-muted mb-0">
                Visualize, aprove ou rejeite as solicitações de reserva enviadas por alunos e professores.
              </p>
              {solicitacoesPendentes > 0 && (
                <span className="badge bg-warning text-dark mt-2">
                  {solicitacoesPendentes} {solicitacoesPendentes > 1 ? 'solicitações' : 'solicitação'} pendente
                  {solicitacoesPendentes > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Link to="/admin/solicitacoes" className="btn btn-primary">
              Gerenciar solicitações
            </Link>
          </div>
        </div>

        <div className="card shell-card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h3 className="h5 mb-1">Calendário de eventos e reservas</h3>
                <p className="text-muted mb-0">Organize compromissos do campus e veja rapidamente o que já está agendado.</p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <span className="fw-semibold min-width">
                  {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-lg-8">
                <div className="row text-center small text-muted fw-semibold mb-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
                    <div key={dia} className="col">
                      {dia}
                    </div>
                  ))}
                </div>

                <div className="row g-2">
                  {diasDoCalendario.map((dia) => {
                    const iso = formatarDataIso(dia)
                    const eHoje = iso === formatarDataIso(new Date())
                    const selecionado = iso === diaSelecionadoIso
                    const ehMesAtual = dia.getMonth() === mesAtual.getMonth()
                    const eventosDoDia = eventosPorDia[iso] || []

                    return (
                      <div key={iso} className="col-12 col-sm-6 col-md-4 col-lg-2 px-1">
                        <button
                          type="button"
                          className={`w-100 border rounded text-start p-2 bg-white ${selecionado ? 'border-primary shadow-sm' : 'border-light-subtle'
                            } ${!ehMesAtual ? 'text-muted opacity-50' : ''}`}
                          style={{ minHeight: '110px' }}
                          onClick={() => selecionarDia(dia)}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className={`fw-semibold ${eHoje ? 'text-primary' : ''}`}>
                              {dia.getDate()}
                            </span>
                            {eHoje && <span className="badge bg-primary-subtle text-primary">Hoje</span>}
                          </div>

                          <div className="d-flex flex-wrap gap-1">
                            {eventosDoDia.slice(0, 3).map((evento) => (
                              <span
                                key={evento.id}
                                className={`rounded-circle ${evento.tipo === 'Reserva' ? 'bg-warning' : 'bg-success'
                                  }`}
                                style={{ width: '8px', height: '8px', display: 'inline-block' }}
                                title={evento.titulo}
                              />
                            ))}
                          </div>

                          {eventosDoDia.length > 0 && (
                            <div className="small text-secondary mt-2">
                              {eventosDoDia.length} {eventosDoDia.length > 1 ? 'itens' : 'item'}
                            </div>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="border rounded p-3 h-100 bg-light-subtle">
                  <h4 className="h6 mb-3">
                    {diaSelecionado.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>

                  {eventosSelecionados.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {eventosSelecionados.map((evento) => (
                        <div key={evento.id} className="border rounded p-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                            <strong className="small">{evento.titulo}</strong>
                            <span
                              className={`badge ${evento.tipo === 'Reserva' ? 'bg-warning text-dark' : 'bg-success-subtle text-success'
                                }`}
                            >
                              {evento.tipo}
                            </span>
                          </div>
                          {evento.descricao && <p className="small text-muted mb-0">{evento.descricao}</p>}
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-danger p-0 mt-2"
                            onClick={() => excluirEvento(evento.id)}
                          >
                            Excluir evento
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-3">Nenhum evento ou reserva para este dia.</p>
                  )}

                  <form onSubmit={adicionarEvento} className="mt-3">
                    <div className="mb-2">
                      <label htmlFor="evento-titulo" className="form-label small">
                        Nome do evento
                      </label>
                      <input
                        id="evento-titulo"
                        type="text"
                        className="form-control form-control-sm"
                        value={novoEvento.titulo}
                        onChange={(event) =>
                          setNovoEvento((atual) => ({ ...atual, titulo: event.target.value }))
                        }
                        placeholder="Ex: Festa Junina no IF"
                      />
                    </div>

                    <div className="mb-2">
                      <label htmlFor="evento-tipo" className="form-label small">
                        Tipo
                      </label>
                      <select
                        id="evento-tipo"
                        className="form-select form-select-sm"
                        value={novoEvento.tipo}
                        onChange={(event) =>
                          setNovoEvento((atual) => ({ ...atual, tipo: event.target.value }))
                        }
                      >
                        <option value="Evento">Evento</option>
                        <option value="Reserva">Reserva</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="evento-descricao" className="form-label small">
                        Observação
                      </label>
                      <textarea
                        id="evento-descricao"
                        className="form-control form-control-sm"
                        rows="3"
                        value={novoEvento.descricao}
                        onChange={(event) =>
                          setNovoEvento((atual) => ({ ...atual, descricao: event.target.value }))
                        }
                        placeholder="Detalhes da atividade ou da reserva"
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-sm w-100">
                      + Adicionar evento
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export default AdminDashboard
