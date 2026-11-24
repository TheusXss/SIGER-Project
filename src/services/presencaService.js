import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_QR = 'qrCodes'

export async function ativarJanelasReservasLegadas() {
  const snapshot = await getDocs(query(collection(db, 'solicitacoes'), where('status', '==', 'aprovada')))
  let atualizadas = 0
  let ignoradas = 0
  for (const reservaDoc of snapshot.docs) {
    const reserva = reservaDoc.data()
    if (reserva.checkinInicio && reserva.checkinFim) continue
    const inicio = new Date(`${reserva.dataReserva}T${reserva.horarioInicio}:00`)
    const fim = new Date(`${reserva.dataReserva}T${reserva.horarioFim}:00`)
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio >= fim) {
      ignoradas += 1
      continue
    }
    await updateDoc(reservaDoc.ref, {
      checkinInicio: Timestamp.fromDate(inicio),
      checkinFim: Timestamp.fromDate(fim),
      updatedAt: serverTimestamp(),
    })
    atualizadas += 1
  }
  return { atualizadas, ignoradas }
}

function inicioEmMilissegundos(valor) {
  return valor?.toMillis?.() ?? 0
}

function dentroDaJanela(inicio, fim, agora = Date.now()) {
  return inicioEmMilissegundos(inicio) <= agora && inicioEmMilissegundos(fim) >= agora
}

export async function listarQrCodes() {
  const snapshot = await getDocs(collection(db, COLECAO_QR))
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => inicioEmMilissegundos(b.criadoEm) - inicioEmMilissegundos(a.criadoEm))
}

export async function gerarQrCode({ tipo, alvoId, nome, localId, localNome, inicio, fim, adminUid }) {
  const id = crypto.randomUUID()
  const codigosAtivos = await getDocs(query(
    collection(db, COLECAO_QR),
    where('tipo', '==', tipo),
    where('alvoId', '==', alvoId),
    where('ativo', '==', true),
  ))
  const lote = writeBatch(db)
  codigosAtivos.docs.forEach((item) => lote.update(item.ref, {
    ativo: false,
    invalidadoEm: serverTimestamp(),
    invalidadoPor: adminUid,
  }))
  lote.set(doc(db, COLECAO_QR, id), {
    tipo,
    alvoId,
    nome,
    localId,
    localNome,
    ativo: true,
    inicio: inicio ? Timestamp.fromDate(new Date(inicio)) : null,
    fim: fim ? Timestamp.fromDate(new Date(fim)) : null,
    criadoPor: adminUid,
    criadoEm: serverTimestamp(),
  })
  await lote.commit()
  return id
}

export async function invalidarQrCode(id, adminUid) {
  await updateDoc(doc(db, COLECAO_QR, id), {
    ativo: false,
    invalidadoEm: serverTimestamp(),
    invalidadoPor: adminUid,
  })
}

export async function listarPresencasAluno(uid) {
  const snapshot = await getDocs(query(collectionGroup(db, 'presencas'), where('uid', '==', uid)))
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => inicioEmMilissegundos(b.registradaEm) - inicioEmMilissegundos(a.registradaEm))
}

export async function listarDadosPresencaAdmin() {
  const [presencasSnapshot, aulasSnapshot, reservasSnapshot] = await Promise.all([
    getDocs(collectionGroup(db, 'presencas')),
    getDocs(collection(db, 'aulasExtras')),
    getDocs(query(collection(db, 'solicitacoes'), where('status', '==', 'aprovada'))),
  ])
  const aulas = aulasSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  const inscricoesPorAula = await Promise.all(aulas.map(async (aula) => {
    const snapshot = await getDocs(collection(db, 'aulasExtras', aula.id, 'inscritos'))
    return snapshot.docs.map((item) => ({
      uid: item.id,
      alunoNome: item.data().alunoNome || 'Aluno',
      tipo: 'aulaExtra',
      alvoId: aula.id,
      alvoNome: aula.titulo,
      localNome: aula.localNome || '',
      data: aula.data || '',
    }))
  }))
  const reservas = reservasSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  return {
    presencas: presencasSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    esperados: [
      ...inscricoesPorAula.flat(),
      ...reservas.map((reserva) => ({
        uid: reserva.usuarioId,
        alunoNome: reserva.usuarioNome || 'Aluno',
        tipo: 'local',
        alvoId: reserva.localId,
        reservaId: reserva.id,
        alvoNome: reserva.localNome || 'Local',
        localNome: reserva.localNome || '',
        data: reserva.dataReserva || '',
      })),
    ],
  }
}

