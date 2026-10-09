import { AlertCircleIcon, InboxIcon, RotateCwIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Los tres estados que no son "exito". Separarlos en componentes evita que
 * cada pantalla los resuelva de una forma distinta.
 */

/** Cargando: filas grises con la forma de la tabla que va a aparecer. */
export function EstadoCargando({ filas = 5 }) {
  return (
    <div className="space-y-2" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

/** Error: el mensaje que mando Laravel y un boton para reintentar. */
export function EstadoError({ error, onReintentar }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los datos</AlertTitle>
      <AlertDescription>
        <p>{error?.message ?? 'Ocurrio un error inesperado.'}</p>
        {onReintentar && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onReintentar}>
            <RotateCwIcon /> Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/** Vacio: no es un error, es una invitacion a crear el primer registro. */
export function EstadoVacio({ titulo, descripcion, accion }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <InboxIcon className="size-8 text-muted-foreground" />
      <p className="font-medium">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
