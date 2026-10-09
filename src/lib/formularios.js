/**
 * Props de accesibilidad para un control con error de validacion.
 *
 * `error` es el arreglo que Laravel devuelve para ese campo en un 422. Marca
 * el control como invalido (borde rojo de shadcn) y lo enlaza con el mensaje
 * que pinta <Campo>, para que un lector de pantalla lo lea al enfocarlo.
 */
export function propsDeError(id, error) {
  return error?.[0]
    ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` }
    : {}
}
