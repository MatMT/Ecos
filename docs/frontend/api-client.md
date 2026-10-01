# ECOS Admin Web — API Client

## Propósito

`src/lib/api` es la única infraestructura HTTP compartida de `admin-web`. Centraliza la URL de Nest, encabezados, parámetros, timeout, cancelación, parsing de respuestas y normalización de errores. No contiene endpoints ni tipos de dominios clínicos.

## Configuración y tecnología

El cliente usa `fetch` nativo. No se incorpora Axios porque no es una dependencia existente y `fetch` cubre los requisitos actuales sin añadir peso ni otra abstracción.

`NEXT_PUBLIC_API_URL` representa el origen de Nest. En desarrollo se configura como `http://localhost:6622`; el cliente agrega centralmente el prefijo confirmado `/api/v1`.

La variable es obligatoria y debe contener únicamente un origen HTTP o HTTPS válido. El timeout central es de 15 segundos.

## Uso

Las features futuras importarán el cliente desde `@/lib/api` y definirán sus propios DTOs junto a sus adaptadores.

```ts
import { api } from "@/lib/api"

const patients = await api.get<PatientDto[]>("/students", {
  params: { skip: 0, take: 20 },
})

const patient = await api.post<PatientDto, CreatePatientDto>(
  "/students",
  payload,
)

await api.patch<void, UpdatePatientDto>(`/students/${id}`, payload)

const controller = new AbortController()
await api.get<PatientDto[]>("/students", { signal: controller.signal })
```

Los parámetros `undefined` y `null` se omiten. Los arrays se codifican mediante claves repetidas; los parámetros reales de Nest actualmente son escalares (`skip`, `take`, filtros y fechas).

Las respuestas se devuelven en la forma directa de Nest, sin un envelope artificial. Una respuesta `204` o `205` devuelve `undefined`; se debe usar `void` como tipo de respuesta cuando corresponda.

## Errores

Las respuestas HTTP no exitosas lanzan `ApiError`, con `status`, `message`,
`code` cuando Nest lo proporciona y `details` seguros. Los mensajes de
validación que Nest entrega como arreglo se normalizan a un texto único y se
conservan en `validationMessages`; el cliente no deduce campos de formulario.

Los fallos de red, timeout y cancelación también se expresan como `ApiError` con estado `0` y códigos `NETWORK_ERROR`, `REQUEST_TIMEOUT` o `REQUEST_ABORTED`. El cliente no redirige, no usa React y no toma decisiones de interfaz para 401, 403, 404, 409, 422 o 500.

## Autenticación y credentials

El cliente usa `credentials: "omit"` por defecto. Nest utiliza encabezados Bearer y no cookies cross-origin. `AuthSessionProvider` registra una estrategia que agrega el token, ejecuta un refresh single-flight después de un 401 y reintenta una vez la solicitud autenticada.

El ApiClient sigue sin almacenar tokens, navegar ni decidir la UI. Las solicitudes públicas de autenticación usan `authentication: "none"` para evitar inyectar Bearer o provocar ciclos de refresh.

El origen local de `admin-web` ya está permitido por CORS. El servidor acepta actualmente GET, POST, PATCH y DELETE; `put` está disponible como capacidad genérica, pero ningún endpoint de Nest lo usa todavía.

## Límites

No usar `fetch` directo en páginas o componentes, URLs de Nest hardcodeadas, tipos de Prisma ni redirecciones dentro de la capa HTTP. No existe un tipo de paginación global porque Nest devuelve listas directas sin una convención homogénea de metadatos.

TanStack Query, autenticación, refresh de tokens y los adaptadores `features/<domain>/api` se implementarán en fases posteriores.

## Verificación manual

Cuando Nest esté disponible, verificar una solicitud pública y de solo lectura, parámetros escalares, parsing JSON, respuesta 204, errores de validación con `message` en arreglo, estados 401/403/404/409/422/500, timeout y cancelación con `AbortSignal`. No utilizar credenciales hardcodeadas ni alterar datos clínicos.
