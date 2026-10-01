# Alertas

## Propósito

`/patients/[id]/alerts` muestra el historial de entidades `Alert` realmente persistidas para un paciente visible. Una alerta no equivale a una notificación: representa un evento almacenado, no un canal de entrega ni una promesa de tiempo real.

La ruta requiere `alerts.view`, reutiliza `PatientWorkspace` y se habilita únicamente para psicología. El servidor devuelve `403` para administradores mediante guardia de rol y `404` para un paciente inexistente o no visible al psicólogo mediante RLS.

## Fuente móvil actual

El único productor activo confirmado es el modal SOS de mobile. Tras confirmación, envía `POST /api/v1/alerts` con `alertType: panic_button`, `priority: critical`, `biometricRecordId: null` y un `contextSummary` sensible. El servidor resuelve el paciente desde la sesión del estudiante, persiste la alerta con estado `new` y conserva el texto contextual fuera del listado clínico.

`biometric_anomaly` y `ai_risk` son valores reales del enum `AlertType`, pero no tienen un productor activo. La interfaz puede representar una alerta existente con esos tipos sin presentarlos como funcionalidades automáticas activas.

## API, filtros y privacidad

`GET /students/:studentId/alerts?skip&take&status&alertType&priority` devuelve:

```ts
{
  data: AlertListItem[],
  meta: { skip, take, total, totalPages, institutionTimezone },
}
```

`skip` tiene mínimo cero y `take` admite de uno a cien. Los filtros opcionales usan exclusivamente los enums almacenados: estados `new`, `reviewed`, `in_follow_up`, `closed`; tipos `panic_button`, `biometric_anomaly`, `ai_risk`; y prioridades `low`, `medium`, `high`, `critical`.

Cada elemento incluye solo `id`, `alertType`, `priority`, `status`, `createdAt`, `reviewedAt` y `closedAt`. No expone descripción, `contextSummary`, identificadores biométricos, acciones, relaciones de paciente/profesional ni auditoría. El servidor verifica primero `StudentProfile` y consulta conteo/página en la misma transacción RLS, con orden estable `createdAt DESC, id DESC`.

El endpoint legado `GET /alerts` conserva su arreglo completo para la aplicación móvil y no debe usarse como historial del panel.

## Interfaz y caché

`alertKeys` define `all`, `byPatient(patientId)`, `list(patientId, params)` y `detail(patientId, alertId)`. `usePatientAlerts` reenvía `AbortSignal` y usa `keepPreviousData` durante cambios de página y filtros.

`page`, `take`, `status`, `alertType` y `priority` viven en la URL. Los filtros vacíos o inválidos se eliminan y cambian a página uno; no existe estado global, almacenamiento persistente, búsqueda textual ni selector de fechas.

El listado es una línea de tiempo semántica y responsive. `panic_button` se muestra como **SOS / Botón de pánico**; estado y prioridad usan texto más `StatusBadge`. No muestra contexto SOS ni datos biométricos. Un historial vacío y una búsqueda sin coincidencias son estados distintos, ambos sin inferir que el paciente se encuentra bien.

## Detalle y ciclo de vida

`/patients/[id]/alerts/[alertId]` reutiliza `PatientWorkspace`, conserva **Alertas** como navegación activa y añade un breadcrumb descriptivo basado en el tipo y fecha de la alerta, nunca en su identificador o texto sensible. El historial ofrece **Ver alerta** para los usuarios con `alerts.view`.

El portal obtiene el detalle mediante `GET /students/:studentId/alerts/:alertId`. El contrato comprueba primero el paciente y la relación alerta-paciente dentro de la transacción RLS. Un administrador recibe `403`; un psicólogo sin acceso vigente, un paciente no visible, una alerta inexistente o una URL con otro paciente reciben `404` para evitar enumeración.

El detalle autorizado incluye únicamente el contexto mínimo del espacio de paciente, tipo, prioridad, estado, descripción, `contextSummary`, fechas y resúmenes de quien revisó o cerró. `closedBy` se deriva de la acción terminal `closed`; no existe una columna independiente para ese actor. No devuelve relaciones biométricas, comentarios de acciones, auditorías ni otros recursos clínicos.

La máquina de estados efectiva es:

```text
new → reviewed → in_follow_up → closed
```

`PATCH /alerts/:id/review` solo admite `new`; `PATCH /alerts/:id/close` admite `reviewed` e `in_follow_up`. Ambas operaciones realizan una escritura condicional sobre el estado actual, por lo que una transición concurrente responde `409`. El servidor establece fechas y actores, crea la acción append-only correspondiente y escribe `ALERT_REVIEWED` o `ALERT_CLOSED` con metadata de identificadores, sin copiar texto SOS ni comentarios.

La interfaz no aplica actualizaciones optimistas. Tras revisar o cerrar invalida `alertKeys.byPatient(patientId)` y `patientKeys.overview(patientId)`; el historial, detalle y alertas abiertas se vuelven a consultar. El cierre requiere confirmación, conserva la página de detalle y no permite reapertura ni eliminación.

`panic_button` se presenta como **SOS / Botón de pánico** con origen **Aplicación móvil / Botón SOS**, porque es el productor verificado. Los demás tipos se muestran como valores registrados, sin afirmar que exista un motor biométrico o IA activo.

## Resumen en Patient Overview

La Fase 6.5 incorpora `alertsSummary` dentro del mismo overview del paciente.
El servidor calcula `openCount` sobre `new`, `reviewed` e `in_follow_up` y
devuelve como máximo tres alertas recientes, ordenadas por creación e
identificador descendentes. Los resúmenes solo contienen identificador, tipo,
prioridad, estado y fecha; no exponen descripción ni `contextSummary`.

El overview muestra el conteo exacto, tipo, estado, prioridad real cuando
existe y fecha. Enlaza al historial y al detalle autorizado, pero nunca revisa
ni cierra alertas desde la ficha. Las mutaciones de detalle ya invalidan
`patientKeys.overview(patientId)`, por lo que el conteo se actualiza en la
siguiente consulta sin polling ni actualización optimista.

## Estado y límites

La Fase 6.4 no añade una interfaz genérica para registrar acciones, acciones masivas, alertas biométricas automáticas, GREEN/YELLOW/RED, contadores de anomalías, ExecuTorch, generación o detección mediante IA, push, correo electrónico, SMS, WebSocket, SSE, polling, almacenamiento del navegador ni notificaciones del navegador. Alert permanece separado de Notification.
