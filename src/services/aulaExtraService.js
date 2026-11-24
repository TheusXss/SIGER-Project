import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_SOLICITACOES = 'aulasExtrasSolicitacoes'
const COLECAO_AULAS = 'aulasExtras'
const COLECAO_USUARIOS = 'users'
const COLECAO_TURMAS = 'turmas'
const COLECAO_LOCAIS = 'locations'
const COLECAO_PEDIDOS_EXCLUSAO = 'aulasExtrasExclusaoSolicitacoes'

export const STATUS_AULA_EXTRA = {
  PENDENTE: 'pendente',
  APROVADA: 'aprovada',
  RECUSADA: 'recusada',
}

function ordenarMaisRecentes(documentos) {
  return documentos.sort((a, b) => {
    const dataA = a.createdAt?.toDate?.().getTime() || 0
    const dataB = b.createdAt?.toDate?.().getTime() || 0
    return dataB - dataA
  })
}

export async function listarSolicitacoesAulaExtra({ uid, ehAdmin }) {
  const referencia = collection(db, COLECAO_SOLICITACOES)
  const consulta = ehAdmin
    ? referencia
    : query(referencia, where('professorUid', '==', uid))
  const snapshot = await getDocs(consulta)
  return ordenarMaisRecentes(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() })))
}

export async function listarAulasExtras({ uid, role, turmaId }) {
  const referencia = collection(db, COLECAO_AULAS)
  let consulta = referencia

  if (role === 'aluno') {
    if (!turmaId) return []
    consulta = collection(db, COLECAO_TURMAS, turmaId, COLECAO_AULAS)
  } else if (role === 'professor') {
    consulta = query(referencia, where('professorUid', '==', uid))
  }

  const snapshot = await getDocs(consulta)
  const aulas = snapshot.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((aula) => aula.statusAula !== 'cancelada')

  if (role !== 'aluno' || !uid || aulas.length === 0) {
    return ordenarMaisRecentes(aulas)
  }

  return enriquecerAulasDoAluno({ aulas, uid })
}

async function enriquecerAulasDoAluno({ aulas, uid }) {
  if (!aulas.length) return []
  const leiturasSnapshot = await getDocs(collection(db, COLECAO_USUARIOS, uid, 'aulasExtrasLidas'))
  const idsLidos = new Set(leiturasSnapshot.docs.map((documento) => documento.id))
  const localIds = [...new Set(aulas.map((aula) => aula.localId).filter(Boolean))]
  const locais = await Promise.all(localIds.map(async (localId) => {
    const snapshotLocal = await getDoc(doc(db, COLECAO_LOCAIS, localId))
    if (!snapshotLocal.exists()) return [localId, null]
    const local = snapshotLocal.data()
    const primeiraImagem = local.images?.find((item) => (
      (typeof item === 'string' && item.trim()) ||
      (typeof item?.url === 'string' && item.url.trim())
    ))
    const imagem = (typeof primeiraImagem === 'string' ? primeiraImagem : primeiraImagem?.url) || local.imageUrl || ''
    return [localId, imagem]
  }))
  const imagensPorLocal = new Map(locais)

  return ordenarMaisRecentes(aulas.map((aula) => ({
    ...aula,
    localImagem: imagensPorLocal.get(aula.localId) || '',
    lida: idsLidos.has(aula.id),
  })))
}

export async function buscarAulaExtraDaTurma({ uid, turmaId, aulaId }) {
  if (!uid || !turmaId || !aulaId) return null
  const referencia = doc(db, COLECAO_TURMAS, turmaId, COLECAO_AULAS, aulaId)
  const snapshot = await getDoc(referencia)
  if (!snapshot.exists()) return null
  if (snapshot.data().statusAula === 'cancelada') return null
  const [aula] = await enriquecerAulasDoAluno({
    aulas: [{ id: snapshot.id, ...snapshot.data() }],
    uid,
  })
  let inscrito = false
  try {
    const inscricao = await getDoc(doc(db, COLECAO_AULAS, aulaId, 'inscritos', uid))
    inscrito = inscricao.exists()
  } catch (error) {
    console.error('Não foi possível consultar a inscrição da aula extra:', error)
  }
  try {
    await marcarAulaExtraComoLida({ uid, aulaId })
    return { ...aula, lida: true, inscrito }
  } catch (error) {
    console.error('Não foi possível marcar a aula extra como lida:', error)
    return { ...aula, inscrito }
  }
}

