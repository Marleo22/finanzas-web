import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { useAuth } from '@/context/auth'

/** Pantalla neutra mientras se valida el token. No es el login. */
export function PantallaCarga() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Cargando sesion…</span>
    </div>
  )
}

/**
 * Rutas que exigen sesion.
 *
 * Tres estados, en este orden:
 * 1. verificando -> cargador (aqui se evita el parpadeo del login).
 * 2. sin usuario -> redirige a /login recordando a donde queria ir.
 * 3. con usuario -> muestra la ruta hija.
 */
export function RutaProtegida() {
  const { usuario, verificando } = useAuth()
  const ubicacion = useLocation()

  if (verificando) return <PantallaCarga />

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />
  }

  return <Outlet />
}

/** /login y /registro: si ya hay sesion no tiene sentido mostrarlas. */
export function RutaPublica() {
  const { usuario, verificando } = useAuth()

  if (verificando) return <PantallaCarga />
  if (usuario) return <Navigate to="/" replace />

  return <Outlet />
}
