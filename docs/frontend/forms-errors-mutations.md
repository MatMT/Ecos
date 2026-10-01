# ECOS Admin Web — Formularios, errores, mutations y resiliencia

## Alcance

Esta guía define el recorrido de un formulario de `admin-web`: Zod valida la
entrada, React Hook Form administra el estado, la feature transforma el modelo
de interfaz al DTO, TanStack Query ejecuta la mutation y `ApiClient` comunica
con Nest. No crea un manejador universal de mutations ni cambia contratos del
servidor.

## Formulario por feature

Cada feature es dueña de su schema, su `FormModel`, sus DTOs y la
transformación entre ambos. El modelo contiene necesidades de interfaz; el DTO
representa únicamente el endpoint.

```ts
const resourceSchema = z.object({
  displayName: z.string().trim().min(1, "Ingrese un nombre."),
})

type ResourceFormModel = z.infer<typeof resourceSchema>

interface CreateResourceDto {
  name: string
}

function toCreateResourceDto(values: ResourceFormModel): CreateResourceDto {
  return { name: values.displayName }
}
```

El componente usa `zodResolver(resourceSchema)`, labels visibles y errores junto
al campo. En el submit debe deshabilitarse el botón con `mutation.isPending`;
una mutation no se vuelve a ejecutar mientras está pendiente.

## Errores de campo y error general

Nest puede devolver validaciones como `message: string[]`. `ApiError` conserva
esa lista en `validationMessages`, pero el contrato no identifica campos. Por
ello, una feature solo puede asociar errores a controles con un mapa explícito
de mensaje exacto a `Path<FormModel>`:

```ts
const createResourceFieldErrors = {
  "El nombre ya está registrado.": "displayName",
} as const satisfies ApiFieldErrorMap<ResourceFormModel>

const unmappedMessages = applyApiFieldErrors(
  form.setError,
  error,
  createResourceFieldErrors,
)
```

`applyApiFieldErrors` actúa solo para 400 y 422. Los mensajes desconocidos, un
400 sin mensajes estructurados y cualquier otro estado se presentan con
`FormError` como error general. Nunca se debe inferir el campo mediante texto
libre, expresiones regulares o posición dentro de la lista.

## Ciclo de mutation

La feature define el ciclo completo. `ApiClient` no muestra toasts, navega ni
cierra diálogos.

1. Validar localmente con Zod y transformar `FormModel` al DTO.
2. Ejecutar la mutation con el adaptador API de la feature.
3. Mientras esté pendiente, bloquear el submit y cualquier confirmación
   duplicada.
4. En éxito, invalidar solamente las query keys afectadas, mostrar un
   `toast.success` breve y entonces resetear, cerrar o navegar si aplica.
5. En fallo, conservar valores, mostrar errores de campo explícitamente
   mapeados y usar `FormError` para el resto. `toast.error` queda reservado para
   el resultado transitorio de la mutation, no para sustituir el estado visible.

`ConfirmDialog` es controlado por la feature. Recibe `mutation.isPending` y se
mantiene abierto durante la operación; su `onConfirm` solo dispara la mutation.

## Estados HTTP y de conectividad

| Condición | Tratamiento de interfaz |
| --- | --- |
| 400 / 422 | Validar con Zod antes de enviar. Aplicar solo mensajes de campo exactos; el resto usa `FormError`. |
| 401 | `AuthSessionProvider` resuelve refresh o finaliza la sesión. Las features no limpian tokens. |
| 403 | Conservar sesión y mostrar `ForbiddenState` embebido o `/403` según el contexto. |
| 404 | En una vista de detalle, decidir `notFound()`; no navegar automáticamente al inicio ni asumir que representa permiso. |
| 409 | Conservar el formulario, mostrar el mensaje seguro, refrescar solo la query que permita corregir el conflicto y permitir reintento. |
| 5xx, red o timeout | Mostrar el mensaje normalizado de `ApiError` mediante `ErrorState` o `FormError`; ofrecer retry cuando corresponda. |
| Cancelación | No mostrar un fallo al usuario salvo que la feature tenga una decisión explícita para ello. |

Un vacío es `EmptyState`, no un error. Un 403 no es un vacío. Los errores
persistentes de queries se renderizan con `ErrorState`, no con Sonner.

## Queries, invalidación y navegación

Las queries siguen siendo propiedad de la feature: adaptador `api`, factory de
keys serializables y hook que reenvía el `AbortSignal` de TanStack Query. Una
mutation invalida únicamente listas, detalles o contadores que haya afectado.

La navegación, el cierre de un diálogo y el reset de formulario se hacen solo
después de éxito. Ante un error se conservan los valores para permitir la
corrección. Cuando una página de detalle no encuentra el recurso, su segmento
puede usar `notFound()`; la UI no debe convertir un 404 en 403 ni viceversa.

## Límites de resiliencia y datos sensibles

`app/(dashboard)/error.tsx` cubre excepciones inesperadas de renderizado del
portal y permite recuperar con `reset`. Los errores esperados de formulario,
query y mutation no se lanzan al boundary: se manejan dentro de la feature.

No existe un proveedor de error tracking configurado. No agregue `console.log`,
`console.error` ni envíe a URLs, toasts o logs datos clínicos, valores de
formularios, contraseñas, tokens, diagnósticos o identificadores sensibles. Los
mensajes formalizados por `ApiClient` son los únicos que la interfaz puede
mostrar como feedback general.

No hay autosave ni protección global de cambios sin guardar. Antes de introducir
una advertencia local, use `form.formState.isDirty` y confirme el alcance de la
feature.
