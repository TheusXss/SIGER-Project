import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventosCalendario } from '../services/eventoService'
import {
  marcarAprovacaoAulaExtraComoLida,
  marcarAulaExtraComoLida,
  observarAprovacoesAulaExtraProfessor,
  observarAulasExtrasDoAluno,
} from '../services/aulaExtraService'

function diferencaEmDias(dataIso, hoje) {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  const dataCompromisso = Date.UTC(ano, mes - 1, dia)
  const dataHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((dataCompromisso - dataHoje) / 86400000)
}

function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function NotificacoesBell({ reservas = [], usuarioId = '', role = '', turmaId = '' }) {
  const [eventos, setEventos] = useState([])
  const [aulasExtras, setAulasExtras] = useState([])
  const [aprovacoesAulas, setAprovacoesAulas] = useState([])
  const [aberto, setAberto] = useState(false)
  const [hoje, setHoje] = useState(() => new Date())

  useEffect(() => {
    let ativo = true
    listarEventosCalendario()
      .then((dados) => {
        if (ativo) setEventos(dados)
      })
      .catch((error) => {
        console.error('Erro ao carregar notificações do calendário:', error)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (role !== 'aluno') {
      return undefined
    }
    return observarAulasExtrasDoAluno({
      uid: usuarioId,
      turmaId,
      aoAtualizar: setAulasExtras,
      aoErro: (error) => console.error('Erro ao acompanhar aulas extras da turma:', error),
    })
  }, [role, turmaId, usuarioId])

  useEffect(() => {
    if (role !== 'professor') return undefined
    return observarAprovacoesAulaExtraProfessor({
      professorUid: usuarioId,
      aoAtualizar: setAprovacoesAulas,
      aoErro: (error) => console.error('Erro ao acompanhar aprovações de aulas extras:', error),
    })
  }, [role, usuarioId])

  useEffect(() => {
    const intervalo = setInterval(() => setHoje(new Date()), 60000)
    return () => clearInterval(intervalo)
  }, [])

  const notificacoes = useMemo(() => {
    const compromissos = [
      ...eventos.map((evento) => ({
        id: `evento-${evento.id}`,
        titulo: evento.titulo,
        tipo: evento.tipo === 'Reserva' ? 'Reserva do calendário' : 'Evento',
        data: evento.data,
        detalhe: evento.descricao,
      })),
      ...reservas
        .filter((reserva) => reserva.status === 'aprovada')
        .map((reserva) => ({
          id: `reserva-${reserva.id}`,
          titulo: reserva.localNome || 'Reserva aprovada',
          tipo: 'Reserva aprovada',
          data: reserva.dataReserva,
          detalhe: [reserva.horarioInicio, reserva.horarioFim].filter(Boolean).join(' - '),
        })),
    ]

    const compromissosProximos = compromissos
      .map((compromisso) => ({
        ...compromisso,
        diasRestantes: diferencaEmDias(compromisso.data, hoje),
      }))
      .filter((compromisso) => compromisso.diasRestantes >= 0 && compromisso.diasRestantes <= 5)
      .sort((a, b) => a.diasRestantes - b.diasRestantes || a.data.localeCompare(b.data))
    const notificacoesAulas = (role === 'aluno' ? aulasExtras : [])
      .filter((aula) => !aula.lida)
      .map((aula) => ({
        id: `aula-extra-${aula.id}`,
        aulaId: aula.id,
        titulo: aula.titulo,
        tipo: 'Nova aula extra disponível',
        data: aula.data,
        detalhe: [aula.materia, aula.localNome].filter(Boolean).join(' · '),
        aulaExtra: true,
      }))
    const notificacoesAprovacoes = role === 'professor'
      ? aprovacoesAulas.filter((solicitacao) => !solicitacao.aprovacaoLida).map((solicitacao) => ({
        id: `aula-extra-aprovada-${solicitacao.id}`,
        solicitacaoId: solicitacao.id,
        titulo: solicitacao.titulo,
        tipo: 'Sua aula extra foi aprovada',
        data: solicitacao.data,
        detalhe: [solicitacao.materia, solicitacao.localNome].filter(Boolean).join(' · '),
        aprovacaoAulaExtra: true,
      }))
      : []

    return [...notificacoesAulas, ...notificacoesAprovacoes, ...compromissosProximos]
  }, [aulasExtras, aprovacoesAulas, eventos, hoje, reservas, role])

  async function abrirNotificacaoAula(aulaId) {
    try {
      await marcarAulaExtraComoLida({ uid: usuarioId, aulaId })
      setAulasExtras((atuais) => atuais.map((aula) => aula.id === aulaId ? { ...aula, lida: true } : aula))
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  async function abrirNotificacaoAprovacao(solicitacaoId) {
    try {
      await marcarAprovacaoAulaExtraComoLida({ professorUid: usuarioId, solicitacaoId })
      setAprovacoesAulas((atuais) => atuais.map((solicitacao) => (
        solicitacao.id === solicitacaoId ? { ...solicitacao, aprovacaoLida: true } : solicitacao
      )))
    } catch (error) {
      console.error('Erro ao marcar aprovação como lida:', error)
    }
  }

  function textoPrazo(dias) {
    if (dias === 0) return 'Hoje'
    if (dias === 1) return 'Amanhã'
    return `Faltam ${dias} dias`
  }

  return (
    <div className="notification-area">
      <button
        type="button"
        className={`notification-bell ${notificacoes.length ? 'has-notifications' : ''}`}
        aria-label={`Notificações${notificacoes.length ? `, ${notificacoes.length} compromissos próximos` : ''}`}
        aria-expanded={aberto}
        aria-controls="notificacoes-proximas"
        title="Notificações de aulas extras, eventos e reservas"
        onClick={() => setAberto((valor) => !valor)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {notificacoes.length > 0 && (
          <span className="notification-count" aria-hidden="true">
            {notificacoes.length > 9 ? '9+' : notificacoes.length}
          </span>
        )}
      </button>

      {aberto && (
        <div id="notificacoes-proximas" className="notification-panel" aria-label="Próximos compromissos">
          <div className="notification-panel-header">
            <strong>Notificações e próximos compromissos</strong>
            <span>{notificacoes.length}</span>
          </div>
          {notificacoes.length ? (
            <ul className="notification-list">
              {notificacoes.map((notificacao) => (
                <li key={notificacao.id}>
                  {notificacao.aulaExtra || notificacao.aprovacaoAulaExtra ? (
                    <Link
                      to="/dashboard/aulas-extras"
                      className="notification-item notification-item-link"
                      onClick={() => notificacao.aulaExtra
                        ? abrirNotificacaoAula(notificacao.aulaId)
                        : abrirNotificacaoAprovacao(notificacao.solicitacaoId)}
                    >
                      <span className="notification-item-date">{formatarData(notificacao.data)}</span>
                      <span className="notification-item-content">
                        <strong>{notificacao.titulo}</strong>
                        <span>{notificacao.tipo}{notificacao.detalhe ? ` · ${notificacao.detalhe}` : ''}</span>
                      </span>
                      <span className="notification-item-time">{notificacao.aprovacaoAulaExtra ? 'Aprovada' : 'Nova'}</span>
                    </Link>
                  ) : (
                    <div className="notification-item">
                      <span className="notification-item-date">{formatarData(notificacao.data)}</span>
                      <div className="notification-item-content">
                        <strong>{notificacao.titulo}</strong>
                        <span>{notificacao.tipo}{notificacao.detalhe ? ` · ${notificacao.detalhe}` : ''}</span>
                      </div>
                      <span className="notification-item-time">{textoPrazo(notificacao.diasRestantes)}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="notification-empty">Nenhum evento ou reserva nos próximos cinco dias.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificacoesBell