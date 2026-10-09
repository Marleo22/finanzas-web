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

// Radix Select no admite un item con value="". Este valor representa
// "sin subcategoria" y se traduce a null al enviar.
const SIN_SUBCATEGORIA = 'ninguna'

/** Estado inicial: vacio para crear, o con los datos del egreso para editar. */
function valoresIniciales(egreso) {
  return {
    categoria_id: egreso?.categoria?.id ? String(egreso.categoria.id) : '',
    subcategoria_id: egreso?.subcategoria?.id ? String(egreso.subcategoria.id) : SIN_SUBCATEGORIA,
    fecha: egreso?.fecha ?? hoyIso(),
    descripcion: egreso?.descripcion ?? '',
    // El monto se mantiene como string de principio a fin: nunca parseFloat.
    monto: egreso?.monto ?? '',
    notas: egreso?.notas ?? '',
  }
}

/**
 * Formulario de creacion y edicion de egresos.
 *
 * Mapeo de errores de Laravel: un 422 trae
 *   { message: '...', errors: { monto: ['El monto debe ser mayor que cero.'] } }
 * Las claves de `errors` son exactamente los nombres de los campos que se
 * enviaron. Por eso basta con guardar ese objeto y que cada campo lea
 * errores[suNombre]. No se duplica ninguna regla de validacion aqui.
 *
 * El padre le pone key={egreso?.id ?? 'nuevo'}: al cambiar de egreso el
 * componente se monta de nuevo y el estado inicial se recalcula, sin
 * necesidad de un useEffect que copie props al estado.
 */
export function EgresoForm({ egreso, onGuardado, onCancelar }) {
  const [valores, setValores] = useState(() => valoresIniciales(egreso))
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { datos: respuestaCategorias, cargando: cargandoCategorias } = useConsulta(
    '/categorias',
    { tipo: 'egreso' },
  )
  const categorias = respuestaCategorias?.data ?? []

  // Estado DERIVADO: las subcategorias salen de la categoria seleccionada.
  // El endpoint de categorias ya las incluye, asi que no hace falta otra
  // peticion ni otro useState que haya que mantener sincronizado.
  const subcategorias =
    categorias.find((c) => String(c.id) === valores.categoria_id)?.subcategorias ?? []

  function cambiar(campo, valor) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function cambiarCategoria(valor) {
    // Al cambiar de categoria la subcategoria anterior ya no es valida.
    setValores((previos) => ({ ...previos, categoria_id: valor, subcategoria_id: SIN_SUBCATEGORIA }))
    setErrores((previos) => ({ ...previos, categoria_id: undefined, subcategoria_id: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    setErrores({})
    setMensaje('')

    const cuerpo = {
      categoria_id: valores.categoria_id ? Number(valores.categoria_id) : null,
      subcategoria_id:
        valores.subcategoria_id === SIN_SUBCATEGORIA ? null : Number(valores.subcategoria_id),
      fecha: valores.fecha,
      descripcion: valores.descripcion,
      monto: valores.monto.trim(),
      notas: valores.notas.trim() || null,
    }

    try {
      const respuesta = egreso
        ? await api.put(`/egresos/${egreso.id}`, cuerpo)
        : await api.post('/egresos', cuerpo)
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
          {/* type="text" + inputMode="decimal": muestra el teclado numerico en
              movil pero conserva el valor como texto exacto. */}
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

      <Campo id="descripcion" etiqueta="Descripcion" error={errores.descripcion}>
        <Input
          id="descripcion"
          value={valores.descripcion}
          onChange={(e) => cambiar('descripcion', e.target.value)}
          {...propsDeError('descripcion', errores.descripcion)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="categoria_id" etiqueta="Categoria" error={errores.categoria_id}>
          <Select
            value={valores.categoria_id}
            onValueChange={cambiarCategoria}
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

        <Campo id="subcategoria_id" etiqueta="Subcategoria" error={errores.subcategoria_id}>
          <Select
            value={valores.subcategoria_id}
            onValueChange={(valor) => cambiar('subcategoria_id', valor)}
            disabled={subcategorias.length === 0}
          >
            <SelectTrigger id="subcategoria_id" className="w-full" {...propsDeError('subcategoria_id', errores.subcategoria_id)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_SUBCATEGORIA}>Sin subcategoria</SelectItem>
              {subcategorias.map((sub) => (
                <SelectItem key={sub.id} value={String(sub.id)}>
                  {sub.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </div>

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
          {enviando ? 'Guardando…' : egreso ? 'Guardar cambios' : 'Registrar egreso'}
        </Button>
      </DialogFooter>
    </form>
  )
}
