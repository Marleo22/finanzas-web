import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Controles de pagina para las colecciones paginadas de Laravel.
 * `meta` es el bloque que agrega paginate(): current_page, last_page, total.
 */
export function Paginacion({ meta, onCambiar }) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2 pt-4 text-sm">
      <span className="text-muted-foreground">
        Pagina {meta.current_page} de {meta.last_page}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Pagina anterior"
        disabled={meta.current_page <= 1}
        onClick={() => onCambiar(meta.current_page - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Pagina siguiente"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onCambiar(meta.current_page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
