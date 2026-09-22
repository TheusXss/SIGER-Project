import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const COLECAO_USERS = 'users'

export async function criarDocumentoUsuario(uid, { name, email, role = 'aluno' }) {
  const refUsuario = doc(db, COLECAO_USERS, uid)

  await setDoc(refUsuario, {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function buscarDocumentoUsuario(uid) {
  const refUsuario = doc(db, COLECAO_USERS, uid)
  const snapshot = await getDoc(refUsuario)

  return snapshot.exists() ? snapshot.data() : null
}
