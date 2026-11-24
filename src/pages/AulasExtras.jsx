import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import AdminNavbar from '../components/admin/AdminNavbar'
import { listarTurmas } from '../services/verifiedAccountService'
import { listarLocais } from '../services/locationService'
import {
  criarSolicitacaoAulaExtra,
  listarAulasExtras,
  listarInscritosAulaExtra,
  listarSolicitacoesAulaExtra,
  marcarAulaExtraComoLida,
  atualizarPresencaAulaExtra,
  finalizarAulaExtra,
  solicitarExclusaoAulaExtra,
  listarPedidosExclusaoProfessor,
  listarPedidosExclusaoAulaExtra,
  processarPedidoExclusaoAulaExtra,
  processarSolicitacaoAulaExtra,
  STATUS_AULA_EXTRA,
} from '../services/aulaExtraService'

const STATUS_LABELS = {
  [STATUS_AULA_EXTRA.PENDENTE]: 'Pendente',
  [STATUS_AULA_EXTRA.APROVADA]: 'Aprovada',
  [STATUS_AULA_EXTRA.RECUSADA]: 'Recusada',
}

const STATUS_CLASSES = {
  [STATUS_AULA_EXTRA.PENDENTE]: 'bg-warning-subtle text-warning-emphasis',
  [STATUS_AULA_EXTRA.APROVADA]: 'bg-success-subtle text-success',
  [STATUS_AULA_EXTRA.RECUSADA]: 'bg-danger-subtle text-danger',
}

function formatarData(valor) {
  if (!valor) return 'Não informada'
  const data = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(`${valor}T00:00:00`)
  if (Number.isNaN(data.getTime())) return 'Não informada'
  return data.toLocaleDateString('pt-BR')
}

