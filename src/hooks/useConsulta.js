import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

/**
 * GET con los tres estados que toda pantalla debe manejar: cargando, error y
 * datos (que pueden venir vacios).
 *
 * @param {string|null} ruta   Ruta de la API. Si es null no se consulta.
 * @param {object} params      Query string. Se compara por contenido, asi que
 *                             pasar un objeto literal nuevo en cada render no
 *                             dispara peticiones de mas.
 */
export function useConsulta(ruta, params = {}) {
  // Cambiar este numero vuelve a ejecutar el efecto: es el "reintentar".
  const [version, setVersion] = useState(0)

  // Serializar los params convierte el objeto en un valor primitivo. Si se
  // pusiera el objeto directo en las dependencias, cada render crearia uno
  // nuevo y el efecto se ejecutaria en bucle.
  const clave = `${ruta}|${JSON.stringify(params)}|${version}`

  // Ultima respuesta recibida y la clave de la peticion que la produjo.
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })

  useEffect(() => {
    if (ruta === null) return

    // Si el usuario cambia de mes rapido, la respuesta vieja puede llegar
    // despues de la nueva. Esta bandera descarta las respuestas obsoletas.
    let vigente = true

    api
      .get(ruta, params)
      .then((datos) => {
        if (vigente) setResultado({ clave, datos, error: null })
      })
      .catch((error) => {
        if (vigente) setResultado({ clave, datos: null, error })
      })

    return () => {
      vigente = false
    }
    // `params` esta representado en `clave`; incluirlo aparte rehace la
    // peticion en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  // "cargando" es estado DERIVADO, no un useState aparte: se esta cargando
  // mientras la ultima respuesta no corresponda a la peticion actual. Asi es
  // imposible que cargando y datos queden desincronizados.
  const cargando = ruta !== null && resultado.clave !== clave

  return {
    // Mientras carga un periodo nuevo no se muestran los datos del anterior.
    datos: cargando ? null : resultado.datos,
    error: cargando ? null : resultado.error,
    cargando,
    recargar,
  }
}
