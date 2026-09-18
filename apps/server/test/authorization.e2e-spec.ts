import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, Role } from '@prisma/client';

jest.setTimeout(60000);

// Exercises real Postgres RLS via the `authenticator` role, mirroring
// PrismaService.withRls exactly — the existing *.service.spec.ts files mock withRls
// entirely and have never once caught an RLS bug (see apps/server/AGENTS.md §11 point 9,
// and the Phase 3/5 fixes regression-tested below).
type PostgresRole = 'anon' | 'authenticated' | 'service_role';

const EMAIL_DOMAIN = 'rls-test.ecos.local';
const PASSWORD = 'RlsTest1234!';
const INSTITUTION_PREFIX = '[RLS-TEST]';

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
    password: PASSWORD,
    email_confirm: true,
  });
  return user.id;
}

async function createEcosUser(
  postgres: PrismaClient,
  email: string,
  fullName: string,
  role: Role,
  institutionId: number,
) {
  const id = await createGoTrueUser(email);
  return postgres.user.create({
    data: { id, email, fullName, role, institutionId },
  });
}

interface Fixture {
  institutionA: { id: number };
  institutionB: { id: number };
  adminA: { id: string };
  psychA1: { id: string };
  psychA2: { id: string };
  studentA: { userId: string; profileId: number };
  // Dedicated to the reassignment/continuity-of-care tests, kept isolated so those
  // tests don't perturb assignedDoctorId for every other case in this file.
  studentA2: { userId: string; profileId: number };
  adminB: { id: string };
  psychB1: { id: string };
  studentB: { userId: string; profileId: number };
  alertA: { id: number };
  clinicalRecordA: { id: number };
  treatmentPlanA: { id: number };
  clinicalNoteA2: { id: number };
  alertActionA2: { id: number };
  sharedContentA: { id: number };
  activityGlobal: { id: number };
  activityInstitutionA: { id: number };
  emotionalJournalA: { id: number };
}

