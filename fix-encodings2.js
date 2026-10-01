const fs = require('fs');
const file = 'apps/admin-web/src/features/patients/components/patient-overview-blocks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Biometr\xEDa/g, 'Biometría');
content = content.replace(/Biometr\xC3\xADa/g, 'Biometría');
content = content.replace(/Biometra/g, 'Biometría');

content = content.replace(/\xC3\x9Altimos/g, 'Últimos');
content = content.replace(/ltimos/g, 'Últimos');
content = content.replace(/biom\xC3\xA9tricos/g, 'biométricos');
content = content.replace(/biomtricos/g, 'biométricos');

content = content.replace(/card\xC3\xADaca/g, 'cardíaca');
content = content.replace(/cardaca/g, 'cardíaca');

content = content.replace(/estr\xC3\xA9s/g, 'estrés');
content = content.replace(/estrs/g, 'estrés');

content = content.replace(/Ox\xC3\xADgeno/g, 'Oxígeno');
content = content.replace(/Oxgeno/g, 'Oxígeno');

content = content.replace(/Pr\xC3\xB3xima/g, 'Próxima');
content = content.replace(/Prxima/g, 'Próxima');

content = content.replace(/Duraci\xC3\xB3n/g, 'Duración');
content = content.replace(/Duracin/g, 'Duración');

content = content.replace(/terap\xC3\xA9utico/g, 'terapéutico');
content = content.replace(/teraputico/g, 'terapéutico');

content = content.replace(/l\xC3\xADmite/g, 'límite');
content = content.replace(/lmite/g, 'límite');

content = content.replace(/cl\xC3\xADnicas/g, 'clínicas');
content = content.replace(/clnicas/g, 'clínicas');

content = content.replace(/\xC3\x8Dndice/g, 'Índice');
content = content.replace(/ndice/g, 'Índice');

content = content.replace(/num\xC3\xA9rico/g, 'numérico');
content = content.replace(/numrico/g, 'numérico');

content = content.replace(
  /export function NextAppointment[\s\S]*?<OverviewSection icon=\{CalendarClock\} title="Pr[^"]+cita">/,
  "export function NextAppointment({ overview }: { overview: StudentOverview }) {\n  const appointment = overview.nextAppointment\n  return (\n    <OverviewSection\n      actions={\n        <Button asChild size=\"sm\" variant=\"link\" className=\"h-auto p-0\">\n          <Link href={patientRoutes.appointments(overview.student.id)}>Ver citas</Link>\n        </Button>\n      }\n      icon={CalendarClock}\n      title=\"Próxima cita\">"
);

content = content.replace(
  /export function TreatmentPlan[\s\S]*?<OverviewSection icon=\{Stethoscope\} title="Plan[^"]+utico activo">/,
  "export function TreatmentPlan({ overview }: { overview: StudentOverview }) {\n  const plan = overview.activeTreatmentPlan\n  return (\n    <OverviewSection\n      actions={\n        <Button asChild size=\"sm\" variant=\"link\" className=\"h-auto p-0\">\n          <Link href={patientRoutes.treatmentPlan(overview.student.id)}>Ver plan</Link>\n        </Button>\n      }\n      icon={Stethoscope}\n      title=\"Plan terapéutico activo\">"
);

content = content.replace(
  /export function PendingActivities[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{ClipboardList\}\s*title="Actividades pendientes"\s*>/m,
  "export function PendingActivities({ overview }: { overview: StudentOverview }) {\n  const recentActivities = (overview.pendingActivities || []).slice(0, MAX_RECENT_ITEMS)\n  return (\n    <OverviewSection\n      actions={\n        <Button asChild size=\"sm\" variant=\"link\" className=\"h-auto p-0\">\n          <Link href={patientRoutes.activities(overview.student.id)}>Ver actividades</Link>\n        </Button>\n      }\n      description={\n        recentActivities.length > 0\n          ? ${recentActivities.length} actividades recientes mostradas.\n          : undefined\n      }\n      icon={ClipboardList}\n      title=\"Actividades pendientes\">"
);

content = content.replace(
  /export function RecentFollowUp[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{FileText\}\s*title="[^"]+notas cl[^"]+nicas"\s*>/m,
  "export function RecentFollowUp({ overview }: { overview: StudentOverview }) {\n  const recentFollowUps = (overview.recentFollowUps || []).slice(0, MAX_RECENT_ITEMS)\n  return (\n    <OverviewSection\n      actions={\n        <Button asChild size=\"sm\" variant=\"link\" className=\"h-auto p-0\">\n          <Link href={patientRoutes.sessions(overview.student.id)}>Ver sesiones</Link>\n        </Button>\n      }\n      description={\n        recentFollowUps.length > 0\n          ? ${recentFollowUps.length} notas recientes mostradas.\n          : undefined\n      }\n      icon={FileText}\n      title=\"Últimas notas clínicas\">"
);

content = content.replace(
  /export function RecentSharedContent[\s\S]*?<OverviewSection\s*description=\{[^}]+\}\s*icon=\{Share2\}\s*title="Contenido compartido"\s*>/m,
  "export function RecentSharedContent({ overview }: { overview: StudentOverview }) {\n  const recentContent = (overview.recentSharedContent || []).slice(0, MAX_RECENT_ITEMS)\n  return (\n    <OverviewSection\n      actions={\n        <Button asChild size=\"sm\" variant=\"link\" className=\"h-auto p-0\">\n          <Link href={patientRoutes.sharedContent(overview.student.id)}>Ver contenido</Link>\n        </Button>\n      }\n      description={\n        recentContent.length > 0\n          ? ${recentContent.length} elementos recientes mostrados.\n          : undefined\n      }\n      icon={Share2}\n      title=\"Contenido compartido\">"
);

fs.writeFileSync(file, content, 'utf8');
