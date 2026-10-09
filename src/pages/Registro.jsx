import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { PantallaAuth } from '@/pages/Login'

const VACIO = { name: '', email: '', password: '', password_confirmation: '' }

const CAMPOS = [
  { nombre: 'name', etiqueta: 'Nombre', tipo: 'text', autoComplete: 'name' },
  { nombre: 'email', etiqueta: 'Correo', tipo: 'email', autoComplete: 'email' },
  { nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', autoComplete: 'new-password' },
  { nombre: 'password_confirmation', etiqueta: 'Confirmar contraseña', tipo: 'password', autoComplete: 'new-password' },
]

/**
 * Registro de cuenta.
 *
 * No se repiten aqui las reglas de validacion (longitud minima, formato de
 * correo, correo unico): las aplica RegisterRequest en el backend y sus
 * mensajes se muestran debajo de cada campo.
 */
export function Registro() {
  const { registrar } = useAuth()
  const navegar = useNavigate()

  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo, valor) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    // Al corregir un campo su error deja de ser cierto; se quita.
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')

    try {
      await registrar(valores)
      navegar('/', { replace: true })
    } catch (error) {
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
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>Empieza a registrar tus ingresos y egresos.</CardDescription>
        </CardHeader>

        <form onSubmit={enviar} noValidate>
          <CardContent className="grid gap-4">
            {mensaje && <p className="text-sm text-destructive" role="alert">{mensaje}</p>}

            {CAMPOS.map(({ nombre, etiqueta, tipo, autoComplete }) => (
              <Campo key={nombre} id={nombre} etiqueta={etiqueta} error={errores[nombre]}>
                <Input
                  id={nombre}
                  type={tipo}
                  autoComplete={autoComplete}
                  value={valores[nombre]}
                  onChange={(e) => cambiar(nombre, e.target.value)}
                  {...propsDeError(nombre, errores[nombre])}
                />
              </Campo>
            ))}
          </CardContent>

          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Inicia sesion
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </PantallaAuth>
  )
}
