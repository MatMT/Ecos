const fs = require('fs');
const file = 'apps/admin-web/src/features/patients/components/patient-overview-blocks.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix encodings
content = content.replace(/Biometr\xEDa|Biometr\xC3\xADa|Biometra/g, 'Biometría');
content = content.replace(/\xC3\x9Altimos|ltimos/g, 'Últimos');
content = content.replace(/biom\xC3\xA9tricos|biomtricos/g, 'biométricos');
content = content.replace(/card\xC3\xADaca|cardaca/g, 'cardíaca');
content = content.replace(/estr\xC3\xA9s|estrs/g, 'estrés');
content = content.replace(/Ox\xC3\xADgeno|Oxgeno/g, 'Oxígeno');
content = content.replace(/Pr\xC3\xB3xima|Prxima/g, 'Próxima');
content = content.replace(/Duraci\xC3\xB3n|Duracin/g, 'Duración');
content = content.replace(/terap\xC3\xA9utico|teraputico|terap\u01F8utico/g, 'terapéutico');
content = content.replace(/l\xC3\xADmite|lmite|l\u00EDmite|l\uFFFDmite/g, 'límite');
content = content.replace(/cl\xC3\xADnicas|clnicas|cl\uFFFDnicas/g, 'clínicas');
content = content.replace(/\xC3\x8Dndice|ndice/g, 'Índice');
content = content.replace(/num\xC3\xA9rico|numrico/g, 'numérico');
content = content.replace(/t\xC3\xADtulo|ttulo|t\uFFFDtulo/g, 'título');
content = content.replace(/sesi\xC3\xB3n|sesin|sesi\uFFFDn/g, 'sesión');
content = content.replace(/A\xC3\xBAn|An|A\u01E7n/g, 'Aún');
content = content.replace(/Aplicaci\xC3\xB3n|Aplicacin|Aplicaci\uFFFDn/g, 'Aplicación');
content = content.replace(/m\xC3\xB3vil|mvil|m\uFFFDvil/g, 'móvil');
content = content.replace(/Bot\xC3\xB3n|Botn|Bot\uFFFDn/g, 'Botón');

// Ensure links
content = content.replace(
  /export function NextAppointment[\s\S]*?<OverviewSection icon=\{CalendarClock\} title="Próxima cita">/,
  `export function NextAppointment({ overview }: { overview: StudentOverview }) {
  const appointment = overview.nextAppointment
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.appointments(overview.student.id)}>Ver citas</Link>
        </Button>
      }
      icon={CalendarClock}
      title="Próxima cita">`
);

content = content.replace(
  /export function OpenAlerts[\s\S]*?<OverviewSection\s*actions=\{\s*<Button asChild size="sm" variant="link" className="h-auto p-0">\s*<Link href=\{patientRoutes.alerts\(overview.student.id\)\}>Ver alertas<\/Link>\s*<\/Button>\s*\}/,
  `export function OpenAlerts({ overview }: { overview: StudentOverview }) {
  const { institutionTimezone, alertsSummary } = overview
  const { openCount, recentAlerts } = alertsSummary
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.alerts(overview.student.id)}>Ver alertas</Link>
        </Button>
      }`
);

content = content.replace(
  /export function TreatmentPlan[\s\S]*?<OverviewSection icon=\{Stethoscope\} title="Plan terapéutico activo">/,
  `export function TreatmentPlan({ overview }: { overview: StudentOverview }) {
  const plan = overview.activeTreatmentPlan
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.treatmentPlan(overview.student.id)}>Ver plan</Link>
        </Button>
      }
      icon={Stethoscope}
      title="Plan terapéutico activo">`
);

content = content.replace(
  /export function PendingActivities[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{ClipboardList\}\s*title="Actividades pendientes"\s*>/m,
  `export function PendingActivities({ overview }: { overview: StudentOverview }) {
  const recentActivities = (overview.pendingActivities || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.activities(overview.student.id)}>Ver actividades</Link>
        </Button>
      }
      description={
        recentActivities.length > 0
          ? \`\${recentActivities.length} actividades recientes mostradas.\`
          : undefined
      }
      icon={ClipboardList}
      title="Actividades pendientes">`
);

content = content.replace(
  /export function RecentFollowUp[\s\S]*?<OverviewSection icon=\{FileText\} title="Seguimiento reciente">/,
  `export function RecentFollowUp({ overview }: { overview: StudentOverview }) {
  const recentFollowUps = (overview.recentFollowUps || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sessions(overview.student.id)}>Ver sesiones</Link>
        </Button>
      }
      icon={FileText}
      title="Seguimiento reciente">`
);

content = content.replace(
  /export function RecentSharedContent[\s\S]*?<OverviewSection icon=\{Share2\} title="Contenido compartido reciente">/,
  `export function RecentSharedContent({
  overview,
}: {
  overview: StudentOverview
}) {
  const recentContent = (overview.recentSharedContent || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sharedContent(overview.student.id)}>Ver contenido</Link>
        </Button>
      }
      icon={Share2}
      title="Contenido compartido reciente">`
);

fs.writeFileSync(file, content, 'utf8');
