# ECOS Admin Web — Guía para crear nuevas páginas

## 1. Antes de comenzar

1. Cree la ruta dentro de `src/app/(dashboard)`; el shell, sesión, permisos de
   ruta, spacing, theme y breadcrumbs se heredan automáticamente.
2. No modifique `app/(dashboard)/layout.tsx` para una página nueva.
3. Cree `src/features/<domain>` cuando la página tenga lógica de dominio real.
4. No use Prisma, Supabase ni `fetch` directo: importe `api` desde `@/lib/api`.
5. No agregue navegación hasta que exista una ruta funcional y un permiso de ruta.

## 2. Estructura recomendada

```text
features/resources/
├── api/
│   ├── resources.api.ts
│   └── resource.keys.ts
├── components/
├── hooks/
├── schemas/
└── types/
```

Las rutas de `app` solo componen la feature. Los DTOs, hooks y adaptadores se
mantienen junto al dominio que los posee.

## 3. Crear una página

```tsx
import { ResourcesPage } from "@/features/resources/components/ResourcesPage"

export default function Page() {
  return <ResourcesPage />
}
```

## 4. Componentes de página

Use `PageHeader` una vez por página. Sus acciones son composición normal: la
feature aplica `PermissionGate` cuando corresponda.

```tsx
<PageHeader
  title="Recursos"
  description="Administre los recursos disponibles."
  actions={
    <PermissionGate permission="activities.catalog.manage">
      <Button>Nuevo recurso</Button>
    </PermissionGate>
  }
/>
```

Use `FilterBar` para organizar filtros, no para leer ni escribir URL search
params. Los filtros que afectan un listado deben vivir en search params de la
feature para conservar refresh, enlaces compartibles y back/forward.

```tsx
<FilterBar actions={<Button variant="outline">Limpiar</Button>}>
  <Input aria-label="Buscar recursos" placeholder="Buscar" />
  <Select>{/* opciones de la feature */}</Select>
</FilterBar>
```

## 5. Tabla, carga, vacío y error

`DataTable` no hace solicitudes. Recibe la página de datos actual, columnas,
clave estable y callbacks externos de paginación.

```tsx
const columns: DataTableColumn<ResourceRow>[] = [
  { id: "name", header: "Nombre", cell: (row) => row.name },
  { id: "status", header: "Estado", cell: (row) => <StatusBadge {...row.status} /> },
]

<DataTable
  columns={columns}
  data={resources ?? []}
  getRowId={(row) => row.id}
  isLoading={query.isPending}
  emptyState={
    <EmptyState
      title="No hay recursos"
      description="Aún no existen recursos que coincidan con los filtros."
    />
  }
  pagination={{
    page,
    pageSize,
    total,
    onPageChange: setPage,
  }}
/>
```

Para un fallo persistente de carga, renderice `ErrorState` en la vista, no un
toast. Para una sección denegada que no debe expulsar al usuario, use
`ForbiddenState variant="embedded"`.

```tsx
<ErrorState
  title="No fue posible cargar los recursos"
  description="Ha ocurrido un problema temporal."
  onRetry={() => void query.refetch()}
/>
```

## 6. Queries y mutations

Cada feature posee su API, sus keys y hooks. Incluya filtros serializables en la
key y reenvíe el `signal` de TanStack Query.

```tsx
export const resourceKeys = {
  all: ["resources"] as const,
  lists: () => [...resourceKeys.all, "list"] as const,
  list: (filters: ResourceFilters) => [...resourceKeys.lists(), filters] as const,
}

export const resourcesApi = {
  list: (filters: ResourceFilters, signal?: AbortSignal) =>
    api.get<ResourceDto[]>("/resources", { params: filters, signal }),
}

export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: ({ signal }) => resourcesApi.list(filters, signal),
  })
}
```

Una mutation invalida solamente las keys afectadas. La feature decide toast,
cierre del diálogo y navegación.

```tsx
export function useCreateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resourcesApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
      toast.success("El recurso ha sido creado correctamente.")
    },
    onError: () => {
      toast.error("No fue posible crear el recurso. Por favor, intente nuevamente.")
    },
  })
}
```

Use `toast.success` y `toast.error` solo para resultados transitorios de
mutaciones. No use toast para loading persistente, vacío, 403 ni errores de
listado.

## 7. Formularios y confirmaciones

Cada formulario usa Zod, `z.infer`, React Hook Form y un `FormModel` propio.
Transforme el modelo al DTO justo antes de la mutation; no acople inputs al DTO
de Nest.

```tsx
const form = useForm<ResourceFormModel>({
  defaultValues: { name: "" },
  resolver: zodResolver(resourceSchema),
})

<form onSubmit={form.handleSubmit((values) => createResource.mutate(toCreateResourceDto(values)))}>
  <FormSection title="Información principal" description="Complete los campos requeridos.">
    {/* Label, Input y errores del campo */}
  </FormSection>
  <Button disabled={createResource.isPending} type="submit">
    {createResource.isPending ? "Guardando…" : "Guardar"}
  </Button>
</form>
```