export async function inscreverAlunoAulaExtra({ alunoUid, turmaId, aulaId }) {
  const perfilRef = doc(db, COLECAO_USUARIOS, alunoUid)
  const aulaRef = doc(db, COLECAO_AULAS, aulaId)
  const inscricaoRef = doc(db, COLECAO_AULAS, aulaId, 'inscritos', alunoUid)

  await runTransaction(db, async (transaction) => {
    const [perfilSnapshot, aulaSnapshot, inscricaoSnapshot] = await Promise.all([
      transaction.get(perfilRef),
      transaction.get(aulaRef),
      transaction.get(inscricaoRef),
    ])
    const perfil = perfilSnapshot.data()
    const aula = aulaSnapshot.data()
    if (!perfilSnapshot.exists() || perfil?.role !== 'aluno' || perfil.turmaId !== turmaId) {
      throw new Error('Somente alunos da turma selecionada podem se inscrever.')
    }
    if (!aulaSnapshot.exists() || !(aula.turmaIds || []).includes(turmaId)) {
      throw new Error('Esta aula extra não está disponível para sua turma.')
    }
    if (aula.statusAula === 'finalizada' || aula.statusAula === 'cancelada') {
      throw new Error('As inscrições para esta aula estão encerradas.')
    }
    if (inscricaoSnapshot.exists()) return

    transaction.set(inscricaoRef, {
      alunoUid,
      alunoNome: perfil.name || 'Aluno',
      matricula: perfil.matricula || '',
      turmaId,
      inscritoEm: serverTimestamp(),
      presenca: 'pendente',
    })
  })
}

export async function listarInscritosAulaExtra(aulaId) {
  const snapshot = await getDocs(collection(db, COLECAO_AULAS, aulaId, 'inscritos'))
  return snapshot.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => String(a.alunoNome || '').localeCompare(String(b.alunoNome || ''), 'pt-BR'))
}

export async function atualizarPresencaAulaExtra({ professorUid, aulaId, alunoUid, presente }) {
  const aulaRef = doc(db, COLECAO_AULAS, aulaId)
  const professorRef = doc(db, COLECAO_USUARIOS, professorUid)
  const inscricaoRef = doc(db, COLECAO_AULAS, aulaId, 'inscritos', alunoUid)

  await runTransaction(db, async (transaction) => {
    const [aulaSnapshot, professorSnapshot, inscricaoSnapshot] = await Promise.all([
      transaction.get(aulaRef),
      transaction.get(professorRef),
      transaction.get(inscricaoRef),
    ])
    if (!professorSnapshot.exists() || professorSnapshot.data().role !== 'professor') {
      throw new Error('Somente professores podem registrar presença.')
    }
    if (!aulaSnapshot.exists() || aulaSnapshot.data().professorUid !== professorUid) {
      throw new Error('Esta aula não pertence ao seu perfil.')
    }
    if (aulaSnapshot.data().statusAula === 'cancelada') {
      throw new Error('A aula foi cancelada.')
    }
    if (aulaSnapshot.data().statusAula === 'finalizada') {
      throw new Error('A aula já foi finalizada.')
    }
    if (!inscricaoSnapshot.exists()) throw new Error('O aluno não está inscrito nesta aula.')

    transaction.update(inscricaoRef, {
      presenca: presente ? 'presente' : 'ausente',
      presencaAtualizadaEm: serverTimestamp(),
      presencaAtualizadaPor: professorUid,
    })
  })
}

