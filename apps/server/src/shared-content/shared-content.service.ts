import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class SharedContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findByStudent(studentId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.sharedPatientContent.findMany({
        where: { studentId, revokedAt: null },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { sharedAt: 'desc' },
      }),
    );
  }

  findOne(id: number, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      const row = await tx.sharedPatientContent.findUnique({ where: { id } });
      if (!row || row.revokedAt) {
        throw new NotFoundException(
          'No se ha encontrado el contenido compartido solicitado.',
        );
      }

      if (currentUser) {
        await this.auditService.log(tx, {
          userId: currentUser.id,
          institutionId: currentUser.institutionId,
          action: 'SHARED_CONTENT_VIEWED',
          entity: 'SharedPatientContent',
          entityId: String(id),
        });
      }

      return row;
    });
  }
}
