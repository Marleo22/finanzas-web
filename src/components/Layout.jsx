import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  TagsIcon,
  WalletIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EstadoCargando } from '@/components/Estados'
import { useAuth } from '@/context/auth'
import { cn } from '@/lib/utils'

const SECCIONES = [
  { a: '/', etiqueta: 'Dashboard', icono: LayoutDashboardIcon, fin: true },
  { a: '/ingresos', etiqueta: 'Ingresos', icono: ArrowUpCircleIcon },
  { a: '/egresos', etiqueta: 'Egresos', icono: ArrowDownCircleIcon },
  { a: '/categorias', etiqueta: 'Categorias', icono: TagsIcon },
]

/**
 * Estructura comun de las paginas con sesion: barra lateral + contenido.
 *
 * NavLink sabe si su ruta es la actual y le pasa isActive a className; asi se
 * resalta la seccion activa sin llevar ese estado a mano. `end` en el
 * dashboard evita que "/" quede activo en todas las rutas (todas empiezan
 * con "/").
 */
export function Layout() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()

  async function cerrarSesion() {
    await logout()
    navegar('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <WalletIcon className="size-5 text-primary" />
          <span className="font-semibold">Mis Finanzas</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:pb-0" aria-label="Principal">
          {SECCIONES.map(({ a, etiqueta, icono: Icono, fin }) => (
            <NavLink
              key={a}
              to={a}
              end={fin}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              <Icono className="size-4" />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t p-3 md:block">
          <p className="truncate text-sm font-medium">{usuario?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{usuario?.email}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={cerrarSesion}>
            <LogOutIcon /> Cerrar sesion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* En movil el usuario y el boton de salir van arriba del contenido. */}
        <div className="flex items-center justify-between border-b px-4 py-2 md:hidden">
          <span className="truncate text-sm">{usuario?.name}</span>
          <Button variant="ghost" size="sm" onClick={cerrarSesion}>
            <LogOutIcon /> Salir
          </Button>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Suspense fallback={<EstadoCargando />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

/** Encabezado de pagina: titulo, descripcion y acciones a la derecha. */
export function EncabezadoPagina({ titulo, descripcion, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
