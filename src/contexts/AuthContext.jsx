import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { buscarDocumentoUsuario } from '../services/userService'

const AuthContext = createContext(null)

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
      setPerfilUsuario(perfil)
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      setPerfilUsuario(null)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioAtual(user)

      if (user) {
        void carregarPerfilUsuario(user.uid)
      } else {
        setPerfilUsuario(null)
      }

      setCarregando(false)
    })

    return unsubscribe
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

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }

  return context
}
