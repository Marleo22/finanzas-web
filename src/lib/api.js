/**
 * Cliente de API centralizado.
 *
 * Todas las llamadas al backend pasan por aqui. Asi el token, los encabezados
 * y el manejo de errores viven en un solo lugar y no se repiten en cada
 * pantalla.
 *
 * Variables de entorno en Vite:
 *  - Se declaran en el archivo .env de la raiz del proyecto.
 *  - Solo las que empiezan con VITE_ llegan al navegador; las demas se ignoran
 *    a proposito, para no filtrar secretos por accidente.
 *  - Se leen con import.meta.env.VITE_ALGO (no con process.env, que no existe
 *    en el navegador).
 *  - Se reemplazan en tiempo de build: si cambias el .env hay que reiniciar
 *    `npm run dev` o volver a hacer `npm run build`.
 */

const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

const CLAVE_TOKEN = 'finanzas.token'

/** Evento que avisa al AuthContext que el backend rechazo el token. */
export const EVENTO_SESION_EXPIRADA = 'finanzas:sesion-expirada'

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token)
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN)
}

/**
 * Error con la informacion que manda Laravel.
 *
 * - status:  codigo HTTP (0 si ni siquiera hubo respuesta).
 * - message: el "message" de Laravel, listo para mostrar.
 * - errors:  en un 422, objeto { campo: ['mensaje', ...] } para pintar cada
 *            error debajo de su campo.
 */
export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/** Convierte { anio: 2026, mes: '' } en "?anio=2026", omitiendo vacios. */
function construirQuery(params) {
  if (!params) return ''

  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      query.append(clave, valor)
    }
  }

  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

async function solicitar(metodo, ruta, { body, params } = {}) {
  const headers = {
    // Sin este encabezado Laravel puede responder con una redireccion HTML en
    // lugar de JSON cuando falla la validacion o la autenticacion.
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const token = obtenerToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let respuesta
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}${construirQuery(params)}`, {
      method: metodo,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch solo lanza si no hubo respuesta: servidor apagado, sin red, CORS.
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Esta encendida la API?')
  }

  // 204 No Content (por ejemplo al eliminar): no hay cuerpo que leer.
  if (respuesta.status === 204) {
    return null
  }

  // Si el cuerpo no es JSON (un error 500 en HTML, por ejemplo) no se rompe.
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      // Token vencido o revocado: se borra y se avisa a la app para que
      // redirija al login.
      borrarToken()
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
    }

    throw new ApiError(
      respuesta.status,
      datos?.message || mensajePorDefecto(respuesta.status),
      datos?.errors ?? {},
    )
  }

  return datos
}

function mensajePorDefecto(status) {
  if (status === 401) return 'Tu sesion expiro. Vuelve a iniciar sesion.'
  if (status === 404) return 'El registro no existe.'
  if (status === 429) return 'Demasiados intentos. Espera un momento.'
  if (status >= 500) return 'Error del servidor. Intenta de nuevo.'
  return `Error inesperado (${status}).`
}

export const api = {
  get: (ruta, params) => solicitar('GET', ruta, { params }),
  post: (ruta, body) => solicitar('POST', ruta, { body }),
  put: (ruta, body) => solicitar('PUT', ruta, { body }),
  patch: (ruta, body) => solicitar('PATCH', ruta, { body }),
  delete: (ruta) => solicitar('DELETE', ruta),
}
