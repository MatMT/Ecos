# Biometría

## Alcance de las fases 6.1 y 6.2

`/patients/[id]/biometrics` presenta exclusivamente datos biométricos sincronizados en `BiometricRecord`: frecuencia cardíaca promedio, índice de estrés y oxígeno en sangre. No representa monitoreo en tiempo real, conexión actual de un dispositivo, diagnóstico, rangos clínicos, alertas, anomalías, recomendaciones ni decisiones clínicas automatizadas.

La ruta exige `biometrics.view`, reutiliza `PatientWorkspace` y está disponible para psicología. El servidor permite al estudiante propietario o al psicólogo actualmente asignado; los administradores reciben `403` por la guardia de rol y un paciente inexistente o fuera del alcance RLS recibe `404`.

## API y privacidad

`GET /students/:studentId/biometrics?range&skip&take` recibe `skip` con mínimo cero, `take` entre uno y cien y el rango opcional `24h`, `7d`, `30d` o `90d`. Devuelve:

```ts
{
  latest: BiometricRecordListItem | null,
  data: BiometricRecordListItem[],
  meta: { skip, take, total, totalPages, institutionTimezone },
}
```

Cada elemento contiene únicamente `id`, `avgHeartRate`, `stressLevel`, `bloodOxygen`, `timestamp` y `createdAt`. No incluye identificador de banda, campos biométricos no presentados, diario emocional, alertas, contenido clínico o datos de institución adicionales. La consulta primero confirma la visibilidad del paciente y ejecuta la última fila, el conteo y la página dentro de la misma transacción RLS.

El rango filtra únicamente `data` y `meta`; `latest` conserva su significado de último registro global y no depende de la página ni del período. El orden estable es `timestamp` descendente con nulos al final, después `createdAt` e `id` descendentes. `timestamp` es el final de la ventana resumida sincronizada y se etiqueta como fecha y hora del registro; no es una señal de sincronización en vivo. Las fechas se formatean con `institutionTimezone`, con respaldo `America/El_Salvador`.

La fase 6.2 añade `GET /students/:studentId/biometrics/summary?range=24h|7d|30d|90d`. Su respuesta contiene el período efectivo, conteos de muestras, promedio, mínimo y máximo por métrica, y una serie ascendente de promedios. Agrupa `24h` por hora local institucional y los demás rangos por día local institucional. El filtro temporal es inclusivo en `from` y exclusivo en `to`; los valores ausentes permanecen `null` y se muestran como huecos, nunca como cero. La agregación ocurre en una consulta parametrizada dentro de la transacción RLS, por lo que el navegador no recibe el rango completo de registros.

El endpoint móvil existente `GET /students/:studentId/biometrics/trends?from&to` conserva su contrato de arreglo y ahora comparte la guardia de roles de psicología o estudiante. Todos los endpoints de lectura biométrica rechazan al administrador con `403`; un paciente inexistente o no visible sigue resolviéndose como `404` por RLS.

## Interfaz y caché

`biometricKeys` define `all`, `byPatient(patientId)`, `history(patientId, params)` y `summary(patientId, range)`. Ambos hooks reenvían el `AbortSignal` y usan `keepPreviousData`, de modo que una transición conserva la respuesta visible mientras se solicita la siguiente.

Los parámetros `page`, `take` y `range` se almacenan en la URL. El rango predeterminado es `7d`; un rango ausente o inválido se canoniza a `range=7d` y página uno. Cambiar rango o tamaño restablece la página uno; una página fuera de rango se corrige con los metadatos recibidos. La ausencia de registros es un estado vacío válido, sin valores cero inventados ni acción de creación. Métricas nulas muestran “Sin dato”; cero sigue siendo un valor válido.

La sección de tendencias presenta las tres métricas de manera descriptiva, con resumen textual accesible y gráficas lineales que no interpolan valores nulos. Una falla de tendencias tiene reintento propio y no oculta el historial ya disponible. No hay umbrales, colores de alerta, rangos de referencia, IA, persistencia local, sondeo ni selector de fechas personalizado.

No se escriben datos biométricos en consola, analítica, `localStorage` ni otro almacenamiento persistente del navegador.

## Índices y límites posteriores

No se añadió un índice ni migración en 6.2. La pila local de Supabase no estaba disponible para ejecutar `EXPLAIN (ANALYZE, BUFFERS)` sobre datos reales; ese análisis debe preceder cualquier decisión de índice `(device_id, timestamp)` en el entorno objetivo. Las alertas corresponden a fases 6.3–6.4; esta pantalla no infiere ni presenta estados de alerta.
## Integración con el overview del paciente

La Fase 6.5 reutiliza `GET /students/:id/overview`, no el historial ni el
summary por rango, para mostrar el último registro sincronizado en
`/patients/[id]`. La proyección contiene únicamente `avgHeartRate`,
`stressLevel`, `bloodOxygen`, `timestamp` e identificador. El bloque presenta
las métricas de forma descriptiva y enlaza a **Ver biometría**; no incorpora
gráficas, rangos, polling, estado de conexión ni interpretación clínica.
