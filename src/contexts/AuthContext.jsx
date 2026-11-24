<<<<<<< HEAD
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { buscarDocumentoUsuario } from '../services/userService'

const AuthContext = createContext(null)
=======
import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { buscarDocumentoUsuario } from '../services/userService'
import { finalizarCadastroVerificado } from '../services/verifiedAccountService'
import { AuthContext } from './authContextValue'
>>>>>>> 4fcfbac (atualização geral)

export function AuthProvider({ children }) {
  const [usuarioAtual, setUsuarioAtual] = useState(null)
  const [perfilUsuario, setPerfilUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const carregarPerfilUsuario = useCallback(async (uid) => {
    if (!uid) {
      setPerfilUsuario(null)
      return
    }

    try {
      const perfil = await buscarDocumentoUsuario(uid)
<<<<<<< HEAD
=======

      if (perfil?.verifiedAccountId) {
        try {
          await finalizarCadastroVerificado({
            verifiedAccountId: perfil.verifiedAccountId,
            authUid: uid,
          })
        } catch (error) {
          console.error('Erro ao sincronizar status da conta verificada:', error)
        }
      }

>>>>>>> 4fcfbac (atualização geral)
      setPerfilUsuario(perfil)
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      setPerfilUsuario(null)
    }
  }, [])

  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioAtual(user)

      if (user) {
        void carregarPerfilUsuario(user.uid)
=======
    let geracaoPerfil = 0
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const geracaoAtual = ++geracaoPerfil
      setUsuarioAtual(user)
      setCarregando(true)

      if (user) {
        await carregarPerfilUsuario(user.uid)
>>>>>>> 4fcfbac (atualização geral)
      } else {
        setPerfilUsuario(null)
      }

<<<<<<< HEAD
      setCarregando(false)
    })

    return unsubscribe
=======
      if (geracaoAtual === geracaoPerfil) {
        setCarregando(false)
      }
    })

    return () => {
      geracaoPerfil += 1
      unsubscribe()
    }
>>>>>>> 4fcfbac (atualização geral)
  }, [carregarPerfilUsuario])

  const value = {
    usuarioAtual,
    perfilUsuario,
    carregando,
    autenticado: !!usuarioAtual,
    refreshPerfilUsuario: carregarPerfilUsuario,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

<<<<<<< HEAD
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }

  return context
}
=======
>>>>>>> 4fcfbac (atualização geral)