Nest conserva en `ApiError.validationMessages` los mensajes de validación que
entrega como arreglo. Una feature solo puede llevarlos a un campo mediante un
mapa explícito de mensaje exacto a `Path<FormModel>`; nunca infiera campos por
texto libre. Los mensajes no mapeados se muestran en `FormError`.

```tsx
const fieldErrorMap = {
  "El correo electrónico ya está registrado.": "email",
} as const satisfies ApiFieldErrorMap<ResourceFormModel>

const unmappedMessages = applyApiFieldErrors(form.setError, error, fieldErrorMap)
if (unmappedMessages.length > 0) {
  setSubmitError(error.message)
}
```

Consulte `form.formState.isDirty` antes de implementar una advertencia local de
salida; no existe un sistema global de cambios sin guardar. La guía completa de
formularios, errores y mutations está en
`docs/frontend/forms-errors-mutations.md`.

`ConfirmDialog` es controlado: manténgalo abierto mientras `mutation.isPending`
y ciérrelo desde `onSuccess` de la feature.

```tsx
<ConfirmDialog
  open={isConfirmOpen}
  onOpenChange={setIsConfirmOpen}
  title="¿Confirmar acción?"
  description="Esta acción requiere confirmación."
  confirmLabel="Confirmar"
  isPending={mutation.isPending}
  onConfirm={() => mutation.mutate()}
/>
```

## 7.1 Recetas comunes

- **Crear o editar:** valide con Zod, transforme `FormModel` al DTO en el
  submit, deshabilite el botón con `mutation.isPending`, invalide únicamente la
  key afectada y cierre o navegue solo en `onSuccess`.
- **Error de campo:** use `applyApiFieldErrors` solo con una tabla explícita
  documentada por la feature. Todo mensaje no reconocido permanece como
  `FormError` general.
- **Conflicto 409:** conserve el formulario, muestre el mensaje seguro de
  `ApiError`, refresque solamente la query relacionada si ayuda a corregir la
  selección y permita reintentar.
- **Confirmación pendiente:** pase `mutation.isPending` a `ConfirmDialog`; el
  diálogo no se cerrará ni aceptará una segunda confirmación durante la acción.
- **Query:** use `isPending` para carga, `ErrorState` para fallo persistente,
  `EmptyState` para una respuesta vacía y `ForbiddenState` para 403.
- **Navegación posterior al éxito:** una feature decide la ruta únicamente tras
  recibir éxito de la mutation; nunca lo haga desde `ApiClient`.

## 8. Permisos, navegación y breadcrumbs

`PermissionGate` y `usePermission` mejoran la UX, pero no reemplazan Nest ni
RLS. Registre el permiso de ruta y la navegación según
`docs/frontend/dashboard-shell.md`.

Para un recurso dinámico cuyo nombre ya está cargado, una feature cliente puede
actualizar el breadcrumb sin hacer una solicitud adicional:

```tsx
useDashboardBreadcrumbLabel(resource.name)
```

## 9. Ejemplo pequeño de una vista

Una `ResourcesPage` conceptual compone `PageHeader`, `FilterBar`,
`useResources(filters)` y `DataTable`. Si la query falla, muestra `ErrorState`;
si no devuelve filas, entrega `EmptyState` a la tabla; sus acciones se envuelven
en `PermissionGate`. No convierta este ejemplo en una feature productiva hasta
que exista su contrato y ruta reales.

## 10. Instrucciones rápidas para Martín, William y Néstor

1. Cree la ruta dentro de `(dashboard)`.
2. Cree la feature en `features/<domain>`.
3. Defina tipos de UI y DTOs propios, sin tipos Prisma.
4. Cree el adaptador API con `api`.
5. Defina una factory de query keys.
6. Cree el hook TanStack Query que reenvíe `signal`.
7. Componga la página con `PageHeader`.
8. Añada `FilterBar` si hay filtros de listado.
9. Use `DataTable`, `EmptyState` y `ErrorState` según el estado.
10. Envuelva acciones visuales en `PermissionGate` cuando aplique.
11. Use Zod, React Hook Form y `FormSection` para formularios.
12. Use `ConfirmDialog` para acciones sensibles.
13. Muestre toasts solo al completar o fallar una mutation.
14. Invalide únicamente las keys afectadas.
15. Verifique responsive, tema, teclado, lint, typecheck y build.

## 11. Checklist antes de PR

- [ ] La ruta está dentro de `(dashboard)` y no modifica el shell.
- [ ] La feature posee sus tipos, API, keys y hooks.
- [ ] La API usa `ApiClient` y no `fetch` directo.
- [ ] Los filtros relevantes están en URL search params y en la query key.
- [ ] Existen loading, empty, error y permisos visuales.
- [ ] Las mutations invalidan solo las keys necesarias.
- [ ] Formularios usan Zod, React Hook Form y estado pendiente.
- [ ] Los errores de campo tienen un mapa exacto documentado; el resto usa `FormError`.
- [ ] Light/dark, responsive, foco y navegación por teclado fueron revisados.
- [ ] No se agregaron datos clínicos a stores globales.
- [ ] Lint, typecheck y build fueron ejecutados.
