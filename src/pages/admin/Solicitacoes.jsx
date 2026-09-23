import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  listarSolicitacoes,
  atualizarStatusSolicitacao,
  excluirSolicitacao,
  contarSolicitacoesPendentes,
  contarSolicitacoesArquivadas,
  verificarConflitoHorario,
  STATUS_SOLICITACAO,
  STATUS_SOLICITACAO_LABELS,
  STATUS_SOLICITACAO_CORES,
} from '../../services/solicitacaoService'

const BADGE_TIPO_USUARIO = {
  aluno: 'bg-primary',
  professor: 'bg-info text-dark',
}

const Solicitacoes = memo(function Solicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [filtroStatus, setFiltroStatus] = useState('')
  const [aba, setAba] = useState('solicitacoes')
  const [solicitacaoDetalhe, setSolicitacaoDetalhe] = useState(null)
  const [qtdPendentes, setQtdPendentes] = useState(0)
  const [qtdArquivadas, setQtdArquivadas] = useState(0)

  const [modalProcessar, setModalProcessar] = useState(null)
  const [acaoAprovacao, setAcaoAprovacao] = useState(null)
  const [observacao, setObservacao] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erroProcessamento, setErroProcessamento] = useState('')

  const [modalArquivar, setModalArquivar] = useState(null)
  const [modalCancelar, setModalCancelar] = useState(null)
  const [modalExcluir, setModalExcluir] = useState(null)
  const [modalDesarquivar, setModalDesarquivar] = useState(null)
  const [observacaoCancelar, setObservacaoCancelar] = useState('')
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const [erroAcao, setErroAcao] = useState('')

  const [conflitosModal, setConflitosModal] = useState([])

  const carregarSolicitacoes = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const statusConsulta = aba === 'arquivadas' ? STATUS_SOLICITACAO.ARQUIVADA : filtroStatus
      const dados = await listarSolicitacoes(statusConsulta)
      setSolicitacoes(dados)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      setErro('Não foi possível carregar as solicitações. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [aba, filtroStatus])

  const carregarContadores = useCallback(async () => {
    try {
      const [pendentes, arquivadas] = await Promise.all([
        contarSolicitacoesPendentes(),
        contarSolicitacoesArquivadas(),
      ])
      setQtdPendentes(pendentes)
      setQtdArquivadas(arquivadas)
    } catch (error) {
      console.error('Erro ao carregar contadores:', error)
    }
  }, [])

  useEffect(() => {
    carregarSolicitacoes()
    carregarContadores()
  }, [carregarSolicitacoes, carregarContadores])

  function trocarAba(novaAba) {
    setAba(novaAba)
    setFiltroStatus(novaAba === 'arquivadas' ? STATUS_SOLICITACAO.ARQUIVADA : '')
  }

  function abrirDetalhe(solicitacao) {
    setSolicitacaoDetalhe(solicitacao)
  }

  async function abrirProcessar(solicitacao, aprovando) {
    setModalProcessar(solicitacao)
    setAcaoAprovacao(aprovando)
    setObservacao('')
    setErroProcessamento('')
    setConflitosModal([])

    if (aprovando) {
      const { conflitos } = await verificarConflitoHorario({
        localId: solicitacao.localId,
        dataReserva: solicitacao.dataReserva,
        horarioInicio: solicitacao.horarioInicio,
        horarioFim: solicitacao.horarioFim,
        excluirId: solicitacao.id,
      })
      setConflitosModal(conflitos)
    }
  }

  function fecharModal() {
    setModalProcessar(null)
    setAcaoAprovacao(null)
    setObservacao('')
    setErroProcessamento('')
    setConflitosModal([])
  }

  function abrirArquivar(solicitacao) {
    setModalArquivar(solicitacao)
    setErroAcao('')
  }

  function fecharArquivar() {
    setModalArquivar(null)
    setErroAcao('')
  }

  async function confirmarArquivar() {
    if (!modalArquivar) return
    setProcessandoAcao(true)
    setErroAcao('')
    try {
      await atualizarStatusSolicitacao(modalArquivar.id, {
        status: STATUS_SOLICITACAO.ARQUIVADA,
        observacaoAdmin: 'Solicitação arquivada pelo administrador.',
        statusAnterior: modalArquivar.status,
      })
      fecharArquivar()
      await carregarSolicitacoes()
      await carregarContadores()
    } catch (error) {
      console.error('Erro ao arquivar solicitação:', error)
      setErroAcao('Não foi possível arquivar a solicitação. Tente novamente.')
    } finally {
      setProcessandoAcao(false)
    }
  }

  function abrirDesarquivar(solicitacao) {
    setModalDesarquivar(solicitacao)
    setErroAcao('')
  }

  function fecharDesarquivar() {
    setModalDesarquivar(null)
    setErroAcao('')
  }

  async function confirmarDesarquivar() {
    if (!modalDesarquivar) return
    setProcessandoAcao(true)
    setErroAcao('')
    try {
      const statusRestaurar = modalDesarquivar.statusAnterior || STATUS_SOLICITACAO.APROVADA
      await atualizarStatusSolicitacao(modalDesarquivar.id, {
        status: statusRestaurar,
        observacaoAdmin: 'Solicitação desarquivada pelo administrador.',
      })
      fecharDesarquivar()
      await carregarSolicitacoes()
      await carregarContadores()
    } catch (error) {
      console.error('Erro ao desarquivar solicitação:', error)
      setErroAcao('Não foi possível desarquivar a solicitação. Tente novamente.')
    } finally {
      setProcessandoAcao(false)
    }
  }

  function abrirCancelar(solicitacao) {
    setModalCancelar(solicitacao)
    setObservacaoCancelar('')
    setErroAcao('')
  }

  function fecharCancelar() {
    setModalCancelar(null)
    setObservacaoCancelar('')
    setErroAcao('')
  }

  async function confirmarCancelar() {
    if (!modalCancelar) return
    if (!observacaoCancelar.trim()) {
      setErroAcao('Por favor, adicione uma observação ao cancelar a solicitação.')
      return
    }
    setProcessandoAcao(true)
    setErroAcao('')
    try {
      await atualizarStatusSolicitacao(modalCancelar.id, {
        status: STATUS_SOLICITACAO.CANCELADA,
        observacaoAdmin: observacaoCancelar,
      })
      fecharCancelar()
      await carregarSolicitacoes()
      await carregarContadores()
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error)
      setErroAcao('Não foi possível cancelar a solicitação. Tente novamente.')
    } finally {
      setProcessandoAcao(false)
    }
  }

  function abrirExcluir(solicitacao) {
    setModalExcluir(solicitacao)
    setErroAcao('')
  }

  function fecharExcluir() {
    setModalExcluir(null)
    setErroAcao('')
  }

  async function confirmarExcluir() {
    if (!modalExcluir) return
    setProcessandoAcao(true)
    setErroAcao('')
    try {
      await excluirSolicitacao(modalExcluir.id)
      fecharExcluir()
      await carregarSolicitacoes()
      await carregarContadores()
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error)
      setErroAcao('Não foi possível excluir a solicitação. Tente novamente.')
    } finally {
      setProcessandoAcao(false)
    }
  }

  async function confirmarProcessamento() {
    if (!modalProcessar || acaoAprovacao === null) return

    const novoStatus = aprovando ? STATUS_SOLICITACAO.APROVADA : STATUS_SOLICITACAO.REJEITADA

    if (!aprovando && !observacao.trim()) {
      setErroProcessamento('Por favor, adicione uma observação ao rejeitar a solicitação.')
      return
    }

    setProcessando(true)
    setErroProcessamento('')
    try {
      await atualizarStatusSolicitacao(modalProcessar.id, {
        status: novoStatus,
        observacaoAdmin: observacao,
      })
      fecharModal()
      await carregarSolicitacoes()
      await carregarContadores()
    } catch (error) {
      console.error('Erro ao processar solicitação:', error)
      setErroProcessamento('Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  const aprovando = acaoAprovacao === true

  const solicitacoesFiltradas = useMemo(() => {
    if (aba === 'arquivadas') {
      return solicitacoes
    }

    return filtroStatus ? solicitacoes.filter((sol) => sol.status === filtroStatus) : solicitacoes
  }, [aba, filtroStatus, solicitacoes])

  const gruposSolicitacoes = useMemo(() => {
    if (aba === 'arquivadas') {
      return [{
        key: 'arquivadas',
        titulo: 'Arquivadas',
        itens: solicitacoesFiltradas,
      }]
    }

    const statusOrdem = Object.entries(STATUS_SOLICITACAO_LABELS)
      .filter(([valor]) => valor !== STATUS_SOLICITACAO.ARQUIVADA)
      .map(([valor, label]) => ({
        key: valor,
        titulo: label,
        itens: solicitacoesFiltradas.filter((sol) => sol.status === valor),
      }))
      .filter((grupo) => grupo.itens.length > 0)

    if (filtroStatus) {
      const grupoSelecionado = statusOrdem.find((grupo) => grupo.key === filtroStatus)
      return grupoSelecionado ? [grupoSelecionado] : []
    }

    return statusOrdem
  }, [aba, filtroStatus, solicitacoesFiltradas])

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
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container app-shell">
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

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <span className="eyebrow">Reservas</span>
            <h2 className="h4 mb-0">Solicitações de Reserva</h2>
          </div>
        </div>

        <div className="tabs-inline user-tabs admin-request-tabs mb-4">
          <button
            type="button"
            className={`tab-button ${aba === 'solicitacoes' ? 'active' : ''}`}
            onClick={() => trocarAba('solicitacoes')}
          >
            Solicitações
            <span className="tab-count">{qtdPendentes}</span>
          </button>
          <button
            type="button"
            className={`tab-button ${aba === 'arquivadas' ? 'active' : ''}`}
            onClick={() => trocarAba('arquivadas')}
          >
            Arquivadas
            <span className="tab-count">{qtdArquivadas}</span>
          </button>
        </div>

        {aba === 'solicitacoes' && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="status-filter-list" role="tablist" aria-label="Filtrar solicitações por status">
                <button
                  type="button"
                  className={`status-filter-btn ${!filtroStatus ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('')}
                >
                  Todos
                </button>
                {Object.entries(STATUS_SOLICITACAO_LABELS)
                  .filter(([valor]) => valor !== STATUS_SOLICITACAO.ARQUIVADA)
                  .map(([valor, label]) => (
                    <button
                      key={valor}
                      type="button"
                      className={`status-filter-btn ${filtroStatus === valor ? 'active' : ''}`}
                      onClick={() => setFiltroStatus(valor)}
                    >
                      {label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {erro && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>{erro}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={carregarSolicitacoes}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : solicitacoesFiltradas.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-muted py-5">
              {aba === 'arquivadas'
                ? 'Nenhuma solicitação arquivada.'
                : filtroStatus
                  ? 'Nenhuma solicitação encontrada para o filtro selecionado.'
                  : 'Nenhuma solicitação de reserva recebida ainda.'}
            </div>
          </div>
        ) : (
          <div className="request-groups admin-request-groups">
            {gruposSolicitacoes.map((grupo) => (
              <div key={grupo.key} className="request-group">
                <div className="request-group-header">
                  <span className="request-group-title">{grupo.titulo}</span>
                  <span className="request-group-count">{grupo.itens.length}</span>
                </div>

                <div className="request-group-list">
                  {grupo.itens.map((sol) => (
                    <div key={sol.id} className="reservation-item admin-request-item">
                      <div className="request-header">
                        <div className="request-main">
                          <div className="request-title-row">
                            <div>
                              <strong className="d-block">{sol.usuarioNome}</strong>
                              <small className="text-muted">{sol.usuarioEmail}</small>
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className={`badge ${BADGE_TIPO_USUARIO[sol.usuarioTipo] || 'bg-secondary'}`}>
                                {sol.usuarioTipo === 'aluno' ? 'Aluno' : 'Professor'}
                              </span>
                              <span className={`badge ${STATUS_SOLICITACAO_CORES[sol.status] || 'bg-secondary'}`}>
                                {STATUS_SOLICITACAO_LABELS[sol.status] || sol.status}
                              </span>
                            </div>
                          </div>

                          <div className="small text-muted mt-2">
                            <strong className="text-dark">Local:</strong> {sol.localNome}
                          </div>
                          <div className="small text-muted mt-1">
                            Data: {new Date(sol.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')} | Horário: {sol.horarioInicio} - {sol.horarioFim}
                          </div>
                          <div className="small text-muted mt-1">
                            Propósito: {sol.proposito}
                          </div>
                          {sol.observacaoAdmin && (
                            <div className="small mt-2 p-2 alert-light rounded">
                              <strong>Observação do Admin:</strong> {sol.observacaoAdmin}
                            </div>
                          )}
                        </div>

                        <div className="request-actions admin-request-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-action btn-action-secondary"
                            onClick={() => abrirDetalhe(sol)}
                          >
                            Detalhes
                          </button>

                          {aba === 'arquivadas' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-action btn-action-success"
                                onClick={() => abrirDesarquivar(sol)}
                              >
                                Desarquivar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-action btn-action-danger"
                                onClick={() => abrirExcluir(sol)}
                              >
                                Excluir
                              </button>
                            </>
                          )}

                          {aba === 'solicitacoes' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-action btn-action-secondary"
                                onClick={() => abrirArquivar(sol)}
                              >
                                Arquivar
                              </button>
                              {sol.status === STATUS_SOLICITACAO.PENDENTE && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-action btn-action-success"
                                    onClick={() => abrirProcessar(sol, true)}
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-action btn-action-danger"
                                    onClick={() => abrirProcessar(sol, false)}
                                  >
                                    Rejeitar
                                  </button>
                                </>
                              )}
                              {sol.status === STATUS_SOLICITACAO.APROVADA && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-action btn-action-warning"
                                  onClick={() => abrirCancelar(sol)}
                                >
                                  Cancelar
                                </button>
                              )}
                              {(sol.status === STATUS_SOLICITACAO.REJEITADA ||
                                sol.status === STATUS_SOLICITACAO.CANCELADA) && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-action btn-action-danger"
                                    onClick={() => abrirExcluir(sol)}
                                  >
                                    Excluir
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {solicitacaoDetalhe && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detalhes da Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSolicitacaoDetalhe(null)}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Solicitante:</strong> {solicitacaoDetalhe.usuarioNome}
                    <br />
                    <span className="text-muted">{solicitacaoDetalhe.usuarioEmail}</span>
                    <br />
                    <span className={`badge ${BADGE_TIPO_USUARIO[solicitacaoDetalhe.usuarioTipo] || 'bg-secondary'}`}>
                      {solicitacaoDetalhe.usuarioTipo === 'aluno' ? 'Aluno' : 'Professor'}
                    </span>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <strong>Local:</strong> {solicitacaoDetalhe.localNome}
                  </div>
                  <div className="mb-3">
                    <strong>Data:</strong>{' '}
                    {new Date(solicitacaoDetalhe.dataReserva + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                  <div className="mb-3">
                    <strong>Horário:</strong> {solicitacaoDetalhe.horarioInicio} - {solicitacaoDetalhe.horarioFim}
                  </div>
                  <div className="mb-3">
                    <strong>Propósito:</strong>
                    <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                      {solicitacaoDetalhe.proposito}
                    </p>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <strong>Status atual:</strong>{' '}
                    <span
                      className={`badge ${STATUS_SOLICITACAO_CORES[solicitacaoDetalhe.status] || 'bg-secondary'}`}
                    >
                      {STATUS_SOLICITACAO_LABELS[solicitacaoDetalhe.status] || solicitacaoDetalhe.status}
                    </span>
                  </div>

                  {solicitacaoDetalhe.observacaoAdmin && (
                    <div className="mb-3">
                      <strong>Observação do Admin:</strong>
                      <p className="mb-0 mt-1 p-2 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                        {solicitacaoDetalhe.observacaoAdmin}
                      </p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSolicitacaoDetalhe(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {modalProcessar && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {aprovando ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharModal}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Deseja{' '}
                    <strong className={aprovando ? 'text-success' : 'text-danger'}>
                      {aprovando ? 'aprovar' : 'rejeitar'}
                    </strong>{' '}
                    a solicitação de <strong>{modalProcessar.usuarioNome}</strong> para o local{' '}
                    <strong>{modalProcessar.localNome}</strong>?
                  </p>

                  <div className="mb-3">
                    <label htmlFor="observacao-admin" className="form-label">
                      Observação {aprovando ? '(opcional)' : '(obrigatória)'}
                    </label>
                    <textarea
                      id="observacao-admin"
                      className="form-control"
                      rows="3"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder={
                        aprovando
                          ? 'Ex: Aprovado, sala disponível no horário solicitado.'
                          : 'Ex: Horário indisponível, sala em manutenção.'
                      }
                    />
                  </div>

                  {aprovando && conflitosModal.length > 0 && (
                    <div className="alert alert-warning py-2 mb-0" role="alert">
                      <strong>Atenção:</strong> já existe reserva para este local no mesmo
                      horário:
                      <ul className="mb-0 mt-1">
                        {conflitosModal.map((c) => (
                          <li key={c.id}>
                            {c.horarioInicio} às {c.horarioFim} — {c.usuarioNome} ({STATUS_SOLICITACAO_LABELS[c.status] || c.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {erroProcessamento && (
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                      {erroProcessamento}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharModal}
                    disabled={processando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`btn ${aprovando ? 'btn-success' : 'btn-danger'}`}
                    onClick={confirmarProcessamento}
                    disabled={processando}
                  >
                    {processando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Processando...
                      </>
                    ) : aprovando ? (
                      'Aprovar'
                    ) : (
                      'Rejeitar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {modalArquivar && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Arquivar Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharArquivar}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Deseja <strong className="text-secondary">arquivar</strong> a solicitação de{' '}
                    <strong>{modalArquivar.usuarioNome}</strong> para o local{' '}
                    <strong>{modalArquivar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    Solicitações arquivadas são movidas para o histórico e não aparecem mais na lista principal.
                  </p>
                  {erroAcao && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroAcao}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharArquivar}
                    disabled={processandoAcao}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={confirmarArquivar}
                    disabled={processandoAcao}
                  >
                    {processandoAcao ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Processando...
                      </>
                    ) : (
                      'Arquivar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

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
                    Deseja <strong className="text-warning">cancelar</strong> a solicitação de{' '}
                    <strong>{modalCancelar.usuarioNome}</strong> para o local{' '}
                    <strong>{modalCancelar.localNome}</strong>?
                  </p>
                  <div className="mb-3">
                    <label htmlFor="observacao-cancelar" className="form-label">
                      Observação (obrigatória)
                    </label>
                    <textarea
                      id="observacao-cancelar"
                      className="form-control"
                      rows="3"
                      value={observacaoCancelar}
                      onChange={(e) => setObservacaoCancelar(e.target.value)}
                      placeholder="Ex: Reserva cancelada por conflito de horário."
                    />
                  </div>
                  {erroAcao && (
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                      {erroAcao}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharCancelar}
                    disabled={processandoAcao}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={confirmarCancelar}
                    disabled={processandoAcao}
                  >
                    {processandoAcao ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Processando...
                      </>
                    ) : (
                      'Cancelar Solicitação'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {modalExcluir && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Excluir Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={fecharExcluir}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <div className="alert alert-danger mb-3">
                    <strong>Atenção!</strong> Esta ação não pode ser desfeita.
                  </div>
                  <p>
                    Tem certeza que deseja <strong>excluir permanentemente</strong> a solicitação de{' '}
                    <strong>{modalExcluir.usuarioNome}</strong> para o local{' '}
                    <strong>{modalExcluir.localNome}</strong>?
                  </p>
                  {erroAcao && (
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                      {erroAcao}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharExcluir}
                    disabled={processandoAcao}
                  >
                    Manter
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarExcluir}
                    disabled={processandoAcao}
                  >
                    {processandoAcao ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Excluindo...
                      </>
                    ) : (
                      'Excluir Permanentemente'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {modalDesarquivar && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Desarquivar Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharDesarquivar}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Deseja <strong className="text-success">desarquivar</strong> a solicitação de{' '}
                    <strong>{modalDesarquivar.usuarioNome}</strong> para o local{' '}
                    <strong>{modalDesarquivar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    A solicitação voltará para o status{' '}
                    <strong>
                      {STATUS_SOLICITACAO_LABELS[modalDesarquivar.statusAnterior] || 'Aprovada'}
                    </strong>.
                  </p>
                  {erroAcao && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroAcao}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharDesarquivar}
                    disabled={processandoAcao}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={confirmarDesarquivar}
                    disabled={processandoAcao}
                  >
                    {processandoAcao ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Processando...
                      </>
                    ) : (
                      'Desarquivar'
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
})

export default Solicitacoes
