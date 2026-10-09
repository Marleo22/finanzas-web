import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Dialogo de confirmacion antes de borrar.
 *
 * Se controla desde fuera con `abierto`: la pantalla guarda QUE registro se
 * quiere borrar y este componente solo pregunta. onConfirmar debe devolver una
 * promesa; mientras se resuelve el boton queda deshabilitado para evitar dos
 * DELETE por doble clic.
 */
export function ConfirmarEliminar({ abierto, onCerrar, onConfirmar, descripcion }) {
  const [borrando, setBorrando] = useState(false)

  async function confirmar(evento) {
    // Por defecto el AlertDialog se cierra al hacer clic. Se evita para
    // cerrarlo solo cuando el borrado termino.
    evento.preventDefault()
    setBorrando(true)
    try {
      await onConfirmar()
      onCerrar()
    } finally {
      setBorrando(false)
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={(abrir) => !abrir && !borrando && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
          <AlertDialogDescription>
            {descripcion} Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={borrando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={borrando} onClick={confirmar}>
            {borrando ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
