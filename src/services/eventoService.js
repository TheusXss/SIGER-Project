import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_EVENTOS = 'calendarEvents'

export async function listarEventosCalendario() {
  const consulta = query(collection(db, COLECAO_EVENTOS), orderBy('data'))
  const snapshot = await getDocs(consulta)
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export async function criarEventoCalendario({ titulo, tipo, descricao, data, criadoPor }) {
  const evento = {
    titulo: titulo.trim(),
    tipo,
    descricao: descricao.trim(),
    data,
    criadoPor,
    createdAt: serverTimestamp(),
  }
  const documento = await addDoc(collection(db, COLECAO_EVENTOS), evento)
  return { id: documento.id, ...evento }
}

export async function excluirEventoCalendario(id) {
  await deleteDoc(doc(db, COLECAO_EVENTOS, id))
}