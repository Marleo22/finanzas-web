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
import { EgresoForm } from '@/components/egresos/EgresoForm'
import { EstadoCargando, EstadoError, EstadoVacio } from '@/components/Estados'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { EncabezadoPagina } from '@/components/Layout'
import { Paginacion } from '@/components/Paginacion'
import { usePeriodo } from '@/hooks/usePeriodo'
import { useConsulta } from '@/hooks/useConsulta'
import { api } from '@/lib/api'
import { MESES, formatearFecha, formatearMoneda } from '@/lib/formato'

export function Egresos() {
  const [periodo, setPeriodo] = usePeriodo()
  const [pagina, setPagina] = useState(1)

  // Dialogo del formulario: cerrado, nuevo (egreso null) o editando uno.
  const [formulario, setFormulario] = useState({ abierto: false, egreso: null })

  // Egreso que se quiere borrar; null cuando el dialogo esta cerrado.
  const [aEliminar, setAEliminar] = useState(null)

  // GET /api/egresos?anio=&mes=&page= . El backend filtra por el usuario del
  // token; el frontend nunca manda user_id.
  const { datos, error, cargando, recargar } = useConsulta('/egresos', {
    anio: periodo.anio,
    mes: periodo.mes,
    page: pagina,
  })

  const egresos = datos?.data ?? []

  function cambiarPeriodo(nuevo) {
    setPeriodo(nuevo)
    // Un periodo nuevo empieza en la primera pagina. Se hace aqui, en el
    // manejador, y no con un useEffect que "reaccione" al cambio de periodo.
    setPagina(1)
  }

  function alGuardar(egreso) {
    const editando = formulario.egreso !== null
    setFormulario({ abierto: false, egreso: null })
    toast.success(editando ? 'Egreso actualizado.' : 'Egreso registrado.', {
      description: `${egreso.descripcion} · ${formatearMoneda(egreso.monto)}`,
    })
    recargar()
  }

  async function eliminar() {
    try {
      await api.delete(`/egresos/${aEliminar.id}`)
      toast.success('Egreso eliminado.')
      // Si era la unica fila de una pagina que no es la primera, esa pagina
      // queda vacia: se retrocede una. Cambiar la pagina ya vuelve a consultar.
      if (egresos.length === 1 && pagina > 1) setPagina(pagina - 1)
      else recargar()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const botonNuevo = (
    <Button onClick={() => setFormulario({ abierto: true, egreso: null })}>
      <PlusIcon /> Nuevo egreso
    </Button>
  )

  return (
    <>
      <EncabezadoPagina
        titulo="Egresos"
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
          ) : egresos.length === 0 ? (
            <EstadoVacio
              titulo="No hay egresos en este mes"
              descripcion="Registra tu primer gasto del periodo para empezar a ver a donde se va tu dinero."
              accion={botonNuevo}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-24"><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {egresos.map((egreso) => (
                    // El id de la base es la key: estable y unica. El indice
                    // del arreglo no sirve porque cambia al borrar una fila.
                    <TableRow key={egreso.id}>
                      <TableCell className="whitespace-nowrap">{formatearFecha(egreso.fecha)}</TableCell>
                      <TableCell className="max-w-64 truncate">{egreso.descripcion}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{egreso.categoria?.nombre}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {egreso.subcategoria?.nombre ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatearMoneda(egreso.monto)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar ${egreso.descripcion}`}
                            onClick={() => setFormulario({ abierto: true, egreso })}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Eliminar ${egreso.descripcion}`}
                            onClick={() => setAEliminar(egreso)}
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
        onOpenChange={(abierto) => !abierto && setFormulario({ abierto: false, egreso: null })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formulario.egreso ? 'Editar egreso' : 'Nuevo egreso'}</DialogTitle>
            <DialogDescription>Los campos los valida el servidor al guardar.</DialogDescription>
          </DialogHeader>
          <EgresoForm
            key={formulario.egreso?.id ?? 'nuevo'}
            egreso={formulario.egreso}
            onGuardado={alGuardar}
            onCancelar={() => setFormulario({ abierto: false, egreso: null })}
          />
        </DialogContent>
      </Dialog>

      <ConfirmarEliminar
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={eliminar}
        descripcion={
          aEliminar && `Se eliminara "${aEliminar.descripcion}" por ${formatearMoneda(aEliminar.monto)}.`
        }
      />
    </>
  )
}
