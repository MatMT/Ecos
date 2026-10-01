const fs = require('fs');
const file = 'apps/admin-web/src/features/patients/components/patient-overview-blocks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Biometra/g, 'Biometría');
content = content.replace(/BiometrÃ­a/g, 'Biometría');
content = content.replace(/Ãšltimos/g, 'Últimos');
content = content.replace(/ltimos/g, 'Últimos');
content = content.replace(/biomÃ©tricos/g, 'biométricos');
content = content.replace(/biomtricos/g, 'biométricos');
content = content.replace(/cardÃ­aca/g, 'cardíaca');
content = content.replace(/cardaca/g, 'cardíaca');
content = content.replace(/estrÃ©s/g, 'estrés');
content = content.replace(/estrs/g, 'estrés');
content = content.replace(/OxÃ­geno/g, 'Oxígeno');
content = content.replace(/Oxgeno/g, 'Oxígeno');
content = content.replace(/PrÃ³xima/g, 'Próxima');
content = content.replace(/Prxima/g, 'Próxima');
content = content.replace(/DuraciÃ³n/g, 'Duración');
content = content.replace(/Duracin/g, 'Duración');
content = content.replace(/terapÃ©utico/g, 'terapéutico');
content = content.replace(/teraputico/g, 'terapéutico');
content = content.replace(/lÃ­mite/g, 'límite');
content = content.replace(/lmite/g, 'límite');
content = content.replace(/clÃ­nicas/g, 'clínicas');
content = content.replace(/clnicas/g, 'clínicas');
content = content.replace(/Ã ndice/g, 'Índice');
content = content.replace(/ndice/g, 'Índice');
content = content.replace(/numÃ©rico/g, 'numérico');
content = content.replace(/numrico/g, 'numérico');
content = content.replace(/Biometra/g, 'Biometría');

// Apply the links too!
content = content.replace(
  /export function NextAppointment[\s\S]*?<OverviewSection icon=\{CalendarClock\} title="Pr[^"]+cita">/,
  \export function NextAppointment({ overview }: { overview: StudentOverview }) {
  const appointment = overview.nextAppointment
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.appointments(overview.student.id)}>Ver citas</Link>
        </Button>
      }
      icon={CalendarClock}
      title="Próxima cita">\
);

content = content.replace(
  /export function TreatmentPlan[\s\S]*?<OverviewSection icon=\{Stethoscope\} title="Plan[^"]+utico activo">/,
  \export function TreatmentPlan({ overview }: { overview: StudentOverview }) {
  const plan = overview.activeTreatmentPlan
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.treatmentPlan(overview.student.id)}>Ver plan</Link>
        </Button>
      }
      icon={Stethoscope}
      title="Plan terapéutico activo">\
);

content = content.replace(
  /export function PendingActivities[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{ClipboardList\}\s*title="Actividades pendientes"\s*>/m,
  \export function PendingActivities({ overview }: { overview: StudentOverview }) {
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
          ? \\\\$\\{recentActivities.length\\} actividades recientes mostradas.\\\
          : undefined
      }
      icon={ClipboardList}
      title="Actividades pendientes">\
);

content = content.replace(
  /export function RecentFollowUp[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{FileText\}\s*title="[^"]+notas cl[^"]+nicas"\s*>/m,
  \export function RecentFollowUp({ overview }: { overview: StudentOverview }) {
  const recentFollowUps = (overview.recentFollowUps || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sessions(overview.student.id)}>Ver sesiones</Link>
        </Button>
      }
      description={
        recentFollowUps.length > 0
          ? \\\\$\\{recentFollowUps.length\\} notas recientes mostradas.\\\
          : undefined
      }
      icon={FileText}
      title="Últimas notas clínicas">\
);

content = content.replace(
  /export function RecentSharedContent[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{Share2\}\s*title="Contenido compartido"\s*>/m,
  \export function RecentSharedContent({ overview }: { overview: StudentOverview }) {
  const recentContent = (overview.recentSharedContent || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sharedContent(overview.student.id)}>Ver contenido</Link>
        </Button>
      }
      description={
        recentContent.length > 0
          ? \\\\$\\{recentContent.length\\} elementos recientes mostrados.\\\
          : undefined
      }
      icon={Share2}
      title="Contenido compartido">\
);

fs.writeFileSync(file, content, 'utf8');
