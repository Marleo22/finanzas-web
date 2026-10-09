import { useState } from 'react'
import { toast } from 'sonner'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmarEliminar } from '@/components/ConfirmarEliminar'
import { IngresoForm } from '@/components/ingresos/IngresoForm'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/Estados'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { EncabezadoPagina } from '@/components/Layout'
import { Paginacion } from '@/components/Paginacion'
import { usePeriodo } from '@/hooks/usePeriodo'
import { useConsulta } from '@/hooks/useConsulta'
import { api } from '@/lib/api'
import { MESES, formatearFecha, formatearMoneda } from '@/lib/formato'

export function Ingresos() {
  const [periodo, setPeriodo] = usePeriodo()
  const [pagina, setPagina] = useState(1)

  // Dialogo del formulario: cerrado, nuevo (ingreso null) o editando uno.
  const [formulario, setFormulario] = useState({ abierto: false, ingreso: null })

  // Ingreso que se quiere borrar; null cuando el dialogo esta cerrado.
  const [aEliminar, setAEliminar] = useState(null)

  // GET /api/ingresos?anio=&mes=&page= . El backend filtra por el usuario del
  // token; el frontend nunca manda user_id.
  const { datos, error, cargando, recargar } = useConsulta('/ingresos', {
    anio: periodo.anio,
    mes: periodo.mes,
    page: pagina,
  })

  const ingresos = datos?.data ?? []

  function cambiarPeriodo(nuevo) {
    setPeriodo(nuevo)
    // Un periodo nuevo empieza en la primera pagina. Se hace aqui, en el
    // manejador, y no con un useEffect que "reaccione" al cambio de periodo.
    setPagina(1)
  }

  function alGuardar(ingreso) {
    const editando = formulario.ingreso !== null
    setFormulario({ abierto: false, ingreso: null })
    toast.success(editando ? 'Ingreso actualizado.' : 'Ingreso registrado.', {
      description: `${ingreso.fuente} · ${formatearMoneda(ingreso.monto)}`,
    })
    recargar()
  }

  async function eliminar() {
    try {
      await api.delete(`/ingresos/${aEliminar.id}`)
      toast.success('Ingreso eliminado.')
      // Si era la unica fila de una pagina que no es la primera, esa pagina
      // queda vacia: se retrocede una. Cambiar la pagina ya vuelve a consultar.
      if (ingresos.length === 1 && pagina > 1) setPagina(pagina - 1)
      else recargar()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const botonNuevo = (
    <Button onClick={() => setFormulario({ abierto: true, ingreso: null })}>
      <PlusIcon /> Nuevo ingreso
    </Button>
  )

  return (
    <>
      <EncabezadoPagina
        titulo="Ingresos"
        descripcion={`${MESES[periodo.mes - 1]} ${periodo.anio}`}
      >
        <FiltroPeriodo periodo={periodo} onCambiar={cambiarPeriodo} />
        {botonNuevo}
      </EncabezadoPagina>

      <Card>
        <CardContent>
          {/* Los tres estados, en orden: cargando, error, vacio. Solo si no
              es ninguno se dibuja la tabla. */}
          {cargando ? (
            <EstadoCargando />
          ) : error ? (
            <EstadoError error={error} onReintentar={recargar} />
          ) : ingresos.length === 0 ? (
            <EstadoVacio
              titulo="No hay ingresos en este mes"
              descripcion="Registra tu primer ingreso del periodo para ver cuanto entra a tu bolsillo."
              accion={botonNuevo}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-24"><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresos.map((ingreso) => (
                    // El id de la base es la key: estable y unica. El indice
                    // del arreglo no sirve porque cambia al borrar una fila.
                    <TableRow key={ingreso.id}>
                      <TableCell className="whitespace-nowrap">{formatearFecha(ingreso.fecha)}</TableCell>
                      <TableCell className="max-w-64 truncate">{ingreso.fuente}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ingreso.categoria?.nombre}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatearMoneda(ingreso.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${ingreso.fuente}`}
                            onClick={() => setFormulario({ abierto: true, ingreso })}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Eliminar ${ingreso.fuente}`}
                            onClick={() => setAEliminar(ingreso)}
                          >
                            <Trash2Icon className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paginacion meta={datos?.meta} onCambiar={setPagina} />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formulario.abierto}
        onOpenChange={(abierto) => !abierto && setFormulario({ abierto: false, ingreso: null })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formulario.ingreso ? 'Editar ingreso' : 'Nuevo ingreso'}</DialogTitle>
            <DialogDescription>Los campos los valida el servidor al guardar.</DialogDescription>
          </DialogHeader>
          <IngresoForm
            key={formulario.ingreso?.id ?? 'nuevo'}
            ingreso={formulario.ingreso}
            onGuardado={alGuardar}
            onCancelar={() => setFormulario({ abierto: false, ingreso: null })}
          />
        </DialogContent>
      </Dialog>

      <ConfirmarEliminar
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={eliminar}
        descripcion={
          aEliminar && `Se eliminara "${aEliminar.fuente}" por ${formatearMoneda(aEliminar.monto)}.`
        }
      />
    </>
  )
}
