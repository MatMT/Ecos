/**
 * Reusable demo-data seeder: populates a full, realistic ECOS ecosystem (institutions,
 * administrators, psychologists, students with profiles, band devices, biometric
 * records, alerts, appointments, clinical records/notes, treatment plans/goals,
 * activities and their assignments, emotional journal entries) for local testing — on a
 * fresh machine, or after wiping the DB.
 *
 * Idempotent by construction, not by flag: every seed row is tagged with a marker
 * (`[SEED]` institution name prefix, `@seed.ecos.local` user emails). Every run first
 * deletes anything matching those markers, then recreates the whole dataset fresh — so
 * running it twice, or running it after `prisma migrate reset`, both just work.
 *
 * Connects as the `postgres` superuser (DATABASE_URL) and calls GoTrue's Admin API
 * directly, the same way AuthService.adminCreateUser does — this is a dev-only tool,
 * never wired into application code.
 *
 * Usage: npx ts-node -r tsconfig-paths/register prisma/seed-demo.ts
 *        (or: pnpm run seed:demo)
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AlertType,
  AppointmentStatus,
  EmotionalState,
  EntryType,
  PrismaClient,
  Role,
} from '@prisma/client';

/** Matches schedules.service.ts's HH:mm <-> Date convention: @db.Time(0) columns always
 *  round-trip as a JS Date anchored at 1970-01-01 UTC. */
function timeOfDay(hours: number, minutes = 0): Date {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

const SEED_EMAIL_DOMAIN = 'seed.ecos.local';
const SEED_PASSWORD = 'Seed1234!';

const INSTITUTIONS = [
  { key: 'a', name: '[SEED] Colegio San Ignacio' },
  { key: 'b', name: '[SEED] Instituto Bilingüe Monteverde' },
];
const PSYCHOLOGISTS_PER_INSTITUTION = 2;
const STUDENTS_PER_INSTITUTION = 3;

const DIAGNOSES = [
  'Ansiedad generalizada',
  'Estrés académico',
  'Ninguno reportado',
];
const SPECIALTIES = ['Terapia cognitivo-conductual', 'Terapia familiar'];
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}

// ─── GoTrue Admin API helpers ─────────────────────────────────────────────────

const authUrl = process.env.SUPABASE_AUTH_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