export async function finalizarAulaExtra({ professorUid, aulaId }) {
  const aulaRef = doc(db, COLECAO_AULAS, aulaId)
  const professorRef = doc(db, COLECAO_USUARIOS, professorUid)

  await runTransaction(db, async (transaction) => {
    const [aulaSnapshot, professorSnapshot] = await Promise.all([
      transaction.get(aulaRef),
      transaction.get(professorRef),
    ])
    if (!professorSnapshot.exists() || professorSnapshot.data().role !== 'professor') {
      throw new Error('Somente professores podem finalizar aulas extras.')
    }
    if (!aulaSnapshot.exists() || aulaSnapshot.data().professorUid !== professorUid) {
      throw new Error('Esta aula não pertence ao seu perfil.')
    }
    const aula = aulaSnapshot.data()
    if (aula.statusAula !== 'agendada') throw new Error('A aula não está disponível para finalização.')

    const projecoes = await Promise.all((aula.turmaIds || []).map((turmaId) => {
      const referencia = doc(db, COLECAO_TURMAS, turmaId, COLECAO_AULAS, aulaId)
      return transaction.get(referencia).then((snapshot) => ({ referencia, snapshot }))
    }))
    transaction.update(aulaRef, {
      statusAula: 'finalizada',
      finalizadaEm: serverTimestamp(),
      finalizadaPor: professorUid,
    })
    projecoes.filter(({ snapshot }) => snapshot.exists()).forEach(({ referencia }) => {
      transaction.update(referencia, {
        statusAula: 'finalizada',
        finalizadaEm: serverTimestamp(),
      })
    })
  })
}

