import { useEffect, useMemo, useState } from 'react'
import {
  criarEventoCalendario,
  excluirEventoCalendario,
  listarEventosCalendario,
} from '../services/eventoService'
import { listarAulasExtras } from '../services/aulaExtraService'

function formatarDataIso(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function Calendario({ reservas = [], editavel = false, usuarioId = '', role = '', turmaId = '' }) {
  const [mesAtual, setMesAtual] = useState(() => new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(() => new Date())
  const [eventos, setEventos] = useState([])
  const [aulasExtras, setAulasExtras] = useState([])
  const [novoEvento, setNovoEvento] = useState({ titulo: '', tipo: 'Evento', descricao: '' })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.allSettled([
      listarEventosCalendario(),
      listarAulasExtras({ uid: usuarioId, role, turmaId }),
    ])
      .then(([resultadoEventos, resultadoAulas]) => {
        if (!ativo) return
        if (resultadoEventos.status === 'fulfilled') {
          setEventos(resultadoEventos.value)
        } else {
          console.error('Erro ao carregar eventos do calendário:', resultadoEventos.reason)
          setErro('Não foi possível carregar os eventos do calendário.')
        }
        if (resultadoAulas.status === 'fulfilled') {
          setAulasExtras(resultadoAulas.value)
        } else {
          console.error('Erro ao carregar aulas extras do calendário:', resultadoAulas.reason)
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [role, turmaId, usuarioId])

  const diasDoCalendario = useMemo(() => {
    const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
    const deslocamento = (primeiroDiaMes.getDay() + 6) % 7
    const inicioCalendario = new Date(primeiroDiaMes)
    inicioCalendario.setDate(primeiroDiaMes.getDate() - deslocamento)

    return Array.from({ length: 42 }, (_, indice) => {
      const dia = new Date(inicioCalendario)
      dia.setDate(inicioCalendario.getDate() + indice)
      return dia
    })
  }, [mesAtual])

  const compromissos = useMemo(() => {
    const reservasAprovadas = reservas
      .filter((reserva) => reserva.status === 'aprovada')
      .map((reserva) => ({
        id: `reserva-${reserva.id}`,
        titulo: reserva.localNome || 'Reserva aprovada',
        tipo: 'Reserva aprovada',
        data: reserva.dataReserva,
        descricao: [
          reserva.usuarioNome && editavel ? `Solicitante: ${reserva.usuarioNome}` : '',
          [reserva.horarioInicio, reserva.horarioFim].filter(Boolean).join(' - '),
          reserva.proposito,
        ].filter(Boolean).join(' · '),
        reserva: true,
      }))

    const aulasMapeadas = aulasExtras.map((aula) => ({
      id: `aula-extra-${aula.id}`,
      titulo: aula.titulo,
      tipo: 'Aula Extra',
      data: aula.data,
      descricao: [
        aula.materia,
        aula.horario,
        aula.localNome,
        aula.professorNome ? `Professor: ${aula.professorNome}` : '',
        aula.descricao,
      ].filter(Boolean).join(' · '),
      reserva: false,
      aulaExtra: true,
    }))

    return [...eventos.map((evento) => ({ ...evento, reserva: false })), ...reservasAprovadas, ...aulasMapeadas]
  }, [eventos, aulasExtras, editavel, reservas])

  const compromissosPorDia = useMemo(() => {
    return compromissos.reduce((agrupados, compromisso) => {
      agrupados[compromisso.data] = [...(agrupados[compromisso.data] || []), compromisso]
      return agrupados
    }, {})
  }, [compromissos])

  const diaSelecionadoIso = formatarDataIso(diaSelecionado)
  const compromissosSelecionados = compromissosPorDia[diaSelecionadoIso] || []

  async function adicionarEvento(event) {
    event.preventDefault()
    const titulo = novoEvento.titulo.trim()
    if (!titulo || !usuarioId) return

    setSalvando(true)
    setErro('')
    try {
      const evento = await criarEventoCalendario({
        ...novoEvento,
        titulo,
        data: diaSelecionadoIso,
        criadoPor: usuarioId,
      })
      setEventos((atuais) => [...atuais, evento])
      setNovoEvento({ titulo: '', tipo: 'Evento', descricao: '' })
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      setErro('Não foi possível salvar o evento. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function removerEvento(id) {
    setErro('')
    try {
      await excluirEventoCalendario(id)
      setEventos((atuais) => atuais.filter((evento) => evento.id !== id))
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      setErro('Não foi possível excluir o evento. Tente novamente.')
    }
  }

  function selecionarDia(dia) {
    setDiaSelecionado(dia)
    setNovoEvento((atual) => ({ ...atual, titulo: '', descricao: '' }))
  }

  return (
    <section className="card shell-card" aria-labelledby="calendario-titulo">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <div>
            <h3 id="calendario-titulo" className="h5 mb-1">Calendário de reservas e eventos</h3>
            <p className="text-muted mb-0">
              {editavel
                ? 'Acompanhe reservas aprovadas e publique eventos para todos os usuários.'
                : 'Suas reservas aprovadas e os eventos publicados pela administração.'}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              aria-label="Mês anterior"
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <span className="fw-semibold text-capitalize">
              {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              aria-label="Próximo mês"
              onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
        </div>

        {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
        {carregando && <p className="small text-muted" role="status">Carregando eventos...</p>}

        <div className="calendar-grid calendar-weekdays" aria-hidden="true">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => <span key={dia}>{dia}</span>)}
        </div>
        <div className="calendar-grid">
          {diasDoCalendario.map((dia) => {
            const iso = formatarDataIso(dia)
            const eHoje = iso === formatarDataIso(new Date())
            const selecionado = iso === diaSelecionadoIso
            const eventosDoDia = compromissosPorDia[iso] || []

            return (
              <button
                key={iso}
                type="button"
                className={`calendar-day ${selecionado ? 'selected' : ''} ${dia.getMonth() !== mesAtual.getMonth() ? 'outside-month' : ''}`}
                aria-label={`${dia.toLocaleDateString('pt-BR')}, ${eventosDoDia.length} compromissos`}
                aria-pressed={selecionado}
                onClick={() => selecionarDia(dia)}
              >
                <span className={`calendar-day-number ${eHoje ? 'today' : ''}`}>{dia.getDate()}</span>
                <span className="calendar-markers" aria-hidden="true">
                  {eventosDoDia.slice(0, 3).map((compromisso) => (
                    <span
                      key={compromisso.id}
                      className={`calendar-marker ${compromisso.reserva || compromisso.tipo === 'Reserva' ? 'reservation' : 'event'}`}
                      title={compromisso.titulo}
                    />
                  ))}
                </span>
                {eventosDoDia.length > 0 && <span className="calendar-day-count">{eventosDoDia.length}</span>}
              </button>
            )
          })}
        </div>

        <div className="row g-3 mt-2">
          <div className={editavel ? 'col-lg-7' : 'col-12'}>
            <h4 className="h6 text-capitalize mb-3">
              {diaSelecionado.toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </h4>
            {compromissosSelecionados.length ? (
              <div className="d-flex flex-column gap-2">
                {compromissosSelecionados.map((compromisso) => (
                  <div key={compromisso.id} className="border rounded p-2">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <strong className="small">{compromisso.titulo}</strong>
                      <span className={`badge ${compromisso.reserva || compromisso.tipo === 'Reserva' ? 'bg-warning text-dark' : compromisso.aulaExtra ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'}`}>
                        {compromisso.tipo}
                      </span>
                    </div>
                    {compromisso.descricao && <p className="small text-muted mb-0 mt-1">{compromisso.descricao}</p>}
                    {editavel && !compromisso.reserva && !compromisso.aulaExtra && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger p-0 mt-2"
                        onClick={() => removerEvento(compromisso.id)}
                      >
                        Excluir evento
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted mb-0">Nenhum evento ou reserva para este dia.</p>
            )}
          </div>

          {editavel && (
            <div className="col-lg-5">
              <form onSubmit={adicionarEvento}>
                <h4 className="h6 mb-3">Adicionar evento</h4>
                <div className="mb-2">
                  <label htmlFor="evento-titulo" className="form-label small">Nome do evento</label>
                  <input
                    id="evento-titulo"
                    type="text"
                    className="form-control form-control-sm"
                    value={novoEvento.titulo}
                    onChange={(event) => setNovoEvento((atual) => ({ ...atual, titulo: event.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="evento-tipo" className="form-label small">Tipo</label>
                  <select
                    id="evento-tipo"
                    className="form-select form-select-sm"
                    value={novoEvento.tipo}
                    onChange={(event) => setNovoEvento((atual) => ({ ...atual, tipo: event.target.value }))}
                  >
                    <option value="Evento">Evento</option>
                    <option value="Reserva">Reserva</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="evento-descricao" className="form-label small">Observação</label>
                  <textarea
                    id="evento-descricao"
                    className="form-control form-control-sm"
                    rows="2"
                    value={novoEvento.descricao}
                    onChange={(event) => setNovoEvento((atual) => ({ ...atual, descricao: event.target.value }))}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm w-100" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Adicionar evento'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Calendario