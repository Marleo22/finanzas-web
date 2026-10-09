import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  borrarToken,
  guardarToken,
  obtenerToken,
  EVENTO_SESION_EXPIRADA,
} from '@/lib/api'
import { AuthContext } from '@/context/auth'

/**
 * Manejo de la sesion.
 *
 * Donde se guarda el token: en localStorage.
 *  - Ventaja: sobrevive a recargas y es simple con tokens Bearer.
 *  - Riesgo: cualquier JavaScript de la pagina puede leerlo, asi que un ataque
 *    XSS podria robarlo. React escapa el texto por defecto y no usamos
 *    dangerouslySetInnerHTML, lo que reduce ese riesgo.
 *  - Alternativas: sessionStorage (mismo riesgo, se pierde al cerrar la
 *    pestaña), memoria (se pierde al recargar) o cookie HttpOnly con Sanctum
 *    en modo SPA (la mas segura, pero exige mismo dominio y CSRF).
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  // Si hay un token guardado arrancamos en "verificando": todavia no sabemos
  // si es valido. Mientras sea true, RutaProtegida muestra un cargador en
  // lugar de redirigir al login. Eso evita el parpadeo de la pantalla de login
  // al recargar la pagina.
  const [verificando, setVerificando] = useState(() => obtenerToken() !== null)

  // Al montar: si habia token, se valida contra /me una sola vez.
  useEffect(() => {
    if (!obtenerToken()) return

    let cancelado = false

    api
      .get('/me')
      .then((datos) => {
        if (!cancelado) setUsuario(datos)
      })
      .catch(() => {
        // 401: api.js ya borro el token. Cualquier otro error (API apagada)
        // tambien deja al usuario fuera, pero el token se conserva para el
        // siguiente intento.
        if (!cancelado) setUsuario(null)
      })
      .finally(() => {
        if (!cancelado) setVerificando(false)
      })

    // En desarrollo, StrictMode monta dos veces; esto evita actualizar el
    // estado de un efecto que ya se descarto.
    return () => {
      cancelado = true
    }
  }, [])

  // Si cualquier peticion recibe 401, api.js dispara este evento.
  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  const login = useCallback(async (email, password) => {
    const datos = await api.post('/login', { email, password, device_name: 'web' })
    guardarToken(datos.token)
    setUsuario(datos.user)
  }, [])

  const registrar = useCallback(async (campos) => {
    const datos = await api.post('/register', { ...campos, device_name: 'web' })
    guardarToken(datos.token)
    setUsuario(datos.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Revoca el token en el servidor, no solo en el navegador.
      await api.post('/logout')
    } catch {
      // Aunque falle (API apagada), la sesion local se cierra igual.
    } finally {
      borrarToken()
      setUsuario(null)
    }
  }, [])

  // useMemo evita que todos los consumidores se re-rendericen cuando el
  // proveedor se renderiza sin que nada haya cambiado.
  const valor = useMemo(
    () => ({ usuario, verificando, login, registrar, logout }),
    [usuario, verificando, login, registrar, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
