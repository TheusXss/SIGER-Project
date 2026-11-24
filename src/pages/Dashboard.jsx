import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
<<<<<<< HEAD
import { useAuth } from '../contexts/AuthContext'
=======
import { useAuth } from '../contexts/useAuth'
>>>>>>> 4fcfbac (atualização geral)
import { encerrarSessao } from '../services/authService'
import { listarLocais } from '../services/locationService'
import {
  criarSolicitacao,
  listarSolicitacoesPorUsuario,
  atualizarStatusSolicitacao,
  reativarSolicitacao,
  excluirSolicitacao,
  verificarConflitoHorario,
  STATUS_SOLICITACAO,
  STATUS_SOLICITACAO_LABELS,
  STATUS_SOLICITACAO_CORES,
} from '../services/solicitacaoService'
import NovaReserva from './novareserva'
import Solicitacoes from './solicitacoes'
import Perfil from './perfil'
<<<<<<< HEAD
import Resumo from './resumo'
=======
import Inicio from './inicio'
import Locais from './Locais'
import LocalDetalhe from './LocaisDetalhe'
import NotificacoesBell from '../components/NotificacoesBell'
import ProtectedRoute from '../components/ProtectedRoute'
import AulasExtras from './AulasExtras'
import AulaExtraDetalhe from './AulaExtraDetalhe'
import RegistrarPresenca from './RegistrarPresenca'
>>>>>>> 4fcfbac (atualização geral)

const STATUS_ATIVOS = [
  STATUS_SOLICITACAO.PENDENTE,
  STATUS_SOLICITACAO.EM_PROCESSO,
  STATUS_SOLICITACAO.APROVADA,
  STATUS_SOLICITACAO.REJEITADA,
  STATUS_SOLICITACAO.CANCELADA,
]

