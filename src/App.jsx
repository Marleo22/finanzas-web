import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import { RutaProtegida, RutaPublica } from '@/components/RutaProtegida'
import { AuthProvider } from '@/context/AuthProvider'
import { Categorias } from '@/pages/Categorias'
import { Egresos } from '@/pages/Egresos'
import { Ingresos } from '@/pages/Ingresos'
import { Login } from '@/pages/Login'
import { Registro } from '@/pages/Registro'

// El dashboard trae Recharts, la dependencia mas pesada. Con lazy() se
// descarga en un archivo aparte solo cuando se visita, y el login carga mas
// rapido. El <Suspense> que muestra el cargador mientras tanto esta en Layout.
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((modulo) => ({ default: modulo.Dashboard })),
)

/**
 * Mapa de rutas.
 *
 * Las rutas de "layout" (sin path) envuelven a sus hijas: RutaPublica y
 * RutaProtegida deciden si dejan pasar, y Layout dibuja la barra lateral
 * alrededor de las paginas con sesion.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RutaPublica />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
          </Route>

          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="/ingresos" element={<Ingresos />} />
              <Route path="/egresos" element={<Egresos />} />
              <Route path="/categorias" element={<Categorias />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
