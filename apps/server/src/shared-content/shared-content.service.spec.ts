import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SharedContentService } from './shared-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('SharedContentService', () => {
  let service: SharedContentService;
  let tx: {
    sharedPatientContent: { findUnique: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

  const CURRENT_USER = {
    id: 'therapist-uuid',
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      sharedPatientContent: { findUnique: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SharedContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(SharedContentService);
  });

  describe('findByStudent', () => {
    it('excludes revoked content', async () => {
      tx.sharedPatientContent.findMany.mockResolvedValue([]);

      await service.findByStudent(8);

      expect(tx.sharedPatientContent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 8, revokedAt: null },
        }) as unknown,
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the row does not exist', async () => {
      tx.sharedPatientContent.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the row has been revoked', async () => {
      tx.sharedPatientContent.findUnique.mockResolvedValue({
        id: 1,
        revokedAt: new Date(),
      });

      await expect(service.findOne(1, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('returns the row and logs a SHARED_CONTENT_VIEWED audit event', async () => {
      const row = { id: 1, revokedAt: null };
      tx.sharedPatientContent.findUnique.mockResolvedValue(row);

      const result = await service.findOne(1, CURRENT_USER);

      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: CURRENT_USER.id,
        institutionId: CURRENT_USER.institutionId,
        action: 'SHARED_CONTENT_VIEWED',
        entity: 'SharedPatientContent',
        entityId: '1',
      });
      expect(result).toEqual(row);
    });

    it('does not log when there is no current user', async () => {
      tx.sharedPatientContent.findUnique.mockResolvedValue({
        id: 1,
        revokedAt: null,
      });

      await service.findOne(1, undefined);

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});
