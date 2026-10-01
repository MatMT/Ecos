# Expediente clínico longitudinal

## Alcance actual

La Fase 5.1 implementa `/patients/[id]/clinical-record` en `admin-web`. La ruta reutiliza `PatientWorkspace`, `PatientHeader` y `PatientSectionNav`; no incorpora historial de sesiones, notas clínicas, traspaso desde citas, borradores, eliminación ni autoguardado.

La navegación **Expediente** está disponible únicamente para el rol de psicología. **Sesiones** permanece fuera de alcance y no se expone como enlace funcional.

## Contrato y modelo

El cliente consume los contratos explícitos existentes:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/students/:studentId/clinical-record` | Consulta un expediente existente. |
| `POST` | `/students/:studentId/clinical-record` | Crea el primer expediente del paciente. |
| `PATCH` | `/students/:studentId/clinical-record` | Modifica el expediente existente. |

`ClinicalRecord.studentId` es único, por lo que un paciente tiene cero o un expediente. No existe `PUT` ni upsert y no se requiere una migración Prisma.

Los campos longitudinales son motivo inicial, historial psicológico, historial psiquiátrico, antecedentes familiares relevantes, tratamientos previos, medicación actual y observaciones generales. El contenido de sesiones y notas clínicas no se consulta ni se renderiza desde esta feature.

Al crear, los valores vacíos se omiten de la solicitud. Al editar, un campo vacío se envía como `null`, lo cual permite retirar de manera explícita información opcional ya registrada. El backend acepta `null` únicamente en `PATCH`.

## Estados de interfaz

Primero se consulta `usePatient` para confirmar que el paciente es visible. Un `404` de paciente utiliza Not Found. Después se consulta el expediente:

- Un `404` del expediente es un estado vacío y permite crearlo bajo `clinical-record.manage`.
- Un `403` muestra `ForbiddenState` integrado.
- Un error de red o de servidor muestra `ErrorState` con reintento.
- Un `409` durante la creación conserva los valores locales, vuelve a consultar el expediente y cambia a la vista de lectura si otro proceso lo creó.

La lectura es el estado inicial. La edición se inicia con **Editar expediente**, usa React Hook Form, Zod, `FormSection`, etiquetas visibles y errores asociados a cada campo. La fecha `updatedAt` se muestra como metadato; el contrato no expone ni la interfaz inventa un campo de autor de actualización.

## Cache

La feature define `clinicalRecordKeys.all`, `details()` y `byPatient(studentId)`. Las mutaciones de creación y actualización invalidan solo `clinicalRecordKeys.byPatient(studentId)`: el overview del paciente no consume datos del expediente y no debe recargarse por esta operación.

## Autorización y privacidad

La ruta requiere `clinical-record.view` y el backend exige el rol `psychologist`. RLS limita cada expediente al psicólogo asignado actualmente. Un administrador recibe denegación por rol (`403`); un psicólogo no asignado recibe `404` para no revelar la existencia del paciente o expediente.

Las operaciones de creación y actualización generan respectivamente `CLINICAL_RECORD_CREATED` y `CLINICAL_RECORD_UPDATED`. La auditoría registra solo identificadores, institución, acción y entidad; nunca texto clínico. La consulta existente conserva `CLINICAL_RECORD_VIEWED` con la misma frontera de privacidad.

## Limitaciones actuales

No se agregan catálogos diagnósticos o de medicación, contenido de actividades, datos de diario emocional, notas clínicas, sesiones, eliminación, autoguardado ni persistencia de borradores. Esas capacidades requieren fases posteriores y contratos específicos.
