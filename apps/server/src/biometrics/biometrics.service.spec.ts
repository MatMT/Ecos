import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BiometricsService', () => {
  let service: BiometricsService;
  let tx: {
    bandDevice: { findMany: jest.Mock };
    biometricRecord: { findMany: jest.Mock; findFirst: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };

  beforeEach(async () => {
    tx = {
      bandDevice: { findMany: jest.fn() },
      biometricRecord: { findMany: jest.fn(), findFirst: jest.fn() },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };

    const module = await Test.createTestingModule({
      providers: [
        BiometricsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BiometricsService);
  });

  describe('findLatest', () => {
    it('throws NotFoundException when no record exists', async () => {
      tx.biometricRecord.findFirst.mockResolvedValue(null);

      await expect(service.findLatest(8)).rejects.toThrow(NotFoundException);
    });

    it('returns the latest record', async () => {
      tx.biometricRecord.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.findLatest(8)).resolves.toEqual({ id: 1 });
      expect(tx.biometricRecord.findFirst).toHaveBeenCalledWith({
        where: { device: { studentId: 8 } },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('findTrends', () => {
    it('buckets records by day and averages heart rate / stress level', async () => {
      tx.biometricRecord.findMany.mockResolvedValue([
        {
          timestamp: new Date('2026-01-01T08:00:00.000Z'),
          avgHeartRate: 70,
          stressLevel: 0.2,
        },
        {
          timestamp: new Date('2026-01-01T20:00:00.000Z'),
          avgHeartRate: 80,
          stressLevel: 0.4,
        },
        {
          timestamp: new Date('2026-01-02T08:00:00.000Z'),
          avgHeartRate: 90,
          stressLevel: null,
        },
      ]);

      const result = await service.findTrends(8, {
        from: '2026-01-01',
        to: '2026-01-03',
      });

      expect(result).toEqual([
        {
          date: '2026-01-01',
          avgHeartRate: 75,
          avgStressLevel: 0.3,
          sampleCount: 2,
        },
        {
          date: '2026-01-02',
          avgHeartRate: 90,
          avgStressLevel: null,
          sampleCount: 1,
        },
      ]);
    });

    it('returns an empty array when there are no records', async () => {
      tx.biometricRecord.findMany.mockResolvedValue([]);

      await expect(service.findTrends(8, {})).resolves.toEqual([]);
    });
  });
});
