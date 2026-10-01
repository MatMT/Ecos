import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    take: 5,
    include: { student: true, doctor: true }
  });
  console.dir(appointments, { depth: null });
}

main().finally(() => prisma.$disconnect());
