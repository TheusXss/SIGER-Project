import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_LOCAIS = 'locations'

export const TIPOS_LOCAL = ['Laboratório', 'Sala de Aula', 'Sala Administrativa', 'Auditório', 'Outro']

export const STATUS_LOCAL = ['Disponível', 'Indisponível', 'Em manutenção']

export async function criarLocal({ name, type, building, floor, capacity, description, status }) {
  const refColecao = collection(db, COLECAO_LOCAIS)

  const docCriado = await addDoc(refColecao, {
    name: name.trim(),
    type,
    building: building?.trim() || '',
    floor: floor === '' || floor === null || floor === undefined ? null : Number(floor),
    capacity: Number(capacity),
    description: description?.trim() || '',
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docCriado.id
}

export async function listarLocais() {
  const refColecao = collection(db, COLECAO_LOCAIS)
  const consulta = query(refColecao, orderBy('name'))
  const snapshot = await getDocs(consulta)

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function atualizarLocal(id, { name, type, building, floor, capacity, description, status }) {
  const refLocal = doc(db, COLECAO_LOCAIS, id)

  await updateDoc(refLocal, {
    name: name.trim(),
    type,
    building: building?.trim() || '',
    floor: floor === '' || floor === null || floor === undefined ? null : Number(floor),
    capacity: Number(capacity),
    description: description?.trim() || '',
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function excluirLocal(id) {
  const refLocal = doc(db, COLECAO_LOCAIS, id)
  await deleteDoc(refLocal)
}
