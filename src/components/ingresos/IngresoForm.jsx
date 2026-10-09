import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Campo } from '@/components/Campo'
import { propsDeError } from '@/lib/formularios'
import { useConsulta } from '@/hooks/useConsulta'
import { api } from '@/lib/api'
import { hoyIso } from '@/lib/formato'

function valoresIniciales(ingreso) {
  return {
    categoria_id: ingreso?.categoria?.id ? String(ingreso.categoria.id) : '',
    fecha: ingreso?.fecha ?? hoyIso(),
    fuente: ingreso?.fuente ?? '',
    monto: ingreso?.monto ?? '',
    notas: ingreso?.notas ?? '',
  }
}

/**
 * Formulario de ingresos. Igual que EgresoForm pero con `fuente` en lugar de
 * `descripcion` y sin subcategoria: son los campos que valida
 * StoreIngresoRequest. Las categorias se piden con tipo=ingreso para que no se
 * pueda registrar un ingreso bajo "Alimentacion".
 */
export function IngresoForm({ ingreso, onGuardado, onCancelar }) {
  const [valores, setValores] = useState(() => valoresIniciales(ingreso))
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { datos: respuestaCategorias, cargando: cargandoCategorias } = useConsulta(
    '/categorias',
    { tipo: 'ingreso' },
  )
  const categorias = respuestaCategorias?.data ?? []

  function cambiar(campo, valor) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')

    const cuerpo = {
      categoria_id: valores.categoria_id ? Number(valores.categoria_id) : null,
      fecha: valores.fecha,
      fuente: valores.fuente,
      monto: valores.monto.trim(),
      notas: valores.notas.trim() || null,
    }

    try {
      const respuesta = ingreso
        ? await api.put(`/ingresos/${ingreso.id}`, cuerpo)
        : await api.post('/ingresos', cuerpo)
      onGuardado(respuesta.data)
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
    <form onSubmit={enviar} noValidate className="grid gap-4">
      {mensaje && <p className="text-sm text-destructive" role="alert">{mensaje}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
          <Input
            id="fecha"
            type="date"
            value={valores.fecha}
            onChange={(e) => cambiar('fecha', e.target.value)}
            {...propsDeError('fecha', errores.fecha)}
          />
        </Campo>

        <Campo id="monto" etiqueta="Monto (Q)" error={errores.monto}>
          <Input
            id="monto"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={valores.monto}
            onChange={(e) => cambiar('monto', e.target.value)}
            {...propsDeError('monto', errores.monto)}
          />
        </Campo>
      </div>

      <Campo id="fuente" etiqueta="Fuente" error={errores.fuente}>
        <Input
          id="fuente"
          placeholder="Ej. Salario de julio"
          value={valores.fuente}
          onChange={(e) => cambiar('fuente', e.target.value)}
          {...propsDeError('fuente', errores.fuente)}
        />
      </Campo>

      <Campo id="categoria_id" etiqueta="Categoria" error={errores.categoria_id}>
        <Select
          value={valores.categoria_id}
          onValueChange={(valor) => cambiar('categoria_id', valor)}
          disabled={cargandoCategorias}
        >
          <SelectTrigger id="categoria_id" className="w-full" {...propsDeError('categoria_id', errores.categoria_id)}>
            <SelectValue placeholder={cargandoCategorias ? 'Cargando…' : 'Elige una categoria'} />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={String(categoria.id)}>
                {categoria.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo id="notas" etiqueta="Notas (opcional)" error={errores.notas}>
        <Textarea
          id="notas"
          rows={2}
          value={valores.notas}
          onChange={(e) => cambiar('notas', e.target.value)}
          {...propsDeError('notas', errores.notas)}
        />
      </Campo>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : ingreso ? 'Guardar cambios' : 'Registrar ingreso'}
        </Button>
      </DialogFooter>
    </form>
  )
}
