import { createContext, useContext } from 'react'

/**
 * Contexto de sesion. El proveedor esta en AuthProvider.jsx; este archivo
 * solo crea el contexto y el hook, para que Vite pueda recargar en caliente
 * los componentes sin perder el estado.
 */
export const AuthContext = createContext(null)

/**
 * Devuelve { usuario, verificando, login, registrar, logout }.
 *
 * - usuario:     null si no hay sesion.
 * - verificando: true mientras se valida contra /me un token guardado al
 *                recargar la pagina.
 */
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  }
  return contexto
}