<<<<<<< HEAD
=======
function obterHorarioAtualHHMM() {
  const agora = new Date()
  const horas = String(agora.getHours()).padStart(2, '0')
  const minutos = String(agora.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}

>>>>>>> 4fcfbac (atualização geral)
const Dashboard = memo(function Dashboard() {
  const { usuarioAtual, perfilUsuario } = useAuth()
  const navigate = useNavigate()

  const nomeExibido = perfilUsuario?.name || usuarioAtual?.displayName || 'usuário'
  const tipoUsuario = perfilUsuario?.role
  const ehAdmin = tipoUsuario === 'admin'
  const perfilLabel =
    tipoUsuario === 'admin' ? 'Administrador' : tipoUsuario === 'professor' ? 'Professor' : 'Aluno'

  const hojeIso = (() => {
    const d = new Date()
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  })()

  const [locais, setLocais] = useState([])
<<<<<<< HEAD
=======
  const [carregandoLocais, setCarregandoLocais] = useState(true)
  const [erroLocais, setErroLocais] = useState('')
>>>>>>> 4fcfbac (atualização geral)
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
<<<<<<< HEAD
=======
  const [horarioAtualHHMM, setHorarioAtualHHMM] = useState(obterHorarioAtualHHMM)
>>>>>>> 4fcfbac (atualização geral)

  const [modalCancelar, setModalCancelar] = useState(null)
  const [processandoCancelar, setProcessandoCancelar] = useState(false)
  const [erroCancelar, setErroCancelar] = useState('')
<<<<<<< HEAD
=======
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('')
>>>>>>> 4fcfbac (atualização geral)

  const [modalReativar, setModalReativar] = useState(null)
  const [processandoReativar, setProcessandoReativar] = useState(false)
  const [erroReativar, setErroReativar] = useState('')

  const [modalExcluir, setModalExcluir] = useState(null)
  const [processandoExcluir, setProcessandoExcluir] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

  const [modalArquivar, setModalArquivar] = useState(null)
  const [processandoArquivar, setProcessandoArquivar] = useState(false)
  const [erroArquivar, setErroArquivar] = useState('')

  const [modalDesarquivar, setModalDesarquivar] = useState(null)
  const [processandoDesarquivar, setProcessandoDesarquivar] = useState(false)
  const [erroDesarquivar, setErroDesarquivar] = useState('')

  const [abaSolicitacoes, setAbaSolicitacoes] = useState('ativas')
<<<<<<< HEAD
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

=======
  const [filtroStatusSolicitacoes, setFiltroStatusSolicitacoes] = useState('')
  const carregarLocais = useCallback(async () => {
    setCarregandoLocais(true)
    setErroLocais('')
    try {
      setLocais(await listarLocais())
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      setErroLocais('Não foi possível carregar os locais. Tente novamente.')
    } finally {
      setCarregandoLocais(false)
    }
  }, [])

  useEffect(() => {
    carregarLocais()
  }, [carregarLocais])

  useEffect(() => {
    const atualizarHorarioAtual = () => setHorarioAtualHHMM(obterHorarioAtualHHMM())
    const intervalo = setInterval(atualizarHorarioAtual, 60000)
    return () => clearInterval(intervalo)
  }, [])

  const locaisDisponiveis = locais.filter((local) => local.status === 'Disponível')

>>>>>>> 4fcfbac (atualização geral)
  const carregarMinhasSolicitacoes = useCallback(async () => {
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
  }, [usuarioAtual?.uid])

  useEffect(() => {
    carregarMinhasSolicitacoes()
  }, [carregarMinhasSolicitacoes])

  const handleSair = useCallback(async () => {
    await encerrarSessao()
    navigate('/login', { replace: true })
  }, [navigate])

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
    if (dataReserva < hojeIso) {
      setErroEnvio('Não é possível solicitar reservas para datas passadas.')
      return
    }
    if (!horarioInicio) {
      setErroEnvio('Por favor, informe o horário de início.')
      return
    }
<<<<<<< HEAD
=======
    if (dataReserva === hojeIso && horarioInicio < obterHorarioAtualHHMM()) {
      setErroEnvio('Não é possível solicitar reservas para horários que já passaram hoje.')
      return
    }
>>>>>>> 4fcfbac (atualização geral)
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

<<<<<<< HEAD
    const localEncontrado = locais.find((l) => l.id === localSelecionado)
=======
    const localEncontrado = locaisDisponiveis.find((local) => local.id === localSelecionado)
    if (!localEncontrado) {
      setErroEnvio('O local selecionado não está disponível para reserva.')
      return
    }
>>>>>>> 4fcfbac (atualização geral)

    setEnviando(true)
    try {
      const { temConflito, conflitos } = await verificarConflitoHorario({
        localId: localSelecionado,
        dataReserva,
        horarioInicio,
        horarioFim,
      })

      if (temConflito) {
        const detalhes = conflitos
          .map(
            (c) =>
              `• ${c.horarioInicio} às ${c.horarioFim} (${STATUS_SOLICITACAO_LABELS[c.status] || c.status})`,
          )
          .join('\n')
        setErroEnvio(
          `Já existe uma reserva para este local no dia e horário solicitado:\n${detalhes}\n\nPor favor, escolha outro horário.`,
        )
        return
      }

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
<<<<<<< HEAD
=======
    setJustificativaCancelamento('')
>>>>>>> 4fcfbac (atualização geral)
  }

  function fecharCancelar() {
    setModalCancelar(null)
    setErroCancelar('')
<<<<<<< HEAD
=======
    setJustificativaCancelamento('')
>>>>>>> 4fcfbac (atualização geral)
  }

  async function confirmarCancelar() {
    if (!modalCancelar) return
<<<<<<< HEAD
=======
    if (!justificativaCancelamento.trim()) {
      setErroCancelar('Por favor, informe a justificativa do cancelamento.')
      return
    }
>>>>>>> 4fcfbac (atualização geral)
    setProcessandoCancelar(true)
    setErroCancelar('')
    try {
      await atualizarStatusSolicitacao(modalCancelar.id, {
        status: STATUS_SOLICITACAO.CANCELADA,
<<<<<<< HEAD
        observacaoAdmin: 'Solicitação cancelada pelo solicitante.',
=======
        observacaoAdmin: '',
        justificativaCancelamento,
>>>>>>> 4fcfbac (atualização geral)
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

  function abrirReativar(solicitacao) {
    setModalReativar(solicitacao)
    setErroReativar('')
  }

  function fecharReativar() {
    setModalReativar(null)
    setErroReativar('')
  }

  async function confirmarReativar() {
    if (!modalReativar) return
    setProcessandoReativar(true)
    setErroReativar('')
    try {
      await reativarSolicitacao(modalReativar.id)
      fecharReativar()
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao reativar solicitação:', error)
      setErroReativar('Não foi possível reativar a solicitação. Tente novamente.')
    } finally {
      setProcessandoReativar(false)
    }
  }

  function abrirExcluirSolicitacao(solicitacao) {
    setModalExcluir(solicitacao)
    setErroExcluir('')
  }

  function fecharExcluir() {
    setModalExcluir(null)
    setErroExcluir('')
  }

  async function confirmarExcluir() {
    if (!modalExcluir) return
    setProcessandoExcluir(true)
    setErroExcluir('')
    try {
      await excluirSolicitacao(modalExcluir.id)
      fecharExcluir()
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error)
      setErroExcluir('Não foi possível excluir a solicitação. Tente novamente.')
    } finally {
      setProcessandoExcluir(false)
    }
  }

  function abrirArquivar(solicitacao) {
    setModalArquivar(solicitacao)
    setErroArquivar('')
  }

  function fecharArquivar() {
    setModalArquivar(null)
    setErroArquivar('')
  }

  async function confirmarArquivar() {
    if (!modalArquivar) return
    setProcessandoArquivar(true)
    setErroArquivar('')
    try {
      await atualizarStatusSolicitacao(modalArquivar.id, {
        status: STATUS_SOLICITACAO.ARQUIVADA,
        observacaoAdmin: 'Solicitação arquivada pelo solicitante.',
        statusAnterior: modalArquivar.status,
      })
      fecharArquivar()
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao arquivar solicitação:', error)
      setErroArquivar('Não foi possível arquivar a solicitação. Tente novamente.')
    } finally {
      setProcessandoArquivar(false)
    }
  }

  function abrirDesarquivar(solicitacao) {
    setModalDesarquivar(solicitacao)
    setErroDesarquivar('')
  }

  function fecharDesarquivar() {
    setModalDesarquivar(null)
    setErroDesarquivar('')
  }

  async function confirmarDesarquivar() {
    if (!modalDesarquivar) return
    setProcessandoDesarquivar(true)
    setErroDesarquivar('')
    try {
      const statusRestaurar = modalDesarquivar.statusAnterior || STATUS_SOLICITACAO.PENDENTE
      await atualizarStatusSolicitacao(modalDesarquivar.id, {
        status: statusRestaurar,
        observacaoAdmin: 'Solicitação desarquivada pelo solicitante.',
      })
      fecharDesarquivar()
      await carregarMinhasSolicitacoes()
    } catch (error) {
      console.error('Erro ao desarquivar solicitação:', error)
      setErroDesarquivar('Não foi possível desarquivar a solicitação. Tente novamente.')
    } finally {
      setProcessandoDesarquivar(false)
    }
  }

  const solicitacoesAtivas = useMemo(
    () => solicitacoes.filter((s) => STATUS_ATIVOS.includes(s.status)),
    [solicitacoes],
  )
  const solicitacoesArquivadas = useMemo(
    () => solicitacoes.filter((s) => s.status === STATUS_SOLICITACAO.ARQUIVADA),
    [solicitacoes],
  )

  const solicitacoesExibidas = useMemo(
    () => (abaSolicitacoes === 'ativas' ? solicitacoesAtivas : solicitacoesArquivadas),
    [abaSolicitacoes, solicitacoesAtivas, solicitacoesArquivadas],
  )

  const proximasReservas = useMemo(
    () =>
      [...solicitacoesAtivas]
        .sort((a, b) => new Date(a.dataReserva) - new Date(b.dataReserva))
        .slice(0, 3),
    [solicitacoesAtivas],
  )

  const reservasPendentes = solicitacoesAtivas.filter(
    (sol) => sol.status === STATUS_SOLICITACAO.PENDENTE,
  ).length
  const reservasAprovadas = solicitacoesAtivas.filter(
    (sol) => sol.status === STATUS_SOLICITACAO.APROVADA,
  ).length
  const reservasCanceladas = solicitacoesAtivas.filter(
    (sol) => sol.status === STATUS_SOLICITACAO.CANCELADA,
  ).length

  return (
    <>
      <nav className="topbar">
        <div className="container topbar-inner">
          <div className="brand-wrap">
            <span className="brand-mark">SIGER</span>
<<<<<<< HEAD
            <span className="brand-title">Sistema Integrado de Gestão de Espaços e Reservas</span>
          </div>

          <div className="topbar-actions">
=======
            <span className="brand-title">Sistema de Gestão de Espaços e Reservas</span>
          </div>

          <div className="topbar-actions">
            <NotificacoesBell
              reservas={solicitacoes.filter((solicitacao) => solicitacao.status === STATUS_SOLICITACAO.APROVADA)}
              usuarioId={usuarioAtual?.uid || ''}
              role={tipoUsuario}
              turmaId={perfilUsuario?.turmaId || ''}
            />
            {ehAdmin && (
              <Link to="/admin" className="topbar-admin-link" aria-label="Abrir painel administrativo">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="3.5" y="4" width="17" height="16" rx="2" />
                  <path d="M8 8h3v3H8zM13 8h3M13 10h3M8 14h3M13 14h3M13 16h3" />
                </svg>
                <span>Painel admin</span>
              </Link>
            )}
>>>>>>> 4fcfbac (atualização geral)
            <Link to="perfil" className="topbar-user" aria-label="Ir para o perfil">
              <div className="topbar-avatar">{nomeExibido.charAt(0).toUpperCase()}</div>
              <div className="topbar-user-meta">
                <span className="topbar-user-label">{perfilLabel}</span>
                <strong>{nomeExibido}</strong>
              </div>
            </Link>
<<<<<<< HEAD

            {ehAdmin && (
              <Link to="/admin" className="btn btn-outline-light btn-sm">
                Painel Admin
              </Link>
            )}
=======
>>>>>>> 4fcfbac (atualização geral)
            <button type="button" className="btn btn-light btn-sm" onClick={handleSair}>
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="container app-shell dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav" aria-label="Menu lateral do usuário">
<<<<<<< HEAD
            <NavLink to="resumo" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Resumo</span>
=======
            <NavLink to="inicio" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Início</span>
>>>>>>> 4fcfbac (atualização geral)
            </NavLink>
            <NavLink to="nova-reserva" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Nova reserva</span>
            </NavLink>
<<<<<<< HEAD
=======
            <NavLink to="locais" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Locais</span>
            </NavLink>
>>>>>>> 4fcfbac (atualização geral)
            <NavLink to="solicitacoes" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Solicitações</span>
              <small>{solicitacoesAtivas.length}</small>
            </NavLink>
<<<<<<< HEAD
=======
            {(tipoUsuario === 'aluno' || tipoUsuario === 'professor' || ehAdmin) && (
              <NavLink to="aulas-extras" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <span>Aulas Extras</span>
              </NavLink>
            )}
            {tipoUsuario === 'aluno' && (
              <NavLink to="presencas" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <span>Registrar Presença</span>
              </NavLink>
            )}
>>>>>>> 4fcfbac (atualização geral)
            <NavLink to="perfil" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <span>Perfil</span>
            </NavLink>
          </nav>

        </aside>

        <main className="dashboard-main">
          <Routes>
<<<<<<< HEAD
            <Route path="" element={<Navigate to="resumo" replace />} />
            <Route path="resumo" element={<Resumo nomeExibido={nomeExibido} usuarioAtual={usuarioAtual} perfilLabel={perfilLabel} tipoUsuario={tipoUsuario} reservasPendentes={reservasPendentes} reservasAprovadas={reservasAprovadas} reservasCanceladas={reservasCanceladas} solicitacoesArquivadas={solicitacoesArquivadas} />} />
            <Route path="nova-reserva" element={<NovaReserva locais={locais} hojeIso={hojeIso} localSelecionado={localSelecionado} setLocalSelecionado={setLocalSelecionado} dataReserva={dataReserva} setDataReserva={setDataReserva} horarioInicio={horarioInicio} setHorarioInicio={setHorarioInicio} horarioFim={horarioFim} setHorarioFim={setHorarioFim} proposito={proposito} setProposito={setProposito} enviando={enviando} erroEnvio={erroEnvio} sucessoEnvio={sucessoEnvio} handleEnviarSolicitacao={handleEnviarSolicitacao} />} />
            <Route path="solicitacoes" element={<Solicitacoes abaSolicitacoes={abaSolicitacoes} setAbaSolicitacoes={setAbaSolicitacoes} solicitacoesAtivas={solicitacoesAtivas} solicitacoesArquivadas={solicitacoesArquivadas} solicitacoesExibidas={solicitacoesExibidas} carregandoSolicitacoes={carregandoSolicitacoes} abrirCancelar={abrirCancelar} abrirReativar={abrirReativar} abrirExcluirSolicitacao={abrirExcluirSolicitacao} abrirArquivar={abrirArquivar} abrirDesarquivar={abrirDesarquivar} STATUS_SOLICITACAO={STATUS_SOLICITACAO} STATUS_SOLICITACAO_LABELS={STATUS_SOLICITACAO_LABELS} STATUS_SOLICITACAO_CORES={STATUS_SOLICITACAO_CORES} />} />
=======
            <Route path="" element={<Navigate to="/dashboard/inicio" replace />} />
            <Route path="resumo" element={<Navigate to="/dashboard/inicio" replace />} />
            <Route path="inicio" element={<Inicio nomeExibido={nomeExibido} usuarioAtual={usuarioAtual} perfilUsuario={perfilUsuario} perfilLabel={perfilLabel} tipoUsuario={tipoUsuario} reservasPendentes={reservasPendentes} reservasAprovadas={reservasAprovadas} reservasCanceladas={reservasCanceladas} solicitacoesArquivadas={solicitacoesArquivadas} reservas={solicitacoes.filter((solicitacao) => solicitacao.status === STATUS_SOLICITACAO.APROVADA)} />} />
            <Route path="nova-reserva" element={<NovaReserva locais={locaisDisponiveis} hojeIso={hojeIso} horarioMinimo={dataReserva === hojeIso ? horarioAtualHHMM : ''} localSelecionado={localSelecionado} setLocalSelecionado={setLocalSelecionado} dataReserva={dataReserva} setDataReserva={setDataReserva} horarioInicio={horarioInicio} setHorarioInicio={setHorarioInicio} horarioFim={horarioFim} setHorarioFim={setHorarioFim} proposito={proposito} setProposito={setProposito} enviando={enviando} erroEnvio={erroEnvio} sucessoEnvio={sucessoEnvio} handleEnviarSolicitacao={handleEnviarSolicitacao} />} />
            <Route path="locais" element={<Locais locais={locais} carregando={carregandoLocais} erro={erroLocais} onTentarNovamente={carregarLocais} />} />
            <Route path="locais/:localId" element={<LocalDetalhe locais={locais} carregando={carregandoLocais} erro={erroLocais} onTentarNovamente={carregarLocais} onReservar={(id) => { setLocalSelecionado(id); navigate('/dashboard/nova-reserva') }} />} />
            <Route path="aulas-extras/:aulaId" element={<ProtectedRoute allowedRoles={['aluno']}><AulaExtraDetalhe /></ProtectedRoute>} />
            <Route path="presencas" element={<ProtectedRoute allowedRoles={['aluno']}><RegistrarPresenca /></ProtectedRoute>} />
            <Route path="aulas-extras" element={<ProtectedRoute allowedRoles={['aluno', 'professor', 'admin']}><AulasExtras modo={tipoUsuario === 'aluno' ? 'aluno' : 'solicitar'} /></ProtectedRoute>} />
            <Route path="solicitacoes" element={<Solicitacoes abaSolicitacoes={abaSolicitacoes} setAbaSolicitacoes={setAbaSolicitacoes} filtroStatus={filtroStatusSolicitacoes} setFiltroStatus={setFiltroStatusSolicitacoes} solicitacoesAtivas={solicitacoesAtivas} solicitacoesArquivadas={solicitacoesArquivadas} solicitacoesExibidas={solicitacoesExibidas} carregandoSolicitacoes={carregandoSolicitacoes} abrirCancelar={abrirCancelar} abrirReativar={abrirReativar} abrirExcluirSolicitacao={abrirExcluirSolicitacao} abrirArquivar={abrirArquivar} abrirDesarquivar={abrirDesarquivar} STATUS_SOLICITACAO={STATUS_SOLICITACAO} STATUS_SOLICITACAO_LABELS={STATUS_SOLICITACAO_LABELS} STATUS_SOLICITACAO_CORES={STATUS_SOLICITACAO_CORES} />} />
>>>>>>> 4fcfbac (atualização geral)
            <Route path="perfil" element={<Perfil nomeExibido={nomeExibido} email={usuarioAtual?.email} perfilLabel={perfilLabel} proximasReservas={proximasReservas} />} />
          </Routes>

        </main>
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
<<<<<<< HEAD
=======
                  <div className="mt-3">
                    <label htmlFor="justificativa-cancelamento" className="form-label">
                      Justificativa do cancelamento (obrigatória)
                    </label>
                    <textarea
                      id="justificativa-cancelamento"
                      className="form-control"
                      rows="3"
                      value={justificativaCancelamento}
                      onChange={(event) => setJustificativaCancelamento(event.target.value)}
                      placeholder="Descreva o motivo do cancelamento."
                    />
                  </div>
>>>>>>> 4fcfbac (atualização geral)
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

      {modalReativar && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Tentar Novamente</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharReativar}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Deseja tentar enviar novamente a solicitação para o local{' '}
                    <strong>{modalReativar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    A solicitação voltará para o status "Pendente" para nova análise do administrador.
                  </p>
                  {erroReativar && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroReativar}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharReativar}
                    disabled={processandoReativar}
                  >
                    Manter Cancelada
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={confirmarReativar}
                    disabled={processandoReativar}
                  >
                    {processandoReativar ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Reativando...
                      </>
                    ) : (
                      'Tentar Novamente'
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
                <div className="modal-header">
                  <h5 className="modal-title">Excluir Solicitação</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharExcluir}
                    aria-label="Fechar"
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Tem certeza que deseja excluir permanentemente a solicitação para o local{' '}
                    <strong>{modalExcluir.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    Esta ação não pode ser desfeita. A solicitação será removida permanentemente.
                  </p>
                  {erroExcluir && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroExcluir}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharExcluir}
                    disabled={processandoExcluir}
                  >
                    Manter Solicitação
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarExcluir}
                    disabled={processandoExcluir}
                  >
                    {processandoExcluir ? (
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
                    Deseja arquivar a solicitação para o local{' '}
                    <strong>{modalArquivar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    A solicitação sairá da lista de ativas e ficará na aba "Arquivadas". Você poderá desarquivá-la a qualquer momento.
                  </p>
                  {erroArquivar && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroArquivar}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharArquivar}
                    disabled={processandoArquivar}
                  >
                    Manter Ativa
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={confirmarArquivar}
                    disabled={processandoArquivar}
                  >
                    {processandoArquivar ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Arquivando...
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
                    Deseja desarquivar a solicitação para o local{' '}
                    <strong>{modalDesarquivar.localNome}</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    A solicitação voltará para a lista de ativas com o status anterior ao arquivamento.
                  </p>
                  {erroDesarquivar && (
                    <div className="alert alert-danger py-2 mb-0 mt-3" role="alert">
                      {erroDesarquivar}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharDesarquivar}
                    disabled={processandoDesarquivar}
                  >
                    Manter Arquivada
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={confirmarDesarquivar}
                    disabled={processandoDesarquivar}
                  >
                    {processandoDesarquivar ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Desarquivando...
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

export default Dashboard
