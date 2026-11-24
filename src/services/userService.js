<<<<<<< HEAD
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
=======
import { collection, doc, getDoc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore'
>>>>>>> 4fcfbac (atualização geral)
import { db } from './firebase'

const COLECAO_USERS = 'users'

<<<<<<< HEAD
export async function criarDocumentoUsuario(uid, { name, email, role = 'aluno' }) {
=======
export async function criarDocumentoUsuario(
  uid,
  {
    name,
    email,
    role = 'aluno',
    verifiedAccountId = null,
    turmaId = null,
    turmaNome = '',
    matricula = '',
    status = 'cadastrada',
  },
) {
>>>>>>> 4fcfbac (atualização geral)
  const refUsuario = doc(db, COLECAO_USERS, uid)

  await setDoc(refUsuario, {
    name,
    email,
    role,
<<<<<<< HEAD
=======
    verifiedAccountId,
    turmaId,
    turmaNome,
    matricula,
    status,
>>>>>>> 4fcfbac (atualização geral)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function buscarDocumentoUsuario(uid) {
  const refUsuario = doc(db, COLECAO_USERS, uid)
  const snapshot = await getDoc(refUsuario)

  return snapshot.exists() ? snapshot.data() : null
}
<<<<<<< HEAD
=======

export async function listarUsuariosPorPerfil(role) {
  const consulta = query(collection(db, COLECAO_USERS), where('role', '==', role))
  const snapshot = await getDocs(consulta)

  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}
>>>>>>> 4fcfbac (atualização geral)