export async function solicitarExclusaoAulaExtra({ professorUid, aulaId, observacao }) {
  if (!observacao.trim()) throw new Error('Informe uma observação para o administrador.')
  const aulaRef = doc(db, COLECAO_AULAS, aulaId)
  const professorRef = doc(db, COLECAO_USUARIOS, professorUid)
  const pedidoRef = doc(db, COLECAO_PEDIDOS_EXCLUSAO, aulaId)

  await runTransaction(db, async (transaction) => {
    const [aulaSnapshot, professorSnapshot, pedidoSnapshot] = await Promise.all([
      transaction.get(aulaRef),
      transaction.get(professorRef),
      transaction.get(pedidoRef),
    ])
    if (!professorSnapshot.exists() || professorSnapshot.data().role !== 'professor') {
      throw new Error('Somente professores podem solicitar a exclusão de aulas.')
    }
    if (!aulaSnapshot.exists() || aulaSnapshot.data().professorUid !== professorUid) {
      throw new Error('Esta aula não pertence ao seu perfil.')
    }
    if (aulaSnapshot.data().statusAula === 'cancelada') throw new Error('Esta aula já foi cancelada.')
    if (pedidoSnapshot.exists()) {
      throw new Error('Já existe um pedido de exclusão registrado para esta aula.')
    }

    transaction.set(pedidoRef, {
      aulaId,
      professorUid,
      professorNome: professorSnapshot.data().name || 'Professor',
      aulaTitulo: aulaSnapshot.data().titulo,
      observacao: observacao.trim(),
      historico: [{ observacao: observacao.trim() }],
      status: 'pendente',
      administradorUid: '',
      respostaAdmin: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
}

export async function listarPedidosExclusaoAulaExtra() {
  const snapshot = await getDocs(query(
    collection(db, COLECAO_PEDIDOS_EXCLUSAO),
    where('status', '==', 'pendente'),
  ))
  return ordenarMaisRecentes(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() })))
}

export async function listarPedidosExclusaoProfessor(professorUid) {
  const snapshot = await getDocs(query(
    collection(db, COLECAO_PEDIDOS_EXCLUSAO),
    where('professorUid', '==', professorUid),
  ))
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function processarPedidoExclusaoAulaExtra({ adminUid, aulaId, aprovar, respostaAdmin = '' }) {
  const pedidoRef = doc(db, COLECAO_PEDIDOS_EXCLUSAO, aulaId)
  const aulaRef = doc(db, COLECAO_AULAS, aulaId)
  const adminRef = doc(db, COLECAO_USUARIOS, adminUid)

  await runTransaction(db, async (transaction) => {
    const [pedidoSnapshot, aulaSnapshot, adminSnapshot] = await Promise.all([
      transaction.get(pedidoRef),
      transaction.get(aulaRef),
      transaction.get(adminRef),
    ])
    if (!adminSnapshot.exists() || adminSnapshot.data().role !== 'admin') {
      throw new Error('Somente administradores podem processar pedidos de exclusão.')
    }
    if (!pedidoSnapshot.exists() || pedidoSnapshot.data().status !== 'pendente') {
      throw new Error('Este pedido já foi processado ou não existe.')
    }
    if (!aulaSnapshot.exists() || aulaSnapshot.data().professorUid !== pedidoSnapshot.data().professorUid) {
      throw new Error('A aula vinculada ao pedido não foi encontrada.')
    }

    const pedido = pedidoSnapshot.data()
    if (aprovar) {
      const projecoes = await Promise.all((aulaSnapshot.data().turmaIds || []).map((turmaId) => {
        const referencia = doc(db, COLECAO_TURMAS, turmaId, COLECAO_AULAS, aulaId)
        return transaction.get(referencia).then((snapshot) => ({ referencia, snapshot }))
      }))
      transaction.update(aulaRef, {
        statusAula: 'cancelada',
        canceladaEm: serverTimestamp(),
        canceladaPor: adminUid,
        motivoCancelamento: pedido.observacao,
      })
      projecoes.filter(({ snapshot }) => snapshot.exists()).forEach(({ referencia }) => {
        transaction.update(referencia, {
          statusAula: 'cancelada',
          canceladaEm: serverTimestamp(),
        })
      })
    }

    transaction.update(pedidoRef, {
      status: aprovar ? 'aprovado' : 'recusado',
      administradorUid: adminUid,
      respostaAdmin: respostaAdmin.trim(),
      updatedAt: serverTimestamp(),
    })
  })
}

export function observarAulasExtrasDoAluno({ uid, turmaId, aoAtualizar, aoErro }) {
  if (!uid || !turmaId) {
    aoAtualizar([])
    return () => {}
  }

  const referencia = collection(db, COLECAO_TURMAS, turmaId, COLECAO_AULAS)
  return onSnapshot(referencia, async (snapshot) => {
    try {
      const aulas = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
      aoAtualizar(await enriquecerAulasDoAluno({ aulas, uid }))
    } catch (error) {
      aoErro?.(error)
    }
  }, aoErro)
}

export async function marcarAulaExtraComoLida({ uid, aulaId }) {
  if (!uid || !aulaId) return
  await setDoc(doc(db, COLECAO_USUARIOS, uid, 'aulasExtrasLidas', aulaId), {
    aulaId,
    lidaEm: serverTimestamp(),
  })
}

export function observarAprovacoesAulaExtraProfessor({ professorUid, aoAtualizar, aoErro }) {
  if (!professorUid) return () => {}
  const consulta = query(
    collection(db, COLECAO_SOLICITACOES),
    where('professorUid', '==', professorUid),
  )
  return onSnapshot(consulta, async (snapshot) => {
    try {
      const aprovadas = snapshot.docs
        .map((documento) => ({ id: documento.id, ...documento.data() }))
        .filter((solicitacao) => solicitacao.status === STATUS_AULA_EXTRA.APROVADA)
      const lidasSnapshot = await getDocs(collection(db, COLECAO_USUARIOS, professorUid, 'aulasExtrasAprovacoesLidas'))
      const idsLidos = new Set(lidasSnapshot.docs.map((documento) => documento.id))
      aoAtualizar(aprovadas.map((solicitacao) => ({ ...solicitacao, aprovacaoLida: idsLidos.has(solicitacao.id) })))
    } catch (error) {
      aoErro?.(error)
    }
  }, aoErro)
}

export async function marcarAprovacaoAulaExtraComoLida({ professorUid, solicitacaoId }) {
  if (!professorUid || !solicitacaoId) return
  await setDoc(doc(db, COLECAO_USUARIOS, professorUid, 'aulasExtrasAprovacoesLidas', solicitacaoId), {
    solicitacaoId,
    lidaEm: serverTimestamp(),
  })
}

export async function criarSolicitacaoAulaExtra({
  uid,
  titulo,
  descricao,
  materia,
  data,
  horario,
  localId,
  turmaIds,
}) {
  const campos = { titulo, descricao, materia, data, localId }
  if (Object.values(campos).some((valor) => !String(valor || '').trim())) {
    throw new Error('Preencha todos os campos obrigatórios.')
  }
  if (!Array.isArray(turmaIds) || turmaIds.length === 0) {
    throw new Error('Selecione pelo menos uma turma.')
  }
  if (new Set(turmaIds).size > 7) {
    throw new Error('Cada solicitação pode incluir até 7 turmas.')
  }
  if (Number.isNaN(Date.parse(`${data}T${horario || '00:00'}`))) {
    throw new Error('Informe uma data válida.')
  }

  const idsUnicos = [...new Set(turmaIds)]
  const perfilRef = doc(db, COLECAO_USUARIOS, uid)
  const localRef = doc(db, COLECAO_LOCAIS, localId)
  const solicitacaoRef = doc(collection(db, COLECAO_SOLICITACOES))
  await runTransaction(db, async (transaction) => {
    const [perfilSnapshot, localSnapshot, ...turmaSnapshots] = await Promise.all([
      transaction.get(perfilRef),
      transaction.get(localRef),
      ...idsUnicos.map((turmaId) => transaction.get(doc(db, COLECAO_TURMAS, turmaId))),
    ])
    const perfil = perfilSnapshot.data()
    if (!perfilSnapshot.exists() || !['professor', 'admin'].includes(perfil?.role)) {
      throw new Error('Somente professores e administradores podem solicitar aulas extras.')
    }
    if (turmaSnapshots.some((snapshot) => !snapshot.exists())) {
      throw new Error('Uma das turmas selecionadas não existe mais.')
    }
    if (!localSnapshot.exists() || localSnapshot.data().status !== 'Disponível') {
      throw new Error('O local selecionado não está mais disponível.')
    }

    const turmas = turmaSnapshots.map((snapshot) => ({
      id: snapshot.id,
      nome: snapshot.data().nome || snapshot.data().turma || snapshot.id,
    }))
    transaction.set(solicitacaoRef, {
      professorUid: perfil.role === 'professor' ? uid : '',
      professorNome: perfil.role === 'professor' ? perfil.name || 'Professor' : '',
      solicitanteUid: uid,
      solicitanteNome: perfil.name || (perfil.role === 'admin' ? 'Administrador' : 'Professor'),
      solicitanteRole: perfil.role,
      localId: localSnapshot.id,
      localNome: localSnapshot.data().name,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      materia: materia.trim(),
      data,
      horario: String(horario || '').trim(),
      turmaIds: turmas.map((turma) => turma.id),
      turmas,
      status: STATUS_AULA_EXTRA.PENDENTE,
      justificativaRecusa: '',
      administradorUid: '',
      administradorNome: '',
      aulaId: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return solicitacaoRef.id
}

export async function processarSolicitacaoAulaExtra({
  solicitacaoId,
  adminUid,
  aprovar,
  justificativa = '',
}) {
  if (!aprovar && !justificativa.trim()) {
    throw new Error('Informe a justificativa da recusa.')
  }

  const solicitacaoRef = doc(db, COLECAO_SOLICITACOES, solicitacaoId)
  const aulaRef = doc(db, COLECAO_AULAS, solicitacaoId)
  const adminRef = doc(db, COLECAO_USUARIOS, adminUid)

  await runTransaction(db, async (transaction) => {
    const [solicitacaoSnapshot, adminSnapshot, aulaSnapshot] = await Promise.all([
      transaction.get(solicitacaoRef),
      transaction.get(adminRef),
      transaction.get(aulaRef),
    ])
    if (!adminSnapshot.exists() || adminSnapshot.data().role !== 'admin') {
      throw new Error('Apenas administradores podem processar solicitações.')
    }
    if (!solicitacaoSnapshot.exists()) throw new Error('Solicitação não encontrada.')
    if (solicitacaoSnapshot.data().status !== STATUS_AULA_EXTRA.PENDENTE) {
      throw new Error('Esta solicitação já foi processada.')
    }
    if (aprovar && aulaSnapshot.exists()) {
      throw new Error('Esta solicitação já possui uma aula publicada.')
    }

    const solicitacao = solicitacaoSnapshot.data()
    if (aprovar) {
      if (!Array.isArray(solicitacao.turmaIds) || solicitacao.turmaIds.length < 1 || solicitacao.turmaIds.length > 8) {
        throw new Error('A lista de turmas da solicitação é inválida.')
      }
      const [localSnapshot, ...turmaSnapshots] = await Promise.all([
        transaction.get(doc(db, COLECAO_LOCAIS, solicitacao.localId)),
        ...solicitacao.turmaIds.map((turmaId) => transaction.get(doc(db, COLECAO_TURMAS, turmaId))),
      ])
      if (!localSnapshot.exists() || localSnapshot.data().status !== 'Disponível') {
        throw new Error('O local vinculado à solicitação não está mais disponível.')
      }
      if (turmaSnapshots.some((snapshot) => !snapshot.exists())) {
        throw new Error('Uma das turmas da solicitação não existe mais.')
      }
      const turmas = turmaSnapshots.map((snapshot) => ({
        id: snapshot.id,
        nome: snapshot.data().nome || snapshot.data().turma || snapshot.id,
      }))
      transaction.set(aulaRef, {
        solicitacaoId,
        statusAula: 'agendada',
        professorUid: solicitacao.professorUid,
        professorNome: solicitacao.professorNome,
        titulo: solicitacao.titulo,
        descricao: solicitacao.descricao,
        materia: solicitacao.materia,
        data: solicitacao.data,
        horario: solicitacao.horario,
        localId: solicitacao.localId,
        localNome: solicitacao.localNome,
        turmaIds: solicitacao.turmaIds,
        turmas,
        createdAt: solicitacao.createdAt,
        publishedAt: serverTimestamp(),
      })
      turmaSnapshots.forEach((snapshot) => {
        transaction.set(doc(db, COLECAO_TURMAS, snapshot.id, COLECAO_AULAS, solicitacaoId), {
          solicitacaoId,
          statusAula: 'agendada',
          turmaId: snapshot.id,
          professorUid: solicitacao.professorUid,
          professorNome: solicitacao.professorNome,
          titulo: solicitacao.titulo,
          descricao: solicitacao.descricao,
          materia: solicitacao.materia,
          data: solicitacao.data,
          horario: solicitacao.horario,
          localId: solicitacao.localId,
          localNome: solicitacao.localNome,
          turmaIds: solicitacao.turmaIds,
          turmas,
          createdAt: solicitacao.createdAt,
          publishedAt: serverTimestamp(),
        })
      })
    }

    transaction.update(solicitacaoRef, {
      status: aprovar ? STATUS_AULA_EXTRA.APROVADA : STATUS_AULA_EXTRA.RECUSADA,
      administradorUid: adminUid,
      administradorNome: adminSnapshot.data().name || 'Administrador',
      justificativaRecusa: aprovar ? '' : justificativa.trim(),
      aulaId: aprovar ? solicitacaoId : '',
      updatedAt: serverTimestamp(),
    })
  })
}