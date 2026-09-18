import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from './audit-actions';

interface LogParams {
  userId: string;
  institutionId: number | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  log(tx: Prisma.TransactionClient, params: LogParams) {
    return tx.auditLog.create({ data: params });
  }
}