async function goTrueAdmin<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${authUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `GoTrue ${method} ${path} failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

async function listAllGoTrueUsers(): Promise<{ id: string; email?: string }[]> {
  const all: { id: string; email?: string }[] = [];
  let page = 1;
  for (;;) {
    const result = await goTrueAdmin<{
      users: { id: string; email?: string }[];
    }>('GET', `/admin/users?page=${page}&per_page=200`);
    if (!result.users.length) break;
    all.push(...result.users);
    page += 1;
  }
  return all;
}

async function createGoTrueUser(email: string): Promise<string> {
  const user = await goTrueAdmin<{ id: string }>('POST', '/admin/users', {
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
  });
  return user.id;
}

// ─── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup(prisma: PrismaClient) {
  console.log('Cleaning up any previous seed data...');

  const institutions = await prisma.institution.findMany({
    where: { name: { in: INSTITUTIONS.map((i) => i.name) } },
  });
  const institutionIds = institutions.map((i) => i.id);

  if (institutionIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { institutionId: { in: institutionIds } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const devices = await prisma.bandDevice.findMany({
      where: { studentId: { in: profileIds } },
      select: { id: true },
    });
    const deviceIds = devices.map((d) => d.id);

    // Child -> parent, respecting ON DELETE RESTRICT on studentProfile.userId /
    // therapistAssignment.studentId|therapistId / psychologistProfile.userId /
    // therapistSchedule(Exception).therapistId.
    await prisma.clinicalNote.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.clinicalRecord.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.studentActivity.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.activity.deleteMany({
      where: { institutionId: { in: institutionIds } },
    });
    await prisma.treatmentGoal.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.treatmentPlan.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.appointment.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.alert.deleteMany({ where: { studentId: { in: profileIds } } });
    await prisma.emotionalJournal.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.biometricRecord.deleteMany({
      where: { deviceId: { in: deviceIds } },
    });
    await prisma.bandDevice.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await prisma.therapistAssignment.deleteMany({
      where: {
        OR: [
          { studentId: { in: profileIds } },
          { therapistId: { in: userIds } },
        ],
      },
    });
    await prisma.therapistScheduleException.deleteMany({
      where: { therapistId: { in: userIds } },
    });
    await prisma.therapistSchedule.deleteMany({
      where: { therapistId: { in: userIds } },
    });
    await prisma.psychologistProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.studentProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.institution.deleteMany({
      where: { id: { in: institutionIds } },
    });
  }

  // Also sweep GoTrue directly for any seed-domain user an earlier partial/failed run
  // might have left behind (their public.remote_users row may already be gone above).
  const goTrueUsers = await listAllGoTrueUsers();
  const orphaned = goTrueUsers.filter((u) =>
    u.email?.endsWith(`@${SEED_EMAIL_DOMAIN}`),
  );
  for (const user of orphaned) {
    await goTrueAdmin('DELETE', `/admin/users/${user.id}`);
  }
}

// ─── Seeding ────────────────────────────────────────────────────────────────────

async function createEcosUser(
  prisma: PrismaClient,
  email: string,
  fullName: string,
  role: Role,
  institutionId: number,
) {
  const id = await createGoTrueUser(email);
  return prisma.user.create({
    data: { id, email, fullName, role, institutionId },
  });
}

async function seedInstitution(
  prisma: PrismaClient,
  institutionKey: string,
  institutionName: string,
) {
  const institution = await prisma.institution.create({
    data: { name: institutionName },
  });

  const admin = await createEcosUser(
    prisma,
    `admin.${institutionKey}@${SEED_EMAIL_DOMAIN}`,
    `Admin ${institutionName.replace('[SEED] ', '')}`,
    Role.administrator,
    institution.id,
  );

  const psychologists = [];
  for (let i = 1; i <= PSYCHOLOGISTS_PER_INSTITUTION; i++) {
    const psychologist = await createEcosUser(
      prisma,
      `psychologist.${institutionKey}${i}@${SEED_EMAIL_DOMAIN}`,
      `Psic. Demo ${institutionKey.toUpperCase()}${i}`,
      Role.psychologist,
      institution.id,
    );
    await prisma.psychologistProfile.create({
      data: {
        userId: psychologist.id,
        professionalLicense: `[SEED]-${institutionKey.toUpperCase()}${i}`,
        specialty: SPECIALTIES[(i - 1) % SPECIALTIES.length],
        phone: '0000-0000',
      },
    });
    // Mon-Fri 08:00-16:00, so /psychologists/:id/availability has something to show —
    // without this, the availability engine returns [] for every seeded psychologist.
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      await prisma.therapistSchedule.create({
        data: {
          therapistId: psychologist.id,
          dayOfWeek,
          startTime: timeOfDay(8),
          endTime: timeOfDay(16),
          sessionDurationMinutes: 60,
        },
      });
    }
    psychologists.push(psychologist);
  }

  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        institutionId: institution.id,
        title: 'Diario de gratitud',
        instructions:
          'Escribe tres cosas por las que te sientas agradecido cada noche.',
      },
    }),
    prisma.activity.create({
      data: {
        institutionId: institution.id,
        title: 'Ejercicio de respiración',
        description: 'Respiración diafragmática guiada.',
        instructions:
          'Inhala en 4 segundos, sostén 4 segundos, exhala en 6 segundos. Repite 10 veces.',
      },
    }),
  ]);

  for (let i = 1; i <= STUDENTS_PER_INSTITUTION; i++) {
    const studentUser = await createEcosUser(
      prisma,
      `student.${institutionKey}${i}@${SEED_EMAIL_DOMAIN}`,
      `Estudiante Demo ${institutionKey.toUpperCase()}${i}`,
      Role.student,
      institution.id,
    );
    const assignedDoctor = psychologists[(i - 1) % psychologists.length];

    const profile = await prisma.studentProfile.create({
      data: {
        userId: studentUser.id,
        studentCode: `STU-${institutionKey.toUpperCase()}${i}`,
        primaryDiagnosis: DIAGNOSES[(i - 1) % DIAGNOSES.length],
        assignedDoctorId: assignedDoctor.id,
      },
    });

    // Keeps assignedDoctorId in sync with a real history row, matching the invariant
    // TherapistAssignmentsService enforces going forward (see AGENTS.md §11 / GOALS.md).
    await prisma.therapistAssignment.create({
      data: {
        studentId: profile.id,
        therapistId: assignedDoctor.id,
        isPrimary: true,
        startsAt: daysAgo(30),
        reason: '[SEED] Asignación inicial',
      },
    });

    const device = await prisma.bandDevice.create({
      data: {
        studentId: profile.id,
        deviceCode: `BAND-${institutionKey.toUpperCase()}${i}`,
        bindingStatus: true,
        lastSync: new Date(),
      },
    });

    let lastAnomalousRecordId: number | null = null;
    for (let d = 5; d >= 1; d--) {
      const isAnomalous = d === 2;
      const record = await prisma.biometricRecord.create({
        data: {
          deviceId: device.id,
          avgHeartRate: isAnomalous ? 128 : 74 + i,
          stressLevel: isAnomalous ? 0.87 : 0.32,
          sleepQualityHours: 6.5,
          bloodOxygen: 97,
          systolicBloodPressure: 118,
          diastolicBloodPressure: 76,
          bodyTemperature: 36.6,
          timestamp: daysAgo(d),
        },
      });
      if (isAnomalous) lastAnomalousRecordId = record.id;
    }

    await prisma.alert.create({
      data: {
        studentId: profile.id,
        biometricRecordId: lastAnomalousRecordId,
        alertType: AlertType.biometric_anomaly,
        description:
          'Frecuencia cardíaca elevada detectada durante horario de clases.',
        resolved: true,
      },
    });
    await prisma.alert.create({
      data: {
        studentId: profile.id,
        alertType: AlertType.ai_risk,
        description:
          'El asistente de IA detectó lenguaje de riesgo en una conversación reciente.',
        resolved: false,
      },
    });

    // Offset by student index so two students sharing the same doctor (there are more
    // students than psychologists per institution) never land on the exact same instant —
    // remote_appointments_no_doctor_overlap now rejects that outright.
    const pastDate = new Date(daysAgo(3).getTime() + i * 60 * 60 * 1000);
    const pastDuration = 60;
    const futureDate = new Date(daysFromNow(7).getTime() + i * 60 * 60 * 1000);
    const futureDuration = 60;

    const completedAppointment = await prisma.appointment.create({
      data: {
        studentId: profile.id,
        doctorId: assignedDoctor.id,
        sessionTitle: 'Sesión de seguimiento mensual',
        sessionType: 'Individual',
        appointmentDate: pastDate,
        endAt: new Date(pastDate.getTime() + pastDuration * 60 * 1000),
        durationMinutes: pastDuration,
        modality: 'in_person',
        createdById: admin.id,
        status: AppointmentStatus.completed,
      },
    });
    await prisma.appointment.create({
      data: {
        studentId: profile.id,
        doctorId: assignedDoctor.id,
        sessionTitle: 'Próxima sesión de seguimiento',
        sessionType: 'Individual',
        appointmentDate: futureDate,
        endAt: new Date(futureDate.getTime() + futureDuration * 60 * 1000),
        durationMinutes: futureDuration,
        modality: 'in_person',
        createdById: admin.id,
        status: AppointmentStatus.pending,
      },
    });

    await prisma.clinicalNote.create({
      data: {
        appointmentId: completedAppointment.id,
        doctorId: assignedDoctor.id,
        studentId: profile.id,
        sessionDiagnosis: DIAGNOSES[(i - 1) % DIAGNOSES.length],
        observedEmotionalState: EmotionalState.calm,
        observations:
          'El estudiante muestra progreso favorable desde la última sesión.',
        aiAssistantAnalysis:
          'Sin señales de riesgo detectadas en el análisis de la conversación.',
        sessionSummary:
          'Se revisó el progreso desde la sesión anterior y se reforzaron las estrategias de afrontamiento acordadas.',
        clinicalImpression: 'Evolución favorable, sin señales de alarma.',
        interventions: 'Técnicas de respiración y reestructuración cognitiva.',
        agreements:
          'El estudiante practicará los ejercicios de respiración diariamente.',
        followUpPlan: 'Continuar con sesiones mensuales de seguimiento.',
      },
    });

    await prisma.clinicalRecord.create({
      data: {
        studentId: profile.id,
        initialReason: 'Dificultades de concentración reportadas por el tutor.',
        psychologicalHistory: 'Sin antecedentes psicológicos previos relevantes.',
        psychiatricHistory: 'Ninguno reportado.',
        relevantFamilyHistory: 'Sin antecedentes familiares relevantes.',
        previousTreatments: 'Ninguno.',
        currentMedication: 'Ninguno.',
        generalObservations:
          'Estudiante colaborador, con buena disposición hacia el proceso terapéutico.',
      },
    });

    const plan = await prisma.treatmentPlan.create({
      data: {
        studentId: profile.id,
        therapistId: assignedDoctor.id,
        title: 'Plan de manejo de ansiedad',
        generalGoal:
          'Reducir la frecuencia e intensidad de los episodios de ansiedad.',
        startsAt: daysAgo(30),
      },
    });
    await prisma.treatmentGoal.create({
      data: {
        planId: plan.id,
        studentId: profile.id,
        description: 'Practicar respiración diafragmática dos veces al día.',
        status: 'in_progress',
      },
    });

    await prisma.studentActivity.create({
      data: {
        studentId: profile.id,
        activityId: activities[i % activities.length].id,
        therapistId: assignedDoctor.id,
        origin: 'psychologist',
        dueAt: daysFromNow(3),
      },
    });

    await prisma.emotionalJournal.create({
      data: {
        studentId: profile.id,
        entryType: EntryType.personal_journal,
        userContent:
          'Hoy me sentí un poco cansado, pero el día estuvo tranquilo.',
        detectedAlertLevel: 'low',
      },
    });
    await prisma.emotionalJournal.create({
      data: {
        studentId: profile.id,
        entryType: EntryType.ai_chat,
        userContent: 'Tuve un examen difícil hoy y no dormí bien anoche.',
        aiResponse:
          'Gracias por compartirlo. ¿Quieres contarme un poco más sobre cómo te sientes?',
        detectedAlertLevel: 'low',
      },
    });
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!/localhost|127\.0\.0\.1/.test(databaseUrl)) {
    throw new Error(
      'Refusing to run: DATABASE_URL does not look local. seed-demo.ts wipes and ' +
        'recreates seed data and must never run against a shared/production database.',
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await cleanup(prisma);

    console.log('Seeding demo ecosystem...');
    for (const institution of INSTITUTIONS) {
      await seedInstitution(prisma, institution.key, institution.name);
    }

    console.log('\nDone. All seed users share the password:', SEED_PASSWORD);
    console.log('Example logins:');
    for (const institution of INSTITUTIONS) {
      console.log(`  admin.${institution.key}@${SEED_EMAIL_DOMAIN}`);
      console.log(`  psychologist.${institution.key}1@${SEED_EMAIL_DOMAIN}`);
      console.log(`  student.${institution.key}1@${SEED_EMAIL_DOMAIN}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
