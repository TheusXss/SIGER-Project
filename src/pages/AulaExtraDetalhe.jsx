import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { buscarAulaExtraDaTurma, inscreverAlunoAulaExtra } from '../services/aulaExtraService'

function formatarData(dataIso) {
  if (!dataIso) return 'Não informada'
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function AulaExtraDetalhe() {
  const { aulaId } = useParams()
  const { usuarioAtual, perfilUsuario } = useAuth()
  const [aula, setAula] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [inscrevendo, setInscrevendo] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!usuarioAtual?.uid || !perfilUsuario?.turmaId) return undefined
    let ativo = true
    buscarAulaExtraDaTurma({
      uid: usuarioAtual.uid,
      turmaId: perfilUsuario.turmaId,
      aulaId,
    })
      .then((dados) => {
        if (ativo) setAula(dados)
      })
      .catch((error) => {
        console.error('Erro ao carregar detalhes da aula extra:', error)
        if (ativo) setErro('Não foi possível carregar os detalhes desta aula.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => { ativo = false }
  }, [aulaId, perfilUsuario?.turmaId, usuarioAtual?.uid])

  async function inscreverSe() {
    setInscrevendo(true)
    setErro('')
    setMensagem('')
    try {
      await inscreverAlunoAulaExtra({
        alunoUid: usuarioAtual.uid,
        turmaId: perfilUsuario.turmaId,
        aulaId,
      })
      setAula((atual) => ({ ...atual, inscrito: true }))
      setMensagem('Inscrição confirmada. O professor poderá registrar sua presença nesta aula.')
    } catch (error) {
      console.error('Erro ao inscrever aluno na aula extra:', error)
      setErro(error.message || 'Não foi possível concluir sua inscrição.')
    } finally {
      setInscrevendo(false)
    }
  }

  return (
    <article className="extra-lesson-detail">
      <Link to="/dashboard/aulas-extras" className="location-detail-back">
        Voltar para Aulas Extras
      </Link>

      {carregando ? (
        <div className="d-flex justify-content-center py-5" role="status" aria-label="Carregando detalhes da aula">
          <span className="spinner-border text-primary" />
        </div>
      ) : erro ? (
        <div className="alert alert-danger" role="alert">{erro}</div>
      ) : !aula ? (
        <div className="extra-lessons-empty">Esta aula extra não está disponível para sua turma.</div>
      ) : (
        <>
          {aula.localImagem ? (
            <div className="extra-lesson-detail-media">
              <img src={aula.localImagem} alt={`Local da aula: ${aula.localNome || 'local cadastrado'}`} />
            </div>
          ) : (
            <div className="extra-lesson-detail-media extra-lesson-detail-no-image">
              <span>Sem foto cadastrada para o local</span>
            </div>
          )}

          <header className="extra-lesson-detail-heading">
            <div>
              <span className="eyebrow">Aula Extra · {aula.materia || 'Matéria não informada'}</span>
              <h1>{aula.titulo}</h1>
            </div>
            <span className={`badge ${aula.statusAula === 'finalizada' ? 'bg-secondary' : 'bg-success-subtle text-success'}`}>
              {aula.statusAula === 'finalizada' ? 'Finalizada' : 'Disponível'}
            </span>
          </header>

          <dl className="extra-lesson-summary" aria-label="Resumo da aula">
            <div className="extra-lesson-summary-item">
              <dt>Data</dt>
              <dd>{formatarData(aula.data)}</dd>
            </div>
            <div className="extra-lesson-summary-item">
              <dt>Horário</dt>
              <dd>{aula.horario || 'Não informado'}</dd>
            </div>
            <div className="extra-lesson-summary-item">
              <dt>Local</dt>
              <dd>{aula.localNome || 'Não informado'}</dd>
            </div>
            <div className="extra-lesson-summary-item">
              <dt>Turma</dt>
              <dd>{perfilUsuario?.turmaNome || aula.turmas?.find((turma) => turma.id === perfilUsuario?.turmaId)?.nome || 'Sua turma'}</dd>
            </div>
            {aula.professorNome && (
              <div className="extra-lesson-summary-item">
                <dt>Professor</dt>
                <dd>{aula.professorNome}</dd>
              </div>
            )}
          </dl>

          <div className="extra-lesson-detail-layout">
            <section className="extra-lesson-detail-description">
              <span className="eyebrow">Conteúdo</span>
              <h2 className="h4 mb-3">Sobre esta aula</h2>
              <p>{aula.descricao || 'Nenhuma descrição informada para esta aula.'}</p>
            </section>

            <aside className="extra-lesson-enrollment-panel">
              <span className="eyebrow">Participação</span>
              <h2 className="h5 mt-1">Sua inscrição</h2>
              <p className="small text-muted">Inscreva-se para o professor registrar sua presença nesta aula.</p>
              {mensagem && <div className="alert alert-success py-2" role="status">{mensagem}</div>}
              {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
              {aula.inscrito ? (
                <div className="extra-lesson-enrolled" role="status">
                  <span className="extra-lesson-enrolled-mark" aria-hidden="true">✓</span>
                  <span>Você está inscrito</span>
                </div>
              ) : aula.statusAula === 'finalizada' || aula.statusAula === 'cancelada' ? (
                <div className="alert alert-secondary py-2 mb-0">As inscrições para esta aula estão encerradas.</div>
              ) : (
                <button type="button" className="btn btn-primary w-100" onClick={inscreverSe} disabled={inscrevendo}>
                  {inscrevendo ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Inscrevendo...</> : 'Inscrever-me nesta aula'}
                </button>
              )}
              <p className="extra-lesson-enrollment-note">A inscrição fica vinculada à sua turma.</p>
            </aside>
          </div>
        </>
      )}
    </article>
  )
}