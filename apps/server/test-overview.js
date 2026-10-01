const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const studentId = 1;
    const notes = await prisma.clinicalNote.findMany({
      where: { studentId, voidedAt: null },
      orderBy: [
        { sessionDate: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: 5,
    });
    console.log("Clinical notes:", notes.length);
  } catch (e) {
    console.error("Error in clinical notes:", e);
  }
  
  try {
    const studentId = 1;
    const biometrics = await prisma.biometricRecord.findFirst({
      where: { device: { studentId } },
      orderBy: [
        { timestamp: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
    console.log("Biometrics found:", !!biometrics);
  } catch (e) {
    console.error("Error in biometrics:", e);
  }
}

test().finally(() => prisma.$disconnect());
