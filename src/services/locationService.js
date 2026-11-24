import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_LOCAIS = 'locations'

export const TIPOS_LOCAL = ['Laboratório', 'Sala de Aula', 'Sala Administrativa', 'Auditório', 'Outro']

export const STATUS_LOCAL = ['Disponível', 'Indisponível', 'Em manutenção']

<<<<<<< HEAD
export async function criarLocal({ name, type, building, floor, capacity, description, status }) {
  const refColecao = collection(db, COLECAO_LOCAIS)
=======
export const ACESSIBILIDADES_LOCAL = [
  'Acesso sem degraus / rampa',
  'Elevador',
  'Banheiro acessível',
  'Espaço para cadeira de rodas',
  'Sinalização tátil',
  'Sinalização visual de orientação',
]

export const RECURSOS_LOCAL = [
  'Projetor',
  'Tela de projeção',
  'Computador',
  'Quadro branco',
  'Sistema de som',
  'Microfone',
  'Ar-condicionado',
  'Wi-Fi',
  'Tomadas disponíveis',
]

export function obterImagensLocal(local) {
  if (Array.isArray(local?.images)) {
    return local.images
      .map((imagem) => typeof imagem === 'string' ? { url: imagem, publicId: '' } : imagem)
      .filter((imagem) => typeof imagem?.url === 'string' && imagem.url.trim())
  }
  return local?.imageUrl ? [{ url: local.imageUrl, publicId: local.imagePublicId || '' }] : []
}

function normalizarImagens(images, imageUrl, imagePublicId) {
  const lista = Array.isArray(images)
    ? images.filter((imagem) => typeof imagem?.url === 'string' && imagem.url.trim())
    : []
  if (lista.length > 0) return lista
  if (imageUrl) return [{ url: imageUrl, publicId: imagePublicId || '' }]
  return []
}

export async function criarLocal({ name, type, building, floor, capacity, description, status, accessibility, resources, images, imageUrl, imagePublicId }) {
  const refColecao = collection(db, COLECAO_LOCAIS)
  const imagens = normalizarImagens(images, imageUrl, imagePublicId)
  const imagemPrincipal = imagens[0]
>>>>>>> 4fcfbac (atualização geral)

  const docCriado = await addDoc(refColecao, {
    name: name.trim(),
    type,
    building: building?.trim() || '',
    floor: floor === '' || floor === null || floor === undefined ? null : Number(floor),
    capacity: Number(capacity),
    description: description?.trim() || '',
    status,
<<<<<<< HEAD
=======
    accessibility: Array.isArray(accessibility) ? accessibility : [],
    resources: Array.isArray(resources) ? resources : [],
    images: imagens,
    imageUrl: imagemPrincipal?.url || '',
    imagePublicId: imagemPrincipal?.publicId || '',
>>>>>>> 4fcfbac (atualização geral)
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

<<<<<<< HEAD
export async function atualizarLocal(id, { name, type, building, floor, capacity, description, status }) {
  const refLocal = doc(db, COLECAO_LOCAIS, id)
=======
export async function atualizarLocal(id, { name, type, building, floor, capacity, description, status, accessibility, resources, images, imageUrl, imagePublicId }) {
  const refLocal = doc(db, COLECAO_LOCAIS, id)
  const imagens = normalizarImagens(images, imageUrl, imagePublicId)
  const imagemPrincipal = imagens[0]
>>>>>>> 4fcfbac (atualização geral)

  await updateDoc(refLocal, {
    name: name.trim(),
    type,
    building: building?.trim() || '',
    floor: floor === '' || floor === null || floor === undefined ? null : Number(floor),
    capacity: Number(capacity),
    description: description?.trim() || '',
    status,
<<<<<<< HEAD
=======
    accessibility: Array.isArray(accessibility) ? accessibility : [],
    resources: Array.isArray(resources) ? resources : [],
    images: imagens,
    imageUrl: imagemPrincipal?.url || '',
    imagePublicId: imagemPrincipal?.publicId || '',
>>>>>>> 4fcfbac (atualização geral)
    updatedAt: serverTimestamp(),
  })
}

export async function excluirLocal(id) {
  const batch = writeBatch(db)

  const refSolicitacoes = collection(db, 'solicitacoes')
  const consulta = query(refSolicitacoes, where('localId', '==', id))
  const snapshot = await getDocs(consulta)

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  const refLocal = doc(db, COLECAO_LOCAIS, id)
  batch.delete(refLocal)

  await batch.commit()
}