function formatarDataHora(valor) {
  if (!valor) return 'Enviada agora'
  const data = typeof valor?.toDate === 'function' ? valor.toDate() : new Date(valor)
  if (Number.isNaN(data.getTime())) return 'Enviada agora'
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function CartaoSolicitacao({ solicitacao, admin, onDetalhes, onDecisao }) {
  return (
    <article className="card shell-card extra-lesson-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div className="min-w-0">
            {admin && (
              <p className="small text-muted mb-1">
                {solicitacao.solicitanteRole === 'admin'
                  ? `Solicitante: ${solicitacao.solicitanteNome} (Administrador)`
                  : `Professor: ${solicitacao.professorNome}`}
              </p>
            )}
            <h3 className="h5 mb-1">{solicitacao.titulo}</h3>
            <p className="small text-muted mb-0">{solicitacao.materia} · Aula em {formatarData(solicitacao.data)}{solicitacao.horario ? ` às ${solicitacao.horario}` : ''}</p>
          </div>
          <span className={`badge ${STATUS_CLASSES[solicitacao.status] || 'bg-secondary'}`}>
            {STATUS_LABELS[solicitacao.status] || solicitacao.status}
          </span>
        </div>
        <p className="extra-lesson-description mt-3 mb-3">{solicitacao.descricao}</p>
        <div className="extra-lesson-meta">
          <div>
            <span className="extra-lesson-label">Turmas</span>
            <span>{(solicitacao.turmas || []).map((turma) => turma.nome).join(', ') || 'Nenhuma turma informada'}</span>
          </div>
          <div>
            <span className="extra-lesson-label">Local</span>
            <span>{solicitacao.localNome || 'Não informado'}</span>
          </div>
          <div>
            <span className="extra-lesson-label">Solicitada em</span>
            <span>{formatarDataHora(solicitacao.createdAt)}</span>
          </div>
        </div>
        {solicitacao.status === STATUS_AULA_EXTRA.RECUSADA && solicitacao.justificativaRecusa && (
          <div className="alert alert-danger py-2 mt-3 mb-0">
            <strong>Justificativa da recusa:</strong> {solicitacao.justificativaRecusa}
          </div>
        )}
        {admin && (
          <div className="d-flex gap-2 flex-wrap mt-3">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => onDetalhes(solicitacao)}>
              Ver detalhes
            </button>
            {solicitacao.status === STATUS_AULA_EXTRA.PENDENTE && (
              <>
                <button type="button" className="btn btn-success btn-sm" onClick={() => onDecisao(solicitacao, true)}>
                  Aprovar
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDecisao(solicitacao, false)}>
                  Recusar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function CartaoAulaDisponivel({ aula, onMarcarComoLida }) {
  return (
    <article className="card shell-card extra-lesson-card student-extra-lesson-card">
      {aula.localImagem && (
        <img className="student-extra-lesson-image" src={aula.localImagem} alt={`Local da aula: ${aula.localNome || 'local cadastrado'}`} loading="lazy" />
      )}
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="small text-muted mb-1">{aula.materia} · Aula Extra</p>
            <h2 className="h5 mb-1">{aula.titulo}</h2>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <span className={`badge ${aula.statusAula === 'finalizada' ? 'bg-secondary' : 'bg-success-subtle text-success'}`}>
              {aula.statusAula === 'finalizada' ? 'Finalizada' : 'Disponível'}
            </span>
            {!aula.lida && <span className="badge bg-primary">Nova</span>}
          </div>
        </div>
        <div className="extra-lesson-meta mt-3">
          <div>
            <span className="extra-lesson-label">Data e horário</span>
            <span>{formatarData(aula.data)}{aula.horario ? ` às ${aula.horario}` : ''}</span>
          </div>
          <div>
            <span className="extra-lesson-label">Local</span>
            <span>{aula.localNome || 'Não informado'}</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap mt-3">
          <Link to={`/dashboard/aulas-extras/${aula.id}`} className="btn btn-outline-primary btn-sm">
            Ver mais
          </Link>
          {!aula.lida && (
            <button type="button" className="btn btn-link btn-sm" onClick={() => onMarcarComoLida(aula.id)}>
              Marcar como lida
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function AulasExtras({ modo = 'solicitar' }) {
  const { usuarioAtual, perfilUsuario } = useAuth()
  const usuarioUid = usuarioAtual?.uid
  const ehAdmin = perfilUsuario?.role === 'admin'
  const ehProfessor = perfilUsuario?.role === 'professor'
  const gerenciando = modo === 'gerenciar'
  const [turmas, setTurmas] = useState([])
  const [locais, setLocais] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [pedidosExclusao, setPedidosExclusao] = useState([])
  const [aulasAluno, setAulasAluno] = useState([])
  const [aulasProfessor, setAulasProfessor] = useState([])
  const [inscritosPorAula, setInscritosPorAula] = useState({})
  const [aulaExpandida, setAulaExpandida] = useState('')
  const [pedidoExclusao, setPedidoExclusao] = useState(null)
  const [observacaoExclusao, setObservacaoExclusao] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [carregandoAulasAluno, setCarregandoAulasAluno] = useState(true)
  const [carregandoAulasProfessor, setCarregandoAulasProfessor] = useState(true)
  const [carregandoTurmas, setCarregandoTurmas] = useState(true)
  const [carregandoLocais, setCarregandoLocais] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [processandoGestao, setProcessandoGestao] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modalDetalhes, setModalDetalhes] = useState(null)
  const [modalDecisao, setModalDecisao] = useState(null)
  const [justificativa, setJustificativa] = useState('')
  const [formulario, setFormulario] = useState({
    titulo: '', descricao: '', materia: '', data: '', horario: '', localId: '', turmaIds: [],
  })

  const carregarSolicitacoes = useCallback(async () => {
    if (!gerenciando || !ehAdmin || !usuarioUid) return
    setCarregando(true)
    setErro('')
    try {
      const [dados, pedidos] = await Promise.all([
        listarSolicitacoesAulaExtra({ uid: usuarioUid, ehAdmin }),
        listarPedidosExclusaoAulaExtra(),
      ])
      setSolicitacoes(dados)
      setPedidosExclusao(pedidos)
    } catch (error) {
      console.error('Erro ao carregar solicitações de aulas extras:', error)
      setErro('Não foi possível carregar as solicitações. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [ehAdmin, gerenciando, usuarioUid])

  useEffect(() => {
    if (!gerenciando || !ehAdmin || !usuarioUid) return undefined
    let ativo = true
    Promise.all([
      listarSolicitacoesAulaExtra({ uid: usuarioUid, ehAdmin }),
      listarPedidosExclusaoAulaExtra(),
    ])
      .then(([dados, pedidos]) => {
        if (ativo) {
          setSolicitacoes(dados)
          setPedidosExclusao(pedidos)
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar solicitações de aulas extras:', error)
        if (ativo) setErro('Não foi possível carregar as solicitações. Tente novamente.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [ehAdmin, gerenciando, usuarioUid])

  useEffect(() => {
    if (gerenciando || (!ehProfessor && !ehAdmin)) return undefined
    let ativo = true
    listarTurmas()
      .then((dados) => {
        if (ativo) setTurmas(dados.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')))
      })
      .catch((error) => {
        console.error('Erro ao carregar turmas:', error)
        if (ativo) setErro('Não foi possível carregar as turmas cadastradas.')
      })
      .finally(() => {
        if (ativo) setCarregandoTurmas(false)
      })
    return () => { ativo = false }
  }, [ehAdmin, ehProfessor, gerenciando])

  useEffect(() => {
    if (gerenciando || (!ehProfessor && !ehAdmin)) return undefined
    let ativo = true
    listarLocais()
      .then((dados) => {
        if (ativo) setLocais(dados.filter((local) => local.status === 'Disponível'))
      })
      .catch((error) => {
        console.error('Erro ao carregar locais:', error)
        if (ativo) setErro('Não foi possível carregar os locais disponíveis.')
      })
      .finally(() => {
        if (ativo) setCarregandoLocais(false)
      })
    return () => { ativo = false }
  }, [ehAdmin, ehProfessor, gerenciando])

  useEffect(() => {
    if (modo !== 'aluno' || !usuarioUid || !perfilUsuario?.turmaId) return undefined
    let ativo = true
    listarAulasExtras({ uid: usuarioUid, role: 'aluno', turmaId: perfilUsuario.turmaId })
      .then((aulas) => {
        if (ativo) setAulasAluno(aulas)
      })
      .catch((error) => {
        console.error('Erro ao carregar aulas extras da turma:', error)
        if (ativo) setErro('Não foi possível carregar as aulas extras da sua turma.')
      })
      .finally(() => {
        if (ativo) setCarregandoAulasAluno(false)
      })
    return () => { ativo = false }
  }, [modo, perfilUsuario?.turmaId, usuarioUid])

  const carregarAulasProfessor = useCallback(async () => {
    if (modo !== 'solicitar' || !ehProfessor || !usuarioUid) return
    setCarregandoAulasProfessor(true)
    try {
      const [aulas, pedidos] = await Promise.all([
        listarAulasExtras({ uid: usuarioUid, role: 'professor' }),
        listarPedidosExclusaoProfessor(usuarioUid),
      ])
      const pedidosPorAula = new Map(pedidos.map((pedido) => [pedido.aulaId, pedido]))
      setAulasProfessor(aulas.map((aula) => ({ ...aula, pedidoExclusao: pedidosPorAula.get(aula.id) || null })))
    } catch (error) {
      console.error('Erro ao carregar aulas do professor:', error)
      setErro('Não foi possível carregar suas aulas extras aprovadas.')
    } finally {
      setCarregandoAulasProfessor(false)
    }
  }, [ehProfessor, modo, usuarioUid])

  useEffect(() => {
    if (modo !== 'solicitar' || !ehProfessor || !usuarioUid) return undefined
    let ativo = true
    Promise.all([
      listarAulasExtras({ uid: usuarioUid, role: 'professor' }),
      listarPedidosExclusaoProfessor(usuarioUid),
    ])
      .then(([aulas, pedidos]) => {
        if (!ativo) return
        const pedidosPorAula = new Map(pedidos.map((pedido) => [pedido.aulaId, pedido]))
        setAulasProfessor(aulas.map((aula) => ({ ...aula, pedidoExclusao: pedidosPorAula.get(aula.id) || null })))
      })
      .catch((error) => {
        console.error('Erro ao carregar aulas do professor:', error)
        if (ativo) setErro('Não foi possível carregar suas aulas extras aprovadas.')
      })
      .finally(() => {
        if (ativo) setCarregandoAulasProfessor(false)
      })
    return () => { ativo = false }
  }, [ehProfessor, modo, usuarioUid])

  if (gerenciando ? !ehAdmin : modo === 'aluno' ? perfilUsuario?.role !== 'aluno' : (!ehAdmin && !ehProfessor)) {
    return <Navigate to="/dashboard/inicio" replace />
  }

  function alternarTurma(turmaId) {
    setFormulario((atual) => ({
      ...atual,
      turmaIds: atual.turmaIds.includes(turmaId)
        ? atual.turmaIds.filter((id) => id !== turmaId)
        : [...atual.turmaIds, turmaId],
    }))
  }

  async function enviarSolicitacao(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')
    setEnviando(true)
    try {
      await criarSolicitacaoAulaExtra({
        ...formulario,
        uid: usuarioAtual.uid,
      })
      setFormulario({ titulo: '', descricao: '', materia: '', data: '', horario: '', localId: '', turmaIds: [] })
      setSucesso('Solicitação enviada ao administrador.')
    } catch (error) {
      console.error('Erro ao enviar solicitação de aula extra:', error)
      setErro(error.message || 'Não foi possível enviar a solicitação.')
    } finally {
      setEnviando(false)
    }
  }

  async function marcarComoLida(aulaId) {
    try {
      await marcarAulaExtraComoLida({ uid: usuarioUid, aulaId })
      setAulasAluno((atuais) => atuais.map((aula) => aula.id === aulaId ? { ...aula, lida: true } : aula))
    } catch (error) {
      console.error('Erro ao marcar aula extra como lida:', error)
      setErro('Não foi possível marcar a aula como lida.')
    }
  }

  async function alternarListaInscritos(aulaId) {
    if (aulaExpandida === aulaId) {
      setAulaExpandida('')
      return
    }
    setAulaExpandida(aulaId)
    if (inscritosPorAula[aulaId]) return
    setProcessandoGestao(true)
    try {
      const inscritos = await listarInscritosAulaExtra(aulaId)
      setInscritosPorAula((atuais) => ({ ...atuais, [aulaId]: inscritos }))
    } catch (error) {
      console.error('Erro ao carregar inscritos da aula extra:', error)
      setErro('Não foi possível carregar os alunos inscritos.')
    } finally {
      setProcessandoGestao(false)
    }
  }

  async function marcarPresenca(aulaId, alunoUid, presente) {
    setErro('')
    try {
      await atualizarPresencaAulaExtra({ professorUid: usuarioUid, aulaId, alunoUid, presente })
      setInscritosPorAula((atuais) => ({
        ...atuais,
        [aulaId]: (atuais[aulaId] || []).map((aluno) => aluno.id === alunoUid
          ? { ...aluno, presenca: presente ? 'presente' : 'ausente' }
          : aluno),
      }))
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      setErro(error.message || 'Não foi possível registrar a presença.')
    }
  }

  async function confirmarFinalizacao(aula) {
    if (!window.confirm(`Finalizar a aula "${aula.titulo}"? Depois disso, não será possível alterar a chamada nem aceitar novas inscrições.`)) return
    setProcessandoGestao(true)
    setErro('')
    try {
      await finalizarAulaExtra({ professorUid: usuarioUid, aulaId: aula.id })
      await carregarAulasProfessor()
      setSucesso('Aula extra finalizada.')
    } catch (error) {
      console.error('Erro ao finalizar aula extra:', error)
      setErro(error.message || 'Não foi possível finalizar a aula.')
    } finally {
      setProcessandoGestao(false)
    }
  }

  async function confirmarPedidoExclusao() {
    if (!pedidoExclusao || !observacaoExclusao.trim()) {
      setErro('Informe uma observação para o administrador.')
      return
    }
    setProcessandoGestao(true)
    setErro('')
    try {
      await solicitarExclusaoAulaExtra({
        professorUid: usuarioUid,
        aulaId: pedidoExclusao.id,
        observacao: observacaoExclusao,
      })
      setPedidoExclusao(null)
      setObservacaoExclusao('')
      setSucesso('Pedido de exclusão enviado ao administrador.')
      await carregarAulasProfessor()
    } catch (error) {
      console.error('Erro ao solicitar exclusão da aula extra:', error)
      setErro(error.message || 'Não foi possível enviar o pedido de exclusão.')
    } finally {
      setProcessandoGestao(false)
    }
  }

  async function confirmarDecisao() {
    if (!modalDecisao) return
    if (!modalDecisao.aprovar && !justificativa.trim()) {
      setErro('Informe uma justificativa antes de recusar a solicitação.')
      return
    }
    setProcessando(true)
    setErro('')
    setSucesso('')
    try {
      await processarSolicitacaoAulaExtra({
        solicitacaoId: modalDecisao.solicitacao.id,
        adminUid: usuarioAtual.uid,
        aprovar: modalDecisao.aprovar,
        justificativa,
      })
      setModalDecisao(null)
      setJustificativa('')
      setSucesso(modalDecisao.aprovar ? 'Aula extra aprovada e publicada para as turmas selecionadas.' : 'Solicitação recusada.')
      await carregarSolicitacoes()
    } catch (error) {
      console.error('Erro ao processar solicitação de aula extra:', error)
      setErro(error.message || 'Não foi possível processar a solicitação.')
    } finally {
      setProcessando(false)
    }
  }

  async function processarPedidoExclusao(pedido, aprovar) {
    const acao = aprovar ? 'aprovar o cancelamento' : 'recusar o pedido de exclusão'
    if (!window.confirm(`Deseja ${acao} da aula "${pedido.aulaTitulo}"?`)) return
    setProcessando(true)
    setErro('')
    setSucesso('')
    try {
      await processarPedidoExclusaoAulaExtra({
        adminUid: usuarioUid,
        aulaId: pedido.aulaId,
        aprovar,
        respostaAdmin: aprovar ? 'Pedido de exclusão aprovado.' : 'Pedido de exclusão recusado; a aula continua disponível.',
      })
      setSucesso(aprovar ? 'Aula cancelada e removida da disponibilidade dos alunos.' : 'Pedido recusado; a aula permanece disponível.')
      await carregarSolicitacoes()
    } catch (error) {
      console.error('Erro ao processar pedido de exclusão:', error)
      setErro(error.message || 'Não foi possível processar o pedido de exclusão.')
    } finally {
      setProcessando(false)
    }
  }

  const pendentes = solicitacoes.filter((solicitacao) => solicitacao.status === STATUS_AULA_EXTRA.PENDENTE)

  if (modo === 'aluno') {
    return (
      <section className="space-y-4 extra-lessons-page">
        <header className="extra-lessons-header">
          <div>
            <span className="eyebrow">Conteúdo da turma</span>
            <h1 className="h3 mb-1">Aulas Extras</h1>
            <p className="text-muted mb-0">Aulas extras disponíveis para sua turma.</p>
          </div>
          <span className="badge bg-success-subtle text-success">{aulasAluno.length} disponível{aulasAluno.length === 1 ? '' : 's'}</span>
        </header>
        {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
        {carregandoAulasAluno ? (
          <p className="text-muted" role="status"><span className="spinner-border spinner-border-sm me-2" />Carregando aulas extras...</p>
        ) : aulasAluno.length ? (
          <div className="student-extra-lesson-list">
            {aulasAluno.map((aula) => <CartaoAulaDisponivel key={aula.id} aula={aula} onMarcarComoLida={marcarComoLida} />)}
          </div>
        ) : (
          <div className="extra-lessons-empty">Ainda não há aulas extras disponíveis para sua turma.</div>
        )}
      </section>
    )
  }

  const conteudo = (
    <section className="space-y-4 extra-lessons-page">
      <header className="extra-lessons-header">
        <div>
          <span className="eyebrow">Aulas</span>
          <h1 className="h3 mb-1">Aulas Extras</h1>
          <p className="text-muted mb-0">{gerenciando ? 'Analise solicitações e acompanhe aulas publicadas.' : 'Solicite aulas para as turmas disponíveis.'}</p>
        </div>
        {gerenciando && <span className="badge bg-warning-subtle text-warning-emphasis">{pendentes.length} pendente{pendentes.length === 1 ? '' : 's'}</span>}
      </header>

      {erro && <div className="alert alert-danger mb-0" role="alert">{erro}</div>}
      {sucesso && <div className="alert alert-success mb-0" role="status">{sucesso}</div>}

      {!gerenciando && (
        <section className="card shell-card" aria-labelledby="solicitar-aula-titulo">
          <div className="card-body">
            <h2 id="solicitar-aula-titulo" className="h5 mb-3">Solicitar Aula Extra</h2>
            <form onSubmit={enviarSolicitacao}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="aula-extra-titulo" className="form-label">Título da aula</label>
                  <input id="aula-extra-titulo" className="form-control" value={formulario.titulo} onChange={(event) => setFormulario({ ...formulario, titulo: event.target.value })} maxLength="120" required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="aula-extra-materia" className="form-label">Matéria</label>
                  <input id="aula-extra-materia" className="form-control" value={formulario.materia} onChange={(event) => setFormulario({ ...formulario, materia: event.target.value })} maxLength="100" required />
                </div>
                <div className="col-12">
                  <label htmlFor="aula-extra-descricao" className="form-label">Descrição</label>
                  <textarea id="aula-extra-descricao" className="form-control" rows="3" value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} maxLength="2000" required />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <label htmlFor="aula-extra-data" className="form-label">Data</label>
                  <input id="aula-extra-data" type="date" className="form-control" min={new Date().toISOString().slice(0, 10)} value={formulario.data} onChange={(event) => setFormulario({ ...formulario, data: event.target.value })} required />
                </div>
                <div className="col-sm-6 col-lg-3">
                  <label htmlFor="aula-extra-horario" className="form-label">Horário</label>
                  <input id="aula-extra-horario" type="time" className="form-control" value={formulario.horario} onChange={(event) => setFormulario({ ...formulario, horario: event.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="aula-extra-local" className="form-label">Local da aula</label>
                  <select id="aula-extra-local" className="form-select" value={formulario.localId} onChange={(event) => setFormulario({ ...formulario, localId: event.target.value })} required disabled={carregandoLocais || locais.length === 0}>
                    <option value="">{carregandoLocais ? 'Carregando locais...' : 'Selecione um local disponível'}</option>
                    {locais.map((local) => (
                      <option key={local.id} value={local.id}>
                        {[local.name, local.building, local.floor !== null && local.floor !== undefined ? `Andar ${local.floor}` : ''].filter(Boolean).join(' · ')}
                      </option>
                    ))}
                  </select>
                  {!carregandoLocais && locais.length === 0 && <p className="small text-muted mt-1 mb-0">Não há locais disponíveis cadastrados.</p>}
                </div>
                <div className="col-12">
                  <fieldset className="extra-turma-fieldset">
                    <legend className="form-label">Turmas (até 7 por solicitação)</legend>
                    {carregandoTurmas ? (
                      <p className="small text-muted mb-0" role="status">Carregando turmas cadastradas...</p>
                    ) : turmas.length ? (
                      <div className="extra-turma-list">
                        {turmas.map((turma) => (
                          <label key={turma.id} className={`extra-turma-option ${formulario.turmaIds.includes(turma.id) ? 'selected' : ''}`}>
                            <input type="checkbox" checked={formulario.turmaIds.includes(turma.id)} disabled={!formulario.turmaIds.includes(turma.id) && formulario.turmaIds.length >= 7} onChange={() => alternarTurma(turma.id)} />
                            <span>{turma.nome || turma.turma || turma.id}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="small text-muted mb-0">Não há turmas cadastradas para selecionar.</p>
                    )}
                    <p className="small text-muted mt-2 mb-0">{formulario.turmaIds.length ? `${formulario.turmaIds.length} de 7 turmas selecionadas` : 'Selecione uma ou mais turmas.'}</p>
                  </fieldset>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3" disabled={enviando || carregandoTurmas || carregandoLocais || turmas.length === 0 || !formulario.localId || formulario.turmaIds.length === 0}>
                {enviando ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Enviando...</> : 'Solicitar Aula Extra'}
              </button>
            </form>
          </div>
        </section>
      )}

      {!gerenciando && ehProfessor && (
        <section aria-labelledby="minhas-aulas-aprovadas-titulo">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
            <h2 id="minhas-aulas-aprovadas-titulo" className="h5 mb-0">Minhas Aulas Extras</h2>
            <span className="small text-muted">{aulasProfessor.filter((aula) => aula.statusAula === 'agendada' || !aula.statusAula).length} em andamento</span>
          </div>
          {carregandoAulasProfessor ? (
            <p className="text-muted" role="status"><span className="spinner-border spinner-border-sm me-2" />Carregando suas aulas...</p>
          ) : aulasProfessor.length ? (
            <div className="d-flex flex-column gap-3">
              {aulasProfessor.map((aula) => {
                const status = aula.statusAula || 'agendada'
                const inscritos = inscritosPorAula[aula.id]
                return (
                  <article key={aula.id} className="card shell-card extra-lesson-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <h3 className="h5 mb-1">{aula.titulo}</h3>
                          <p className="small text-muted mb-0">{aula.materia} · {formatarData(aula.data)}{aula.horario ? ` às ${aula.horario}` : ''} · {aula.localNome}</p>
                        </div>
                        <span className={`badge ${status === 'agendada' ? 'bg-success-subtle text-success' : status === 'finalizada' ? 'bg-secondary' : 'bg-danger-subtle text-danger'}`}>
                          {status === 'agendada' ? 'Aprovada / no ar' : status === 'finalizada' ? 'Finalizada' : 'Cancelada'}
                        </span>
                      </div>
                      <p className="extra-lesson-description mt-3 mb-3">{aula.descricao}</p>
                      {status !== 'cancelada' && (
                        <div className="d-flex gap-2 flex-wrap">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => alternarListaInscritos(aula.id)}>
                            {aulaExpandida === aula.id ? 'Ocultar inscritos' : `Inscritos${inscritos ? ` (${inscritos.length})` : ''}`}
                          </button>
                          {status === 'agendada' && (
                            <button type="button" className="btn btn-success btn-sm" onClick={() => confirmarFinalizacao(aula)} disabled={processandoGestao}>Finalizar aula</button>
                          )}
                          {(status === 'agendada' || status === 'finalizada') && !aula.pedidoExclusao && (
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => { setPedidoExclusao(aula); setObservacaoExclusao(''); setErro('') }} disabled={processandoGestao}>Solicitar exclusão</button>
                          )}
                        </div>
                      )}
                      {aula.pedidoExclusao && (
                        <div className={`alert ${aula.pedidoExclusao.status === 'pendente' ? 'alert-warning' : aula.pedidoExclusao.status === 'aprovado' ? 'alert-danger' : 'alert-secondary'} py-2 mt-3 mb-0`}>
                          <strong>Pedido de exclusão: </strong>
                          {aula.pedidoExclusao.status === 'pendente' ? 'aguardando análise do administrador.' : aula.pedidoExclusao.status === 'aprovado' ? 'aprovado; aula cancelada.' : 'recusado; aula mantida.'}
                          <span className="d-block small mt-1">Observação: {aula.pedidoExclusao.observacao}</span>
                          {aula.pedidoExclusao.respostaAdmin && <span className="d-block small">Resposta: {aula.pedidoExclusao.respostaAdmin}</span>}
                        </div>
                      )}
                      {aulaExpandida === aula.id && (
                        <div className="extra-attendance-list mt-3">
                          <h4 className="h6">Alunos inscritos</h4>
                          {processandoGestao && !inscritos ? (
                            <p className="small text-muted" role="status">Carregando inscritos...</p>
                          ) : inscritos?.length ? (
                            inscritos.map((aluno) => (
                              <div key={aluno.id} className="extra-attendance-row">
                                <div>
                                  <strong>{aluno.alunoNome}</strong>
                                  {aluno.matricula && <span className="small text-muted"> · {aluno.matricula}</span>}
                                </div>
                                {status === 'agendada' ? (
                                  <div className="d-flex gap-2">
                                    <button type="button" className={`btn btn-sm ${aluno.presenca === 'presente' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => marcarPresenca(aula.id, aluno.id, true)}>Presente</button>
                                    <button type="button" className={`btn btn-sm ${aluno.presenca === 'ausente' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => marcarPresenca(aula.id, aluno.id, false)}>Ausente</button>
                                  </div>
                                ) : <span className="badge bg-secondary">{aluno.presenca === 'presente' ? 'Presente' : aluno.presenca === 'ausente' ? 'Ausente' : 'Sem chamada'}</span>}
                              </div>
                            ))
                          ) : (
                            <p className="small text-muted mb-0">Nenhum aluno se inscreveu nesta aula.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="extra-lessons-empty">Aulas aprovadas para você aparecerão aqui.</div>
          )}
        </section>
      )}

      {!gerenciando && pedidoExclusao && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5">Solicitar exclusão da aula</h2>
                  <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setPedidoExclusao(null)} disabled={processandoGestao} />
                </div>
                <div className="modal-body">
                  <p>O administrador analisará o pedido. A aula e a chamada permanecerão no histórico até a decisão.</p>
                  <label htmlFor="observacao-exclusao-aula" className="form-label">Observação para o administrador</label>
                  <textarea id="observacao-exclusao-aula" className="form-control" rows="4" maxLength="1000" value={observacaoExclusao} onChange={(event) => setObservacaoExclusao(event.target.value)} required />
                  {erro && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{erro}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setPedidoExclusao(null)} disabled={processandoGestao}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={confirmarPedidoExclusao} disabled={processandoGestao || !observacaoExclusao.trim()}>
                    {processandoGestao ? 'Enviando...' : 'Enviar pedido'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {gerenciando && (
        <section aria-labelledby="solicitacoes-aulas-titulo">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
            <h2 id="solicitacoes-aulas-titulo" className="h5 mb-0">Solicitações de Aulas Extras</h2>
            <span className="small text-muted">Histórico completo: {solicitacoes.length}</span>
          </div>
          {carregando ? (
            <p className="text-muted" role="status"><span className="spinner-border spinner-border-sm me-2" />Carregando solicitações...</p>
          ) : solicitacoes.length ? (
            <div className="d-flex flex-column gap-3">
              {[...pendentes, ...solicitacoes.filter((solicitacao) => solicitacao.status !== STATUS_AULA_EXTRA.PENDENTE)].map((solicitacao) => (
                <CartaoSolicitacao key={solicitacao.id} solicitacao={solicitacao} admin onDetalhes={setModalDetalhes} onDecisao={(item, aprovar) => { setErro(''); setJustificativa(''); setModalDecisao({ solicitacao: item, aprovar }) }} />
              ))}
            </div>
          ) : (
            <div className="extra-lessons-empty">Não há solicitações de aulas extras.</div>
          )}
        </section>
      )}

      {gerenciando && (
        <section aria-labelledby="pedidos-exclusao-aulas-titulo">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
            <h2 id="pedidos-exclusao-aulas-titulo" className="h5 mb-0">Pedidos de exclusão</h2>
            <span className="badge bg-warning-subtle text-warning-emphasis">{pedidosExclusao.length} pendente{pedidosExclusao.length === 1 ? '' : 's'}</span>
          </div>
          {pedidosExclusao.length ? (
            <div className="d-flex flex-column gap-3">
              {pedidosExclusao.map((pedido) => (
                <article key={pedido.id} className="card shell-card extra-lesson-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div>
                        <h3 className="h6 mb-1">{pedido.aulaTitulo}</h3>
                        <p className="small text-muted mb-2">Professor: {pedido.professorNome} · Enviado em {formatarDataHora(pedido.createdAt)}</p>
                      </div>
                      <span className="badge bg-warning-subtle text-warning-emphasis">Aguardando decisão</span>
                    </div>
                    <div className="alert alert-light border py-2 mb-3">
                      <strong>Observação do professor:</strong> {pedido.observacao}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => processarPedidoExclusao(pedido, true)} disabled={processando}>
                        Aprovar cancelamento
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => processarPedidoExclusao(pedido, false)} disabled={processando}>
                        Manter aula ativa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="extra-lessons-empty">Não há pedidos de exclusão aguardando análise.</div>
          )}
        </section>
      )}

      {gerenciando && (modalDetalhes || modalDecisao) && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5">{modalDetalhes ? 'Detalhes da solicitação' : modalDecisao.aprovar ? 'Aprovar aula extra' : 'Recusar solicitação'}</h2>
                  <button type="button" className="btn-close" aria-label="Fechar" onClick={() => { setModalDetalhes(null); setModalDecisao(null); setErro('') }} />
                </div>
                <div className="modal-body">
                  {(modalDetalhes || modalDecisao?.solicitacao) && (
                    <>
                      <h3 className="h6">{(modalDetalhes || modalDecisao.solicitacao).titulo}</h3>
                      <p className="small text-muted mb-2">{(modalDetalhes || modalDecisao.solicitacao).materia} · {formatarData((modalDetalhes || modalDecisao.solicitacao).data)} às {(modalDetalhes || modalDecisao.solicitacao).horario || 'horário não informado'}</p>
                      <p>{(modalDetalhes || modalDecisao.solicitacao).descricao}</p>
                      {(modalDetalhes || modalDecisao.solicitacao).professorNome && <p className="mb-1"><strong>Professor responsável:</strong> {(modalDetalhes || modalDecisao.solicitacao).professorNome}</p>}
                      <p className="mb-1"><strong>Solicitante:</strong> {(modalDetalhes || modalDecisao.solicitacao).solicitanteNome || (modalDetalhes || modalDecisao.solicitacao).professorNome}</p>
                      <p className="mb-1"><strong>Local:</strong> {(modalDetalhes || modalDecisao.solicitacao).localNome || 'Não informado'}</p>
                      <p className="mb-1"><strong>Turmas:</strong> {((modalDetalhes || modalDecisao.solicitacao).turmas || []).map((turma) => turma.nome).join(', ')}</p>
                      <p className="mb-0"><strong>Solicitada em:</strong> {formatarDataHora((modalDetalhes || modalDecisao.solicitacao).createdAt)}</p>
                    </>
                  )}
                  {modalDecisao && !modalDecisao.aprovar && (
                    <div className="mt-3">
                      <label htmlFor="aula-extra-justificativa" className="form-label">Justificativa da recusa</label>
                      <textarea id="aula-extra-justificativa" className="form-control" rows="3" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} required />
                    </div>
                  )}
                  {erro && <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">{erro}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => { setModalDetalhes(null); setModalDecisao(null); setErro('') }} disabled={processando}>Fechar</button>
                  {modalDecisao && <button type="button" className={`btn ${modalDecisao.aprovar ? 'btn-success' : 'btn-danger'}`} onClick={confirmarDecisao} disabled={processando}>
                    {processando ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Processando...</> : modalDecisao.aprovar ? 'Confirmar aprovação' : 'Confirmar recusa'}
                  </button>}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
    </section>
  )

  return (
    <>
      {gerenciando && (
        <>
          <AdminNavbar />
          <div className="container app-shell">
            <div className="card shell-card profile-card">
              <div className="card-body profile-body">
                <div>
                  <span className="eyebrow">Administração</span>
                  <h2 className="h3 mb-1">Olá, {perfilUsuario?.name || usuarioAtual?.displayName || 'admin'}!</h2>
                </div>
                <p className="text-muted mb-0">Gerencie as solicitações de aulas extras.</p>
              </div>
            </div>
            {conteudo}
          </div>
        </>
      )}
      {!gerenciando && <div className="space-y-4">{conteudo}</div>}
    </>
  )
}