async function cleanup(postgres: PrismaClient) {
  const institutions = await postgres.institution.findMany({
    where: { name: { startsWith: INSTITUTION_PREFIX } },
  });
  const institutionIds = institutions.map((i) => i.id);

  if (institutionIds.length > 0) {
    const users = await postgres.user.findMany({
      where: { institutionId: { in: institutionIds } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const profiles = await postgres.studentProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const devices = await postgres.bandDevice.findMany({
      where: { studentId: { in: profileIds } },
      select: { id: true },
    });
    const deviceIds = devices.map((d) => d.id);

    await postgres.sharedPatientContent.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.emotionalJournal.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.alertAction.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.alert.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.clinicalNote.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.clinicalRecord.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.treatmentPlan.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.appointment.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.biometricRecord.deleteMany({
      where: { deviceId: { in: deviceIds } },
    });
    await postgres.bandDevice.deleteMany({
      where: { studentId: { in: profileIds } },
    });
    await postgres.activity.deleteMany({
      where: { title: { startsWith: INSTITUTION_PREFIX } },
    });
    await postgres.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await postgres.studentProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await postgres.user.deleteMany({ where: { id: { in: userIds } } });
    await postgres.institution.deleteMany({
      where: { id: { in: institutionIds } },
    });
  }

  const goTrueUsers = await listAllGoTrueUsers();
  const orphaned = goTrueUsers.filter((u) =>
    u.email?.endsWith(`@${EMAIL_DOMAIN}`),
  );
  for (const user of orphaned) {
    await goTrueAdmin('DELETE', `/admin/users/${user.id}`);
  }
}

async function seedFixture(postgres: PrismaClient): Promise<Fixture> {
  const institutionA = await postgres.institution.create({
    data: { name: `${INSTITUTION_PREFIX} Institution A` },
  });
  const institutionB = await postgres.institution.create({
    data: { name: `${INSTITUTION_PREFIX} Institution B` },
  });

  const adminA = await createEcosUser(
    postgres,
    `admin.a@${EMAIL_DOMAIN}`,
    'Admin A',
    Role.administrator,
    institutionA.id,
  );
  const psychA1 = await createEcosUser(
    postgres,
    `psych.a1@${EMAIL_DOMAIN}`,
    'Psych A1',
    Role.psychologist,
    institutionA.id,
  );
  const psychA2 = await createEcosUser(
    postgres,
    `psych.a2@${EMAIL_DOMAIN}`,
    'Psych A2',
    Role.psychologist,
    institutionA.id,
  );
  const studentAUser = await createEcosUser(
    postgres,
    `student.a@${EMAIL_DOMAIN}`,
    'Student A',
    Role.student,
    institutionA.id,
  );
  const studentAProfile = await postgres.studentProfile.create({
    data: {
      userId: studentAUser.id,
      studentCode: '[RLS-TEST]-A',
      assignedDoctorId: psychA1.id,
    },
  });
  const studentA2User = await createEcosUser(
    postgres,
    `student.a2@${EMAIL_DOMAIN}`,
    'Student A2',
    Role.student,
    institutionA.id,
  );
  const studentA2Profile = await postgres.studentProfile.create({
    data: {
      userId: studentA2User.id,
      studentCode: '[RLS-TEST]-A2',
      assignedDoctorId: psychA1.id,
    },
  });

  const adminB = await createEcosUser(
    postgres,
    `admin.b@${EMAIL_DOMAIN}`,
    'Admin B',
    Role.administrator,
    institutionB.id,
  );
  const psychB1 = await createEcosUser(
    postgres,
    `psych.b1@${EMAIL_DOMAIN}`,
    'Psych B1',
    Role.psychologist,
    institutionB.id,
  );
  const studentBUser = await createEcosUser(
    postgres,
    `student.b@${EMAIL_DOMAIN}`,
    'Student B',
    Role.student,
    institutionB.id,
  );
  const studentBProfile = await postgres.studentProfile.create({
    data: {
      userId: studentBUser.id,
      studentCode: '[RLS-TEST]-B',
      assignedDoctorId: psychB1.id,
    },
  });

  const device = await postgres.bandDevice.create({
    data: { studentId: studentAProfile.id, deviceCode: '[RLS-TEST]-DEVICE' },
  });
  await postgres.biometricRecord.create({
    data: { deviceId: device.id, avgHeartRate: 80, timestamp: new Date() },
  });

  const alertA = await postgres.alert.create({
    data: {
      studentId: studentAProfile.id,
      description: '[RLS-TEST] alert',
    },
  });

  const clinicalRecordA = await postgres.clinicalRecord.create({
    data: { studentId: studentAProfile.id, initialReason: '[RLS-TEST]' },
  });

  const treatmentPlanA = await postgres.treatmentPlan.create({
    data: {
      studentId: studentAProfile.id,
      therapistId: psychA1.id,
      title: '[RLS-TEST] plan',
    },
  });

  const appointmentA2 = await postgres.appointment.create({
    data: {
      studentId: studentA2Profile.id,
      doctorId: psychA1.id,
      sessionTitle: '[RLS-TEST] session',
    },
  });
  const clinicalNoteA2 = await postgres.clinicalNote.create({
    data: {
      appointmentId: appointmentA2.id,
      doctorId: psychA1.id,
      studentId: studentA2Profile.id,
      observations: '[RLS-TEST]',
    },
  });
  const alertA2 = await postgres.alert.create({
    data: {
      studentId: studentA2Profile.id,
      description: '[RLS-TEST] alert A2',
    },
  });
  const alertActionA2 = await postgres.alertAction.create({
    data: {
      alertId: alertA2.id,
      studentId: studentA2Profile.id,
      therapistId: psychA1.id,
      actionType: 'note',
    },
  });

  const sharedContentA = await postgres.sharedPatientContent.create({
    data: {
      studentId: studentAProfile.id,
      therapistId: psychA1.id,
      contentType: 'journal_entry',
      content: '[RLS-TEST] shared content',
    },
  });

  const activityGlobal = await postgres.activity.create({
    data: {
      institutionId: null,
      title: `${INSTITUTION_PREFIX} global activity`,
    },
  });
  const activityInstitutionA = await postgres.activity.create({
    data: {
      institutionId: institutionA.id,
      title: `${INSTITUTION_PREFIX} institution A activity`,
    },
  });

  const emotionalJournalA = await postgres.emotionalJournal.create({
    data: {
      studentId: studentAProfile.id,
      userContent: '[RLS-TEST] journal entry',
    },
  });

  return {
    institutionA: { id: institutionA.id },
    institutionB: { id: institutionB.id },
    adminA: { id: adminA.id },
    psychA1: { id: psychA1.id },
    psychA2: { id: psychA2.id },
    studentA: { userId: studentAUser.id, profileId: studentAProfile.id },
    studentA2: { userId: studentA2User.id, profileId: studentA2Profile.id },
    adminB: { id: adminB.id },
    psychB1: { id: psychB1.id },
    studentB: { userId: studentBUser.id, profileId: studentBProfile.id },
    alertA: { id: alertA.id },
    clinicalRecordA: { id: clinicalRecordA.id },
    treatmentPlanA: { id: treatmentPlanA.id },
    clinicalNoteA2: { id: clinicalNoteA2.id },
    alertActionA2: { id: alertActionA2.id },
    sharedContentA: { id: sharedContentA.id },
    activityGlobal: { id: activityGlobal.id },
    activityInstitutionA: { id: activityInstitutionA.id },
    emotionalJournalA: { id: emotionalJournalA.id },
  };
}

describe('Authorization (RLS) e2e', () => {
  let postgresPool: Pool;
  let appPool: Pool;
  let postgres: PrismaClient;
  let app: PrismaClient;
  let fixture: Fixture;

  function withRlsAs<T>(
    userId: string,
    role: PostgresRole,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return app.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config(
        'request.jwt.claims',
        ${JSON.stringify({ sub: userId, role })},
        true
      )`;
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
      return fn(tx);
    });
  }

  beforeAll(async () => {
    postgresPool = new Pool({ connectionString: process.env.DATABASE_URL });
    appPool = new Pool({ connectionString: process.env.APP_DATABASE_URL });
    postgres = new PrismaClient({ adapter: new PrismaPg(postgresPool) });
    app = new PrismaClient({ adapter: new PrismaPg(appPool) });

    await cleanup(postgres);
    fixture = await seedFixture(postgres);
  });

  afterAll(async () => {
    await cleanup(postgres);
    await postgres.$disconnect();
    await app.$disconnect();
    // @prisma/adapter-pg does not close a Pool it didn't create — end both explicitly,
    // or Jest reports an open TCP handle after the run.
    await postgresPool.end();
    await appPool.end();
  });

  describe('can_access_student_profile shape (self + assigned doctor + admin)', () => {
    it('remote_student_profiles: self, assigned doctor, and same-institution admin can read', async () => {
      const asSelf = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      const asAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      expect(asSelf).not.toBeNull();
      expect(asDoctor).not.toBeNull();
      expect(asAdmin).not.toBeNull();
    });

    it('remote_student_profiles: an unrelated psychologist and a different institution cannot read — no cross-tenant leak', async () => {
      const asUnrelated = await withRlsAs(
        fixture.psychA2.id,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      const asOtherInstitutionAdmin = await withRlsAs(
        fixture.adminB.id,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      const asOtherInstitutionDoctor = await withRlsAs(
        fixture.psychB1.id,
        'authenticated',
        (tx) =>
          tx.studentProfile.findUnique({
            where: { id: fixture.studentA.profileId },
          }),
      );
      expect(asUnrelated).toBeNull();
      expect(asOtherInstitutionAdmin).toBeNull();
      expect(asOtherInstitutionDoctor).toBeNull();
    });

    it('remote_alerts: self, assigned doctor, and same-institution admin can read', async () => {
      const asSelf = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.alert.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.alert.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.alert.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      expect(asSelf.length).toBeGreaterThan(0);
      expect(asDoctor.length).toBeGreaterThan(0);
      expect(asAdmin.length).toBeGreaterThan(0);
    });

    it('remote_alerts: an unrelated psychologist and a different institution cannot read', async () => {
      const asUnrelated = await withRlsAs(
        fixture.psychA2.id,
        'authenticated',
        (tx) =>
          tx.alert.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asOtherInstitutionAdmin = await withRlsAs(
        fixture.adminB.id,
        'authenticated',
        (tx) =>
          tx.alert.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      expect(asUnrelated).toHaveLength(0);
      expect(asOtherInstitutionAdmin).toHaveLength(0);
    });

    it('remote_alerts: an unrelated psychologist cannot insert an alert for the student', async () => {
      await expect(
        withRlsAs(fixture.psychA2.id, 'authenticated', (tx) =>
          tx.alert.create({
            data: {
              studentId: fixture.studentA.profileId,
              description: '[RLS-TEST] should be denied',
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('remote_biometric_records: assigned doctor can read, unrelated psychologist cannot', async () => {
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.biometricRecord.findMany({
            where: { device: { studentId: fixture.studentA.profileId } },
          }),
      );
      const asUnrelated = await withRlsAs(
        fixture.psychA2.id,
        'authenticated',
        (tx) =>
          tx.biometricRecord.findMany({
            where: { device: { studentId: fixture.studentA.profileId } },
          }),
      );
      expect(asDoctor.length).toBeGreaterThan(0);
      expect(asUnrelated).toHaveLength(0);
    });
  });

  describe('can_access_clinical_data shape (assigned doctor only, no self, no admin)', () => {
    it('remote_clinical_records: assigned doctor can read, self and admin cannot', async () => {
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.clinicalRecord.findUnique({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asSelf = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.clinicalRecord.findUnique({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.clinicalRecord.findUnique({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      expect(asDoctor).not.toBeNull();
      expect(asSelf).toBeNull();
      expect(asAdmin).toBeNull();
    });

    it('remote_treatment_plans: assigned doctor can read, unrelated psychologist cannot', async () => {
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.treatmentPlan.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      const asUnrelated = await withRlsAs(
        fixture.psychA2.id,
        'authenticated',
        (tx) =>
          tx.treatmentPlan.findMany({
            where: { studentId: fixture.studentA.profileId },
          }),
      );
      expect(asDoctor.length).toBeGreaterThan(0);
      expect(asUnrelated).toHaveLength(0);
    });
  });

  describe('Author-or-current-assigned shape (continuity of care)', () => {
    // Reassigns studentA2 from psychA1 (the note/action's original author) to psychA2,
    // proving each policy's "author OR current-assigned" OR-clause is doing real work —
    // not just coincidentally passing because author and assignee are the same person.
    beforeAll(async () => {
      await postgres.studentProfile.update({
        where: { id: fixture.studentA2.profileId },
        data: { assignedDoctorId: fixture.psychA2.id },
      });
    });

    it('remote_clinical_notes: original author keeps read access after reassignment', async () => {
      const asAuthor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.clinicalNote.findUnique({
            where: { id: fixture.clinicalNoteA2.id },
          }),
      );
      const asNewlyAssigned = await withRlsAs(
        fixture.psychA2.id,
        'authenticated',
        (tx) =>
          tx.clinicalNote.findUnique({
            where: { id: fixture.clinicalNoteA2.id },
          }),
      );
      expect(asAuthor).not.toBeNull();
      expect(asNewlyAssigned).not.toBeNull();
    });

    it('remote_clinical_notes: only the original author may update it, not the new assignee', async () => {
      await expect(
        withRlsAs(fixture.psychA1.id, 'authenticated', (tx) =>
          tx.clinicalNote.update({
            where: { id: fixture.clinicalNoteA2.id },
            data: { observations: '[RLS-TEST] updated by author' },
          }),
        ),
      ).resolves.toBeDefined();

      await expect(
        withRlsAs(fixture.psychA2.id, 'authenticated', (tx) =>
          tx.clinicalNote.update({
            where: { id: fixture.clinicalNoteA2.id },
            data: { observations: '[RLS-TEST] should be denied' },
          }),
        ),
      ).rejects.toThrow();
    });

    it('remote_alert_actions: original author keeps read access, unrelated psychologist does not', async () => {
      const asAuthor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.alertAction.findUnique({
            where: { id: fixture.alertActionA2.id },
          }),
      );
      const asUnrelated = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.alertAction.findMany({
            where: { studentId: fixture.studentA2.profileId },
          }),
      );
      expect(asAuthor).not.toBeNull();
      // No admin/self branch on alert_actions_select at all.
      expect(asUnrelated).toHaveLength(0);
    });
  });

  describe('Self-only write shape (remote_shared_patient_content)', () => {
    it('the owning student can insert their own shared content', async () => {
      const created = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.sharedPatientContent.create({
            data: {
              studentId: fixture.studentA.profileId,
              therapistId: fixture.psychA1.id,
              contentType: 'journal_entry',
              content: '[RLS-TEST] self-authored',
            },
          }),
      );
      expect(created.id).toBeDefined();
    });

    it('a student cannot impersonate another student when sharing content', async () => {
      await expect(
        withRlsAs(fixture.studentA.userId, 'authenticated', (tx) =>
          tx.sharedPatientContent.create({
            data: {
              studentId: fixture.studentA2.profileId,
              contentType: 'journal_entry',
              content: '[RLS-TEST] impersonation attempt',
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('self, the named therapist, and the current assigned doctor can read; the admin cannot', async () => {
      const asSelf = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.sharedPatientContent.findUnique({
            where: { id: fixture.sharedContentA.id },
          }),
      );
      const asNamedTherapist = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.sharedPatientContent.findUnique({
            where: { id: fixture.sharedContentA.id },
          }),
      );
      const asAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.sharedPatientContent.findUnique({
            where: { id: fixture.sharedContentA.id },
          }),
      );
      expect(asSelf).not.toBeNull();
      expect(asNamedTherapist).not.toBeNull();
      expect(asAdmin).toBeNull();
    });

    it('the owning student can revoke it, but cannot edit the immutable snapshot fields', async () => {
      await expect(
        withRlsAs(fixture.studentA.userId, 'authenticated', (tx) =>
          tx.sharedPatientContent.update({
            where: { id: fixture.sharedContentA.id },
            data: { revokedAt: new Date() },
          }),
        ),
      ).resolves.toBeDefined();

      await expect(
        withRlsAs(fixture.studentA.userId, 'authenticated', (tx) =>
          tx.sharedPatientContent.update({
            where: { id: fixture.sharedContentA.id },
            data: { content: '[RLS-TEST] tampered' },
          }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('Role + institution catalog shape (remote_activities)', () => {
    it('a global (institution-less) activity is visible to any psychologist or admin', async () => {
      const asOtherInstitutionAdmin = await withRlsAs(
        fixture.adminB.id,
        'authenticated',
        (tx) =>
          tx.activity.findUnique({ where: { id: fixture.activityGlobal.id } }),
      );
      expect(asOtherInstitutionAdmin).not.toBeNull();
    });

    it('an institution-scoped activity is visible only within that institution', async () => {
      const asSameInstitution = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.activity.findUnique({
            where: { id: fixture.activityInstitutionA.id },
          }),
      );
      const asOtherInstitution = await withRlsAs(
        fixture.psychB1.id,
        'authenticated',
        (tx) =>
          tx.activity.findUnique({
            where: { id: fixture.activityInstitutionA.id },
          }),
      );
      const asStudent = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.activity.findUnique({
            where: { id: fixture.activityInstitutionA.id },
          }),
      );
      expect(asSameInstitution).not.toBeNull();
      expect(asOtherInstitution).toBeNull();
      expect(asStudent).toBeNull();
    });

    it('only an administrator can insert, and only into their own institution', async () => {
      await expect(
        withRlsAs(fixture.psychA1.id, 'authenticated', (tx) =>
          tx.activity.create({
            data: {
              institutionId: fixture.institutionA.id,
              title: '[RLS-TEST] psychologist attempt',
            },
          }),
        ),
      ).rejects.toThrow();

      await expect(
        withRlsAs(fixture.adminA.id, 'authenticated', (tx) =>
          tx.activity.create({
            data: {
              institutionId: fixture.institutionB.id,
              title: '[RLS-TEST] cross-institution attempt',
            },
          }),
        ),
      ).rejects.toThrow();

      const created = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.activity.create({
            data: {
              institutionId: fixture.institutionA.id,
              title: '[RLS-TEST] admin-created activity',
            },
          }),
      );
      expect(created.id).toBeDefined();
    });
  });

  describe('Regression: Phase 5 alert-admin-exclusion fix', () => {
    it('remote_alerts UPDATE denies an admin but allows the assigned doctor', async () => {
      await expect(
        withRlsAs(fixture.adminA.id, 'authenticated', (tx) =>
          tx.alert.update({
            where: { id: fixture.alertA.id },
            data: { resolved: true },
          }),
        ),
      ).rejects.toThrow();

      await expect(
        withRlsAs(fixture.psychA1.id, 'authenticated', (tx) =>
          tx.alert.update({
            where: { id: fixture.alertA.id },
            data: { resolved: true },
          }),
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('Regression: Phase 3 audit-log INSERT...RETURNING self-visibility fix', () => {
    it('a non-admin actor can insert an audit row and read it back', async () => {
      const created = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.auditLog.create({
            data: {
              userId: fixture.psychA1.id,
              institutionId: fixture.institutionA.id,
              action: 'CLINICAL_NOTE_CREATED',
              entity: 'ClinicalNote',
              entityId: String(fixture.clinicalNoteA2.id),
            },
          }),
      );
      expect(created.id).toBeDefined();

      const readBack = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) => tx.auditLog.findUnique({ where: { id: created.id } }),
      );
      expect(readBack).not.toBeNull();

      const asSameInstitutionAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) => tx.auditLog.findUnique({ where: { id: created.id } }),
      );
      expect(asSameInstitutionAdmin).not.toBeNull();

      const asOtherInstitutionAdmin = await withRlsAs(
        fixture.adminB.id,
        'authenticated',
        (tx) => tx.auditLog.findUnique({ where: { id: created.id } }),
      );
      expect(asOtherInstitutionAdmin).toBeNull();
    });
  });

  describe('Regression: Phase 8 EmotionalJournal self-only narrowing', () => {
    it('remote_emotional_journal: only the student themselves can read their entries', async () => {
      const asSelf = await withRlsAs(
        fixture.studentA.userId,
        'authenticated',
        (tx) =>
          tx.emotionalJournal.findUnique({
            where: { id: fixture.emotionalJournalA.id },
          }),
      );
      expect(asSelf).not.toBeNull();
    });

    it('remote_emotional_journal: the assigned doctor and an institution admin are both denied', async () => {
      const asDoctor = await withRlsAs(
        fixture.psychA1.id,
        'authenticated',
        (tx) =>
          tx.emotionalJournal.findUnique({
            where: { id: fixture.emotionalJournalA.id },
          }),
      );
      const asAdmin = await withRlsAs(
        fixture.adminA.id,
        'authenticated',
        (tx) =>
          tx.emotionalJournal.findUnique({
            where: { id: fixture.emotionalJournalA.id },
          }),
      );
      expect(asDoctor).toBeNull();
      expect(asAdmin).toBeNull();
    });
  });

  describe('Regression: unauthenticated (anon) role never has a fallback path into patient data', () => {
    // The `anon` Postgres role has full table-level grants everywhere (Supabase's own
    // ALTER DEFAULT PRIVILEGES applies them regardless of our own GRANT statements —
    // apps/server/AGENTS.md §11 point 2). Every app_private helper function this table's
    // policy depends on revokes EXECUTE from anon, so an anonymous caller can't even
    // evaluate the policy — confirmed here as a hard rejection, not just an empty result.
    it('remote_student_profiles: anon cannot query at all, authenticated-but-unassigned still sees nothing', async () => {
      await expect(
        withRlsAs(fixture.studentA.userId, 'anon', (tx) =>
          tx.studentProfile.findMany({
            where: { id: fixture.studentA.profileId },
          }),
        ),
      ).rejects.toThrow();
    });
  });
});
