import { Label } from '@/components/ui/label'

/**
 * Etiqueta + control + mensaje de error.
 *
 * `error` es el arreglo que Laravel devuelve para ese campo en un 422, por
 * ejemplo errors.monto = ['El monto debe ser mayor que cero.']. Se muestra el
 * primero. El id del mensaje se enlaza con aria-describedby para que un
 * lector de pantalla lo lea al enfocar el campo.
 */
export function Campo({ id, etiqueta, error, children }) {
  const mensaje = error?.[0]

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {mensaje && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {mensaje}
        </p>
      )}
    </div>
  )
}
