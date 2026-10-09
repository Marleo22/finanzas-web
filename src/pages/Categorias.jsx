import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmarEliminar } from '@/components/ConfirmarEliminar'
import { EstadoCargando, EstadoError } from '@/components/Estados'
import { EncabezadoPagina } from '@/components/Layout'
import { useConsulta } from '@/hooks/useConsulta'
import { api } from '@/lib/api'

/**
 * Catalogo de categorias: las del sistema (compartidas, solo lectura) y las
 * propias del usuario (se pueden crear, renombrar y borrar).
 *
 * El backend responde 409 si se intenta borrar una categoria que tiene
 * movimientos; ese mensaje se muestra tal cual.
 */
export function Categorias() {
  const { datos, error, cargando, recargar } = useConsulta('/categorias')
  const [aEliminar, setAEliminar] = useState(null)

  const categorias = datos?.data ?? []

  async function eliminar() {
    try {
      await api.delete(`/categorias/${aEliminar.id}`)
      toast.success('Categoria eliminada.')
      recargar()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Categorias"
        descripcion="Las del sistema son compartidas; las tuyas solo las ves tu."
      />

      {cargando ? (
        <EstadoCargando />
      ) : error ? (
        <EstadoError error={error} onReintentar={recargar} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {['egreso', 'ingreso'].map((tipo) => (
            <ListaCategorias
              key={tipo}
              tipo={tipo}
              categorias={categorias.filter((c) => c.tipo === tipo)}
              onCambio={recargar}
              onEliminar={setAEliminar}
            />
          ))}
        </div>
      )}

      <ConfirmarEliminar
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={eliminar}
        descripcion={aEliminar && `Se eliminara la categoria "${aEliminar.nombre}".`}
      />
    </>
  )
}

function ListaCategorias({ tipo, categorias, onCambio, onEliminar }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function crear(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await api.post('/categorias', { nombre, tipo })
      setNombre('')
      toast.success('Categoria creada.')
      onCambio()
    } catch (err) {
      setError(err.errors?.nombre?.[0] ?? err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tipo === 'egreso' ? 'Egresos' : 'Ingresos'}</CardTitle>
        <CardDescription>{categorias.length} categorias</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={crear} className="grid gap-1.5" noValidate>
          <div className="flex gap-2">
            <Input
              aria-label={`Nueva categoria de ${tipo}`}
              placeholder="Nueva categoria"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setError(null)
              }}
              aria-invalid={error ? true : undefined}
            />
            <Button type="submit" disabled={enviando}>
              <PlusIcon /> Agregar
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <ul className="divide-y rounded-md border">
          {categorias.map((categoria) => (
            <FilaCategoria
              key={categoria.id}
              categoria={categoria}
              onCambio={onCambio}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function FilaCategoria({ categoria, onCambio, onEliminar }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(categoria.nombre)
  const [error, setError] = useState(null)

  async function guardar(evento) {
    evento.preventDefault()
    try {
      await api.patch(`/categorias/${categoria.id}`, { nombre })
      setEditando(false)
      toast.success('Categoria renombrada.')
      onCambio()
    } catch (err) {
      setError(err.errors?.nombre?.[0] ?? err.message)
    }
  }

  if (editando) {
    return (
      <li className="px-3 py-2">
        <form onSubmit={guardar} className="flex items-center gap-2">
          <Input
            autoFocus
            aria-label="Nombre de la categoria"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setError(null)
            }}
          />
          <Button type="submit" size="icon-sm" aria-label="Guardar">
            <CheckIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cancelar"
            onClick={() => {
              setEditando(false)
              setNombre(categoria.nombre)
              setError(null)
            }}
          >
            <XIcon />
          </Button>
        </form>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2 text-sm">
      <span className="flex-1">
        {categoria.nombre}
        {categoria.subcategorias?.length > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {categoria.subcategorias.map((s) => s.nombre).join(', ')}
          </span>
        )}
      </span>
      {/* es_del_sistema lo calcula el backend: decide si hay botones. */}
      {categoria.es_del_sistema ? (
        <Badge variant="outline">Sistema</Badge>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Renombrar ${categoria.nombre}`}
            onClick={() => setEditando(true)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Eliminar ${categoria.nombre}`}
            onClick={() => onEliminar(categoria)}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </>
      )}
    </li>
  )
}
