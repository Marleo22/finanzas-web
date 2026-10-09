import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EstadoError, EstadoVacio } from '@/components/Estados'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { EncabezadoPagina } from '@/components/Layout'
import { useConsulta } from '@/hooks/useConsulta'
import { usePeriodo } from '@/hooks/usePeriodo'
import { MESES, formatearMoneda, formatearPorcentaje } from '@/lib/formato'
import { cn } from '@/lib/utils'

const COLORES_CATEGORIA = Array.from({ length: 8 }, (_, i) => `var(--cat-${i + 1})`)

/**
 * Dashboard: tres endpoints de agregacion, uno por bloque.
 *
 * Toda la suma, resta y porcentaje la hace el backend con bcmath. Aqui los
 * montos solo se convierten a Number para que Recharts pueda dibujar la
 * altura de las barras; lo que se MUESTRA en texto sigue saliendo del string
 * original.
 */
export function Dashboard() {
  const [periodo, setPeriodo] = usePeriodo()

  const resumen = useConsulta('/dashboard/resumen', periodo)
  const porCategoria = useConsulta('/dashboard/egresos-por-categoria', periodo)
  const anual = useConsulta('/dashboard/resumen-anual', { anio: periodo.anio })

  return (
    <>
      <EncabezadoPagina
        titulo="Dashboard"
        descripcion={`Resumen de ${MESES[periodo.mes - 1]} ${periodo.anio}`}
      >
        <FiltroPeriodo periodo={periodo} onCambiar={setPeriodo} />
      </EncabezadoPagina>

      <TarjetasResumen consulta={resumen} />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ingresos vs egresos {periodo.anio}</CardTitle>
            <CardDescription>Los meses sin movimientos aparecen en cero.</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficaAnual consulta={anual} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Egresos por categoria</CardTitle>
            <CardDescription>{MESES[periodo.mes - 1]} {periodo.anio}</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficaCategorias consulta={porCategoria} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- tarjetas */

function TarjetasResumen({ consulta }) {
  const { datos, error, cargando, recargar } = consulta

  if (error) return <EstadoError error={error} onReintentar={recargar} />

  if (cargando || !datos) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const balanceNegativo = datos.balance_mes.startsWith('-')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tarjeta
        titulo="Ingresos del mes"
        valor={formatearMoneda(datos.ingresos_mes)}
        claseValor="text-ingreso"
        pie={<Variacion valor={datos.comparacion.variacion_ingresos} positivoEsBueno />}
      />
      <Tarjeta
        titulo="Egresos del mes"
        valor={formatearMoneda(datos.egresos_mes)}
        claseValor="text-egreso"
        pie={<Variacion valor={datos.comparacion.variacion_egresos} positivoEsBueno={false} />}
      />
      <Tarjeta
        titulo="Balance del mes"
        valor={formatearMoneda(datos.balance_mes)}
        claseValor={balanceNegativo ? 'text-egreso' : undefined}
        pie={`Acumulado del año: ${formatearMoneda(datos.balance_acumulado)}`}
      />
      <Tarjeta
        titulo="Porcentaje gastado"
        valor={formatearPorcentaje(datos.porcentaje_gastado)}
        pie="De los ingresos del mes"
      />
    </div>
  )
}

function Tarjeta({ titulo, valor, claseValor, pie }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn('text-2xl tabular-nums', claseValor)}>{valor}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{pie}</CardContent>
    </Card>
  )
}

/**
 * Variacion contra el mes anterior.
 *
 * El backend manda null cuando el mes anterior fue cero: pasar de Q0 a Q500
 * no es un aumento del 100%, es indefinido. Se muestra "sin dato" en vez de
 * inventar un numero.
 */
function Variacion({ valor, positivoEsBueno }) {
  if (valor === null || valor === undefined) {
    return <span>Sin dato del mes anterior</span>
  }

  const sube = !valor.startsWith('-') && valor !== '0.00'
  const baja = valor.startsWith('-')
  const bueno = (sube && positivoEsBueno) || (baja && !positivoEsBueno)
  const Icono = sube ? ArrowUpRightIcon : baja ? ArrowDownRightIcon : MinusIcon

  return (
    <span className="inline-flex items-center gap-1">
      <Icono className={cn('size-3.5', sube || baja ? (bueno ? 'text-ingreso' : 'text-egreso') : '')} />
      {sube ? '+' : ''}
      {valor}% vs mes anterior
    </span>
  )
}

/* ------------------------------------------------------------------ graficas */

function GraficaAnual({ consulta }) {
  const { datos, error, cargando, recargar } = consulta

  if (error) return <EstadoError error={error} onReintentar={recargar} />
  if (cargando || !datos) return <Skeleton className="h-72 w-full" />

  // Number() solo para la geometria de la grafica.
  const filas = datos.data.map((mes) => ({
    nombre: MESES[mes.mes - 1].slice(0, 3),
    ingresos: Number(mes.ingresos),
    egresos: Number(mes.egresos),
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filas} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nombre" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={56}
            tickFormatter={(v) => `Q${(v / 1000).toLocaleString('es-GT')}k`}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            formatter={(valor) => formatearMoneda(valor)}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="var(--ingreso)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="egresos" name="Egresos" fill="var(--egreso)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function GraficaCategorias({ consulta }) {
  const { datos, error, cargando, recargar } = consulta

  if (error) return <EstadoError error={error} onReintentar={recargar} />
  if (cargando || !datos) return <Skeleton className="h-72 w-full" />

  if (datos.data.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin egresos en este mes"
        descripcion="Cuando registres gastos veras aqui como se reparten por categoria."
      />
    )
  }

  const filas = datos.data.map((fila, i) => ({
    ...fila,
    valor: Number(fila.total),
    color: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length],
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filas}
              dataKey="valor"
              nameKey="categoria"
              innerRadius="60%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="var(--card)"
            >
              {filas.map((fila) => (
                <Cell key={fila.categoria_id} fill={fila.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor) => formatearMoneda(valor)}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda como lista: muestra los montos exactos del backend. */}
      <ul className="space-y-1.5 text-sm">
        {filas.map((fila) => (
          <li key={fila.categoria_id} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: fila.color }} />
            <span className="flex-1 truncate">{fila.categoria}</span>
            <span className="tabular-nums text-muted-foreground">{fila.porcentaje}%</span>
            <span className="w-28 text-right font-medium tabular-nums">{formatearMoneda(fila.total)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t pt-1.5 font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatearMoneda(datos.total)}</span>
        </li>
      </ul>
    </div>
  )
}
