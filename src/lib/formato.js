/**
 * Formateo de montos, fechas y periodos.
 *
 * Los montos llegan del backend como string ("1250.50"), nunca como number,
 * porque un float de JavaScript no representa exactamente los centavos. Aqui
 * solo se FORMATEAN para mostrarlos: el frontend no suma ni resta dinero, esa
 * aritmetica la hace el backend con bcmath.
 */

const formatoQuetzales = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * "1250.5" -> "Q1,250.50".
 *
 * Intl.NumberFormat acepta el string directamente y lo formatea con precision
 * decimal exacta, sin pasarlo antes por un float.
 */
export function formatearMoneda(monto) {
  if (monto === null || monto === undefined || monto === '') return '—'
  return formatoQuetzales.format(monto)
}

/** Porcentaje que ya viene calculado del backend, como string. */
export function formatearPorcentaje(valor) {
  if (valor === null || valor === undefined) return 'sin dato'
  return `${valor}%`
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * "2026-07-15" -> "15 jul 2026".
 *
 * Se parte el string a mano en vez de usar new Date("2026-07-15"): ese
 * constructor lo interpreta como medianoche UTC y en Guatemala (UTC-6) la
 * fecha se mostraria un dia antes.
 */
export function formatearFecha(fechaIso) {
  if (!fechaIso) return '—'
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Fecha local de hoy en formato AAAA-MM-DD, para precargar formularios. */
export function hoyIso() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function periodoActual() {
  const hoy = new Date()
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
}

/** Anios que ofrece el selector de periodo: del actual hacia atras. */
export function aniosDisponibles(cantidad = 5) {
  const actual = new Date().getFullYear()
  return Array.from({ length: cantidad }, (_, i) => actual - i)
}
