const fs = require('fs');
const file = 'apps/admin-web/src/features/patients/components/patient-overview-blocks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export function NextAppointment[\s\S]*?<OverviewSection icon=\{CalendarClock\} title="Pr[^"]+cita">/,
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
  /export function TreatmentPlan[\s\S]*?<OverviewSection icon=\{Stethoscope\} title="Plan[^"]+utico">/,
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
      title="Plan terapéutico">`
);

content = content.replace(
  /export function RecentFollowUp[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{FileText\}\s*title="[^"]+cl[^"]+nicas"\s*>/m,
  `export function RecentFollowUp({ overview }: { overview: StudentOverview }) {
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
          ? \`\${recentFollowUps.length} notas recientes mostradas.\`
          : undefined
      }
      icon={FileText}
      title="Últimas notas clínicas">`
);

content = content.replace(
  /export function RecentSharedContent[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{Share2\}\s*title="Contenido compartido"\s*>/m,
  `export function RecentSharedContent({ overview }: { overview: StudentOverview }) {
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
          ? \`\${recentContent.length} elementos recientes mostrados.\`
          : undefined
      }
      icon={Share2}
      title="Contenido compartido">`
);

fs.writeFileSync(file, content, 'utf8');