export async function registrarPresenca({ qrId, uid }) {
  const qrRef = doc(db, COLECAO_QR, qrId)
  const perfilRef = doc(db, 'users', uid)
  const qrSnapshot = await getDoc(qrRef)
  if (!qrSnapshot.exists() || !qrSnapshot.data().ativo) throw new Error('Este QR Code está inválido ou foi desativado.')
  const qr = qrSnapshot.data()

  if (qr.tipo === 'aulaExtra') {
    const aulaRef = doc(db, 'aulasExtras', qr.alvoId)
    const inscricaoRef = doc(db, 'aulasExtras', qr.alvoId, 'inscritos', uid)
    const presencaRef = doc(db, 'aulasExtras', qr.alvoId, 'presencas', uid)
    await runTransaction(db, async (transaction) => {
      const [perfil, aula, inscricao, existente, codigo] = await Promise.all([
        transaction.get(perfilRef), transaction.get(aulaRef), transaction.get(inscricaoRef),
        transaction.get(presencaRef), transaction.get(qrRef),
      ])
      if (!perfil.exists() || perfil.data().role !== 'aluno') throw new Error('Somente alunos autenticados podem registrar presença.')
      if (!aula.exists() || !['agendada', null].includes(aula.data().statusAula ?? null)) {
        throw new Error('Esta atividade foi cancelada, finalizada ou não está disponível.')
      }
      if (!inscricao.exists()) throw new Error('Você não possui uma reserva ou inscrição válida para este local ou atividade.')
      if (existente.exists()) throw new Error('Sua presença nesta atividade já foi registrada.')
      if (!codigo.data().ativo || !dentroDaJanela(codigo.data().inicio, codigo.data().fim)) {
        throw new Error('O período para registrar presença nesta atividade não está aberto.')
      }
      transaction.set(presencaRef, {
        uid,
        alunoNome: perfil.data().name || 'Aluno',
        tipo: 'aulaExtra',
        alvoId: qr.alvoId,
        alvoNome: aula.data().titulo || qr.nome,
        data: aula.data().data || '',
        localId: aula.data().localId || '',
        localNome: aula.data().localNome || qr.localNome || '',
        qrId,
        status: 'presente',
        registradaEm: serverTimestamp(),
      })
    })
    return { nome: qr.nome }
  }

  if (qr.tipo !== 'local') throw new Error('Tipo de QR Code desconhecido.')
  const reservas = await getDocs(query(
    collection(db, 'solicitacoes'),
    where('usuarioId', '==', uid),
    where('localId', '==', qr.alvoId),
    where('status', '==', 'aprovada'),
  ))
  const reservaElegivel = reservas.docs.find((item) =>
    dentroDaJanela(item.data().checkinInicio, item.data().checkinFim),
  )
  if (!reservaElegivel) throw new Error('Você não possui uma reserva ou inscrição válida para este local ou atividade.')

  const reservaRef = reservaElegivel.ref
  const presencaRef = doc(db, 'solicitacoes', reservaRef.id, 'presencas', uid)
  await runTransaction(db, async (transaction) => {
    const [perfil, reserva, existente, codigo] = await Promise.all([
      transaction.get(perfilRef), transaction.get(reservaRef), transaction.get(presencaRef),
      transaction.get(qrRef),
    ])
    if (!perfil.exists() || perfil.data().role !== 'aluno') throw new Error('Somente alunos autenticados podem registrar presença.')
    if (!reserva.exists() || reserva.data().status !== 'aprovada' || reserva.data().usuarioId !== uid) {
      throw new Error('Você não possui uma reserva ou inscrição válida para este local ou atividade.')
    }
    if (existente.exists()) throw new Error('Sua presença nesta reserva já foi registrada.')
    if (!codigo.data().ativo || codigo.data().tipo !== 'local' || codigo.data().alvoId !== reserva.data().localId) {
      throw new Error('Este QR Code está inválido ou foi desativado.')
    }
    transaction.set(presencaRef, {
      uid,
      alunoNome: perfil.data().name || 'Aluno',
      tipo: 'local',
      alvoId: reserva.data().localId,
      alvoNome: reserva.data().localNome || qr.nome,
      data: reserva.data().dataReserva || '',
      localId: reserva.data().localId,
      localNome: reserva.data().localNome || qr.localNome || '',
      reservaId: reservaRef.id,
      qrId,
      status: 'presente',
      registradaEm: serverTimestamp(),
    })
  })
  return { nome: qr.nome }
}