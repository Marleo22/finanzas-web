# finanzas-web

Frontend del **Sistema de Control de Ingresos y Egresos personales**. Es una SPA en React que consume la API REST de [finanzas-api](https://github.com/Marleo22/finanzas-api) con tokens Bearer de Laravel Sanctum.

Funcionalidades:

- Registro, inicio y cierre de sesión. La sesión sobrevive a la recarga de la página sin que parpadee la pantalla de login.
- **Dashboard**: ingresos, egresos, balance y porcentaje gastado del mes, con su variación frente al mes anterior; gráfica anual de ingresos contra egresos y distribución de egresos por categoría.
- **Ingresos y egresos**: listado filtrado por mes y año, paginado, con alta, edición y borrado (con confirmación).
- **Categorías**: catálogo del sistema (solo lectura) y categorías propias (crear, renombrar, borrar).
- Montos en quetzales (Q). Los errores de validación del backend se muestran debajo de cada campo.

## Stack

| Herramienta | Versión |
| --- | --- |
| React | 19 |
| Vite | 8 |
| JavaScript + JSX | sin TypeScript |
| Tailwind CSS | 4 (configurado desde CSS, sin `tailwind.config.js`) |
| shadcn/ui | componentes en `src/components/ui` |
| React Router | 7 |
| Recharts | 3 |

## Requisitos

- **Node.js 20.19 o superior** (o 22.12+). Vite 8 no funciona con versiones anteriores. Comprueba con `node -v`.
- **npm 10+**.
- La API **finanzas-api** corriendo y accesible desde el navegador. Sus instrucciones están en su propio README.

## Instalación

```bash
git clone https://github.com/<USUARIO>/finanzas-web.git
cd finanzas-web
npm install
cp .env.example .env
```

## Configurar `VITE_API_URL`

El frontend lee la URL de la API desde una variable de entorno de Vite. Edita `.env`:

```dotenv
# URL base de la API, incluyendo /api y sin barra final
VITE_API_URL=http://127.0.0.1:8000/api
```

En producción va el dominio real de la API, por ejemplo `VITE_API_URL=https://api.<TU-DOMINIO>/api`.

Cómo funcionan las variables en Vite:

- Solo llegan al código las que empiezan con `VITE_`. Las demás se ignoran.
- Se leen con `import.meta.env.VITE_API_URL`. En el navegador no existe `process.env`.
- Se reemplazan al compilar. Si cambias `.env`, reinicia `npm run dev` o vuelve a ejecutar `npm run build`.

> [!WARNING]
> **Las variables `VITE_` quedan incrustadas en el JavaScript del build y cualquiera puede leerlas** desde el navegador (pestaña Sources o Network). Nunca pongas en ellas contraseñas, claves de API, tokens ni ningún otro secreto. Lo único que va aquí es información pública, como la URL de la API.

La API solo acepta peticiones de los orígenes listados en `CORS_ALLOWED_ORIGINS` de su `.env`. Si el frontend corre en otro puerto o dominio, agrégalo ahí.

## Servidor de desarrollo

```bash
npm run dev
```

Abre <http://localhost:5173>. Los cambios se ven al guardar, sin recargar.

Usuarios de prueba, si se ejecutó `php artisan db:seed --class=DatosDePruebaSeeder` en la API:

| Correo | Contraseña |
| --- | --- |
| `ana@finanzas.test` | `password123` |
| `beto@finanzas.test` | `password123` |

Los datos de prueba van de enero a julio de 2026. Junio está vacío a propósito.

## Build de producción

```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve dist/ en local para revisarlo antes de publicar
```

`dist/` contiene archivos estáticos que se pueden servir con cualquier servidor web. La app usa rutas del lado del cliente (`/egresos`, `/categorias`), así que el servidor debe responder `index.html` para cualquier ruta que no sea un archivo. En Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Sin eso, recargar la página en `/egresos` devuelve 404. La guía completa para el VPS está en `DESPLIEGUE.md` del repositorio finanzas-api.

## Otros comandos

```bash
npm run lint       # análisis estático con oxlint
```

## Estructura

```
src/
├── App.jsx                 Rutas: públicas, protegidas y el layout
├── main.jsx                Punto de entrada
├── index.css               Tailwind v4 + tema de shadcn + colores propios
├── lib/
│   ├── api.js              Cliente HTTP: URL base, token, errores, 401
│   ├── formato.js          Moneda (Q), fechas y meses
│   └── formularios.js      Enlace de errores de Laravel con los campos
├── context/
│   ├── auth.js             Contexto y hook useAuth()
│   └── AuthProvider.jsx    Sesión: login, registro, logout y validación del token
├── hooks/
│   ├── useConsulta.js      GET con estados cargando / error / datos
│   └── usePeriodo.js       Mes y año guardados en la URL
├── components/
│   ├── ui/                 Componentes de shadcn/ui
│   ├── Layout.jsx          Barra lateral y encabezado de página
│   ├── RutaProtegida.jsx   Guardias de ruta (sin parpadeo del login)
│   ├── Estados.jsx         Cargando, error con reintentar y vacío
│   ├── egresos/EgresoForm.jsx
│   └── ingresos/IngresoForm.jsx
└── pages/                  Login, Registro, Dashboard, Ingresos, Egresos, Categorias
```

## Decisiones de diseño

- **Los montos son strings de principio a fin.** La API los envía como texto (`"1250.50"`) y el frontend nunca los suma ni los pasa por `parseFloat`. `Intl.NumberFormat` formatea el string directamente. Solo las gráficas lo convierten a número, para calcular la altura de las barras.
- **No se duplican las reglas de validación.** El backend valida con Form Requests y el frontend solo muestra `errors[campo]` del 422 debajo de cada campo.
- **El token se guarda en `localStorage`.** Es simple y sobrevive a la recarga, pero cualquier script de la página puede leerlo (riesgo de XSS). Lo mitigan dos cosas: React escapa el texto por defecto y no se usa `dangerouslySetInnerHTML`.
