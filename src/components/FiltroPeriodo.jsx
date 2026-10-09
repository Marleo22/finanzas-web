import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MESES, aniosDisponibles } from '@/lib/formato'

/**
 * Selector de mes y año.
 *
 * El backend no tiene columna "mes": recibe anio y mes y arma el rango de
 * fechas. Aqui solo se eligen esos dos numeros.
 *
 * Los Select de shadcn trabajan con strings, por eso se convierte con
 * String() al pasar el valor y con Number() al recibirlo.
 */
export function FiltroPeriodo({ periodo, onCambiar }) {
  return (
    <div className="flex gap-2">
      <Select
        value={String(periodo.mes)}
        onValueChange={(valor) => onCambiar({ ...periodo, mes: Number(valor) })}
      >
        <SelectTrigger className="w-36" aria-label="Mes">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((nombre, indice) => (
            <SelectItem key={nombre} value={String(indice + 1)}>
              {nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(periodo.anio)}
        onValueChange={(valor) => onCambiar({ ...periodo, anio: Number(valor) })}
      >
        <SelectTrigger className="w-24" aria-label="Año">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {aniosDisponibles().map((anio) => (
            <SelectItem key={anio} value={String(anio)}>
              {anio}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
