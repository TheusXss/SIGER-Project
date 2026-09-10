import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_SOLICITACOES = 'solicitacoes'

export const STATUS_SOLICITACAO = {
  PENDENTE: 'pendente',
  EM_PROCESSO: 'em_processo',
  APROVADA: 'aprovada',
  REJEITADA: 'rejeitada',
  ARQUIVADA: 'arquivada',
  CANCELADA: 'cancelada',
}

export const STATUS_SOLICITACAO_LABELS = {
  pendente: 'Pendente',
  em_processo: 'Em processo',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  arquivada: 'Arquivada',
  cancelada: 'Cancelada',
}

export const STATUS_SOLICITACAO_CORES = {
  pendente: 'bg-warning text-dark',
  em_processo: 'bg-info text-dark',
  aprovada: 'bg-success',
  rejeitada: 'bg-danger',
  arquivada: 'bg-secondary',
  cancelada: 'bg-dark',
}

export async function criarSolicitacao({
  localId,
  localNome,
  dataReserva,
  horarioInicio,
  horarioFim,
  proposito,
  usuarioId,
  usuarioNome,
  usuarioEmail,
  usuarioTipo,
}) {
  const refColecao = collection(db, COLECAO_SOLICITACOES)

  const docCriado = await addDoc(refColecao, {
    localId,
    localNome,
    dataReserva,
    horarioInicio,
    horarioFim,
    proposito: proposito.trim(),
    usuarioId,
    usuarioNome,
    usuarioEmail,
    usuarioTipo,
    status: STATUS_SOLICITACAO.PENDENTE,
    observacaoAdmin: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docCriado.id
}

export async function listarSolicitacoes(statusFiltro = '') {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  let consulta

  if (statusFiltro) {
    consulta = query(refColecao, where('status', '==', statusFiltro))
  } else {
    consulta = query(refColecao)
  }

  const snapshot = await getDocs(consulta)
  const dados = snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((solicitacao) =>
      statusFiltro ? true : solicitacao.status !== STATUS_SOLICITACAO.ARQUIVADA
    )
  dados.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return dados
}

export async function listarSolicitacoesPorUsuario(usuarioId) {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  const consulta = query(refColecao, where('usuarioId', '==', usuarioId))

  const snapshot = await getDocs(consulta)
  const dados = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  dados.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return dados
}

export async function contarSolicitacoesPendentes() {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  const consulta = query(
    refColecao,
    where('status', '==', STATUS_SOLICITACAO.PENDENTE)
  )

  const snapshot = await getDocs(consulta)
  return snapshot.size
}

export async function contarSolicitacoesArquivadas() {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  const consulta = query(
    refColecao,
    where('status', '==', STATUS_SOLICITACAO.ARQUIVADA)
  )

  const snapshot = await getDocs(consulta)
  return snapshot.size
}

export async function atualizarStatusSolicitacao(id, { status, observacaoAdmin = '', statusAnterior = null }) {
  const refSolicitacao = doc(db, COLECAO_SOLICITACOES, id)

  const dadosAtualizacao = {
    status,
    observacaoAdmin: observacaoAdmin.trim(),
    updatedAt: serverTimestamp(),
  }

  if (statusAnterior !== null) {
    dadosAtualizacao.statusAnterior = statusAnterior
  }

  await updateDoc(refSolicitacao, dadosAtualizacao)
}

export async function contarSolicitacoesPorLocal(localId) {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  const consulta = query(refColecao, where('localId', '==', localId))
  const snapshot = await getDocs(consulta)
  return snapshot.size
}

export async function reativarSolicitacao(id) {
  const refSolicitacao = doc(db, COLECAO_SOLICITACOES, id)
  const dadosAtualizacao = {
    status: STATUS_SOLICITACAO.PENDENTE,
    observacaoAdmin: '',
    updatedAt: serverTimestamp(),
  }
  await updateDoc(refSolicitacao, dadosAtualizacao)
}

export async function excluirSolicitacao(id) {
  const refSolicitacao = doc(db, COLECAO_SOLICITACOES, id)
  await deleteDoc(refSolicitacao)
}

export async function verificarConflitoHorario({
  localId,
  dataReserva,
  horarioInicio,
  horarioFim,
  excluirId = null,
}) {
  const refColecao = collection(db, COLECAO_SOLICITACOES)
  const consulta = query(
    refColecao,
    where('localId', '==', localId),
    where('dataReserva', '==', dataReserva),
  )
  const snapshot = await getDocs(consulta)

  const statusesValidos = [
    STATUS_SOLICITACAO.PENDENTE,
    STATUS_SOLICITACAO.APROVADA,
  ]

  const conflitos = snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter(
      (s) =>
        s.id !== excluirId &&
        statusesValidos.includes(s.status) &&
        s.horarioInicio < horarioFim &&
        s.horarioFim > horarioInicio,
    )

  return { temConflito: conflitos.length > 0, conflitos }
}
