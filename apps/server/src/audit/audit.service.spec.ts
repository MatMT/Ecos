import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let tx: { auditLog: { create: jest.Mock } };

  beforeEach(async () => {
    tx = { auditLog: { create: jest.fn() } };

    const module = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get(AuditService);
  });

  it('writes an audit row via the given transaction client', async () => {
    tx.auditLog.create.mockResolvedValue({ id: 1 });

    await service.log(tx as unknown as Prisma.TransactionClient, {
      userId: 'doctor-uuid',
      institutionId: 5,
      action: 'CLINICAL_NOTE_CREATED',
      entity: 'ClinicalNote',
      entityId: '31',
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'doctor-uuid',
        institutionId: 5,
        action: 'CLINICAL_NOTE_CREATED',
        entity: 'ClinicalNote',
        entityId: '31',
      },
    });
  });
});
