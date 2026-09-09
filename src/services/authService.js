import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

const DOMINIO_PERMITIDO = '@ifsul.edu.br'

export function emailInstitucionalValido(email) {
  return typeof email === 'string' && email.toLowerCase().trim().endsWith(DOMINIO_PERMITIDO)
}

// Traduz os códigos de erro do Firebase em mensagens amigáveis em português
export function traduzirErroFirebase(error) {
  const codigo = error?.code || ''

  const mensagens = {
    'auth/user-not-found': 'Usuário não encontrado. Verifique o e-mail informado.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'O e-mail informado é inválido.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
    'auth/user-disabled': 'Este usuário foi desativado.',
  }

  return mensagens[codigo] || 'Ocorreu um erro inesperado. Tente novamente.'
}

export async function cadastrarUsuario({ nome, email, senha }) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha)

  if (nome) {
    await updateProfile(credencial.user, { displayName: nome })
  }

  return credencial.user
}

export async function autenticarUsuario({ email, senha }) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha)
  return credencial.user
}

export async function encerrarSessao() {
  await signOut(auth)
}
