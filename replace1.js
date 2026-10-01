const fs = require('fs');
const file = 'apps/admin-web/src/features/patients/components/patient-overview-blocks.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export function TreatmentPlan[\s\S]*?<CompactEmptyState message="Sin plan terap[^"]+activo." \/>\s*\)\s*\}\s*<\/OverviewSection>\s*\)/,
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
      title="Plan terapéutico activo"
    >
      {plan ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">
            {plan.title ?? "Plan terapéutico sin título"}
          </p>
          {plan.generalGoal ? (
            <p className="line-clamp-2 text-muted-foreground">
              {plan.generalGoal}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge {...getOverviewStatusPresentation(plan.status)} />
            <span className="text-xs text-muted-foreground">
              Inicio:{" "}
              {formatOverviewDate(plan.startsAt, overview.institutionTimezone)}
            </span>
          </div>
        </div>
      ) : (
        <CompactEmptyState message="Sin plan terapéutico activo." />
      )}
    </OverviewSection>
  )`
);

fs.writeFileSync(file, content, 'utf8');
