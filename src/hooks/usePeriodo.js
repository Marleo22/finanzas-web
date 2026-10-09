import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { periodoActual } from '@/lib/formato'

/**
 * Periodo (anio + mes) guardado en la URL: /egresos?anio=2026&mes=7
 *
 * Por que en la URL y no en un useState:
 *  - Al recargar la pagina se conserva el mes que se estaba viendo.
 *  - El boton "atras" del navegador regresa al mes anterior consultado.
 *  - Se puede compartir el enlace exacto.
 * Si la URL no trae un periodo valido se usa el mes actual.
 */
export function usePeriodo() {
  const [params, setParams] = useSearchParams()
  const actual = periodoActual()

  const anio = Number(params.get('anio'))
  const mes = Number(params.get('mes'))

  const periodo = {
    anio: Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : actual.anio,
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : actual.mes,
  }

  const setPeriodo = useCallback(
    (nuevo) => setParams({ anio: String(nuevo.anio), mes: String(nuevo.mes) }),
    [setParams],
  )

  return [periodo, setPeriodo]
}
