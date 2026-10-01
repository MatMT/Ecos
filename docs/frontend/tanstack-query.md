# ECOS Admin Web — TanStack Query

## Responsabilidad

TanStack Query es la única solución para datos remotos de Nest: caché, sincronización, carga, errores, reintentos, cancelación e invalidación. Los recursos remotos no deben duplicarse en Zustand, Context, Redux, arrays globales ni estado local.

Zustand, si se incorpora en el futuro, queda limitado a estado efímero de interfaz como la apertura de una barra lateral, preferencias locales o pasos de un asistente.

## Provider y QueryClient

La infraestructura vive en `src/lib/query`. `QueryProvider` es un Client Component integrado desde el layout raíz, mientras que el layout conserva su naturaleza de Server Component.

Los defaults de `QueryClient` son:

- `staleTime`: 60 segundos.
- `gcTime`: 5 minutos.
- `refetchOnWindowFocus`: `false`.
- `refetchOnReconnect`: `true`.
- Queries: un solo reintento para errores de red, timeout o 5xx; ningún reintento para 4xx o una solicitud cancelada.
- Mutations: sin reintentos automáticos.

La caché existe únicamente en memoria. No se persiste en `localStorage`, IndexedDB ni mediante `persistQueryClient`.

## Query keys

Cada feature es dueña de sus factories de keys. La convención es jerárquica:

```ts
const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters: PatientFilters) => [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
}
```

Los filtros que cambian el resultado pertenecen a la key y deben ser valores serializables y estables. No se crean factories globales para dominios clínicos. La key `["auth", "session"]` queda reservada para la Fase 1.6 sin implementar todavía una consulta de sesión.

## Patrón de features futuro

Una feature implementará su adaptador con `api` desde `@/lib/api`, un hook de TanStack Query y luego su componente. No se hacen solicitudes directas desde rutas o componentes.

```ts
export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: ({ signal }) => patientsApi.getPatients(filters, { signal }),
  })
}
```

El `AbortSignal` debe llegar al ApiClient para cancelar solicitudes obsoletas. Las queries usan `isPending` para la primera carga e `isFetching` para actualizaciones en segundo plano; una actualización no debe reemplazar toda la vista por un skeleton.

## Mutaciones e invalidación

Las mutaciones futuras ejecutan la operación y después invalidan únicamente las keys afectadas. No se debe llamar `invalidateQueries()` sin filtro ni limpiar toda la caché tras cada operación.

La estrategia inicial es invalidar y volver a consultar. `setQueryData` solo se usará cuando la respuesta sea suficiente y la actualización sea simple. No se adoptan optimistic updates por defecto, especialmente en citas, alertas, asignaciones o notas clínicas.

## Sesión y datos clínicos

`AuthSessionProvider` limpia la caché sensible mediante `queryClient.clear()` al cerrar sesión, cambiar de usuario o finalizar una sesión por 401. La infraestructura no muestra toasts globales; cada feature decide su feedback no relacionado con autenticación.

No se implementan SSR, prefetch ni hydration globales. Se evaluarán por vista cuando aporten un beneficio real al portal privado e interactivo.
