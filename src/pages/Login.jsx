import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Campo } from '@/components/Campo'
import { propsDeError } from '@/lib/formularios'
import { useAuth } from '@/context/auth'

export function Login() {
  const { login } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')

    try {
      await login(email, password)
      // Vuelve a la pagina que pidio antes de que lo mandaran al login.
      navegar(ubicacion.state?.desde?.pathname ?? '/', { replace: true })
    } catch (error) {
      // 422: Laravel devuelve errors.email con "Las credenciales no son
      // correctas." Cualquier otro error (429, sin conexion) va arriba.
      setErrores(error.errors ?? {})
      if (!error.errors || Object.keys(error.errors).length === 0) {
        setMensaje(error.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PantallaAuth>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesion</CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña.</CardDescription>
        </CardHeader>

        <form onSubmit={enviar} noValidate>
          <CardContent className="grid gap-4">
            {mensaje && <p className="text-sm text-destructive" role="alert">{mensaje}</p>}

            <Campo id="email" etiqueta="Correo" error={errores.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                {...propsDeError('email', errores.email)}
              />
            </Campo>

            <Campo id="password" etiqueta="Contraseña" error={errores.password}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...propsDeError('password', errores.password)}
              />
            </Campo>
          </CardContent>

          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-foreground underline underline-offset-4">
                Registrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </PantallaAuth>
  )
}

/** Marco centrado comun a login y registro. */
export function PantallaAuth({ children }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <WalletIcon className="size-6 text-primary" />
          <span className="text-lg font-semibold">Mis Finanzas</span>
        </div>
        {children}
      </div>
    </div>
  )
}
