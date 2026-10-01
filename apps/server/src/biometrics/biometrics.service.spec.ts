import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BiometricsService', () => {
  let service: BiometricsService;
  let tx: {
    $queryRaw: jest.Mock;
    bandDevice: { findMany: jest.Mock };
    biometricRecord: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    studentProfile: { findUnique: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };

  beforeEach(async () => {
    tx = {
      $queryRaw: jest.fn(),
      bandDevice: { findMany: jest.fn() },
      biometricRecord: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      studentProfile: { findUnique: jest.fn() },
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

  describe('findRecords', () => {
    it('returns a minimized paginated envelope with an independent latest record', async () => {
      const latest = {
        id: 9,
        avgHeartRate: null,
        stressLevel: 0,
        bloodOxygen: 98,
        timestamp: new Date('2026-09-30T10:00:00.000Z'),
        createdAt: new Date('2026-09-30T10:01:00.000Z'),
      };
      const pageRecord = {
        id: 8,
        avgHeartRate: 72,
        stressLevel: null,
        bloodOxygen: null,
        timestamp: new Date('2026-09-29T10:00:00.000Z'),
        createdAt: new Date('2026-09-29T10:01:00.000Z'),
      };
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: { timezone: 'America/Guatemala' } },
      });
      tx.biometricRecord.findFirst.mockResolvedValue(latest);
      tx.biometricRecord.findMany.mockResolvedValue([pageRecord]);
      tx.biometricRecord.count.mockResolvedValue(41);

      await expect(
        service.findRecords(8, { skip: 20, take: 20 }),
      ).resolves.toEqual({
        latest,
        data: [pageRecord],
        meta: {
          skip: 20,
          take: 20,
          total: 41,
          totalPages: 3,
          institutionTimezone: 'America/Guatemala',
        },
      });

      expect(tx.biometricRecord.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { timestamp: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          select: {
            id: true,
            avgHeartRate: true,
            stressLevel: true,
            bloodOxygen: true,
            timestamp: true,
            createdAt: true,
          },
        }),
      );
      expect(tx.biometricRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { timestamp: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          skip: 20,
          take: 20,
        }),
      );
      expect(tx.biometricRecord.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          device: { studentId: 8 },
          timestamp: expect.objectContaining({ gte: expect.any(Date), lt: expect.any(Date) }),
        }),
      });
    });

    it('returns an empty history and a fallback institution timezone', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: null },
      });
      tx.biometricRecord.findFirst.mockResolvedValue(null);
      tx.biometricRecord.findMany.mockResolvedValue([]);
      tx.biometricRecord.count.mockResolvedValue(0);

      await expect(service.findRecords(8, {})).resolves.toEqual({
        latest: null,
        data: [],
        meta: {
          skip: 0,
          take: 20,
          total: 0,
          totalPages: 0,
          institutionTimezone: 'America/El_Salvador',
        },
      });
    });

    it('returns not found before querying records when the patient is inaccessible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findRecords(8, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.biometricRecord.findFirst).not.toHaveBeenCalled();
      expect(tx.biometricRecord.findMany).not.toHaveBeenCalled();
      expect(tx.biometricRecord.count).not.toHaveBeenCalled();
    });
  });

  describe('findSummary', () => {
    it('maps a parameterized aggregate response with null metric values preserved', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: { timezone: 'America/Guatemala' } },
      });
      tx.$queryRaw.mockResolvedValue([
        {
          sampleCount: BigInt(2),
          avgHeartRateCount: BigInt(2),
          avgHeartRateAverage: 75,
          avgHeartRateMinimum: 70,
          avgHeartRateMaximum: 80,
          stressLevelCount: BigInt(1),
          stressLevelAverage: 0.4,
          stressLevelMinimum: 0.4,
          stressLevelMaximum: 0.4,
          bloodOxygenCount: BigInt(0),
          bloodOxygenAverage: null,
          bloodOxygenMinimum: null,
          bloodOxygenMaximum: null,
          timestamp: new Date('2026-09-30T10:00:00.000Z'),
          seriesSampleCount: BigInt(2),
          seriesAvgHeartRate: 75,
          seriesStressLevel: 0.4,
          seriesBloodOxygen: null,
        },
      ]);

      const result = await service.findSummary(8, { range: '7d' });

      expect(result).toMatchObject({
        range: {
          key: '7d',
          bucket: 'day',
          institutionTimezone: 'America/Guatemala',
        },
        sampleCount: 2,
        metrics: {
          avgHeartRate: { count: 2, average: 75, minimum: 70, maximum: 80 },
          stressLevel: { count: 1, average: 0.4, minimum: 0.4, maximum: 0.4 },
          bloodOxygen: { count: 0, average: null, minimum: null, maximum: null },
        },
        series: [
          {
            timestamp: new Date('2026-09-30T10:00:00.000Z'),
            sampleCount: 2,
            avgHeartRate: 75,
            stressLevel: 0.4,
            bloodOxygen: null,
          },
        ],
      });
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns an empty series without converting missing metrics to zero', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: null },
      });
      tx.$queryRaw.mockResolvedValue([
        {
          sampleCount: BigInt(0),
          avgHeartRateCount: BigInt(0),
          avgHeartRateAverage: null,
          avgHeartRateMinimum: null,
          avgHeartRateMaximum: null,
          stressLevelCount: BigInt(0),
          stressLevelAverage: null,
          stressLevelMinimum: null,
          stressLevelMaximum: null,
          bloodOxygenCount: BigInt(0),
          bloodOxygenAverage: null,
          bloodOxygenMinimum: null,
          bloodOxygenMaximum: null,
          timestamp: null,
          seriesSampleCount: null,
          seriesAvgHeartRate: null,
          seriesStressLevel: null,
          seriesBloodOxygen: null,
        },
      ]);

      await expect(service.findSummary(8, { range: '24h' })).resolves.toMatchObject({
        range: {
          key: '24h',
          bucket: 'hour',
          institutionTimezone: 'America/El_Salvador',
        },
        sampleCount: 0,
        metrics: {
          avgHeartRate: { count: 0, average: null },
          stressLevel: { count: 0, average: null },
          bloodOxygen: { count: 0, average: null },
        },
        series: [],
      });
    });

    it('verifies the patient before executing the aggregation', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findSummary(8, {})).rejects.toThrow(NotFoundException);
      expect(tx.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('findTrends', () => {
    it('buckets records by day and averages heart rate / stress level', async () => {
      tx.biometricRecord.findMany.mockResolvedValue([
        {
          timestamp: new Date('2026-01-01T08:00:00.000Z'),
          avgHeartRate: 70,
          stressLevel: 0.2,
          sleepQualityHours: 7,
        },
        {
          timestamp: new Date('2026-01-01T20:00:00.000Z'),
          avgHeartRate: 80,
          stressLevel: 0.4,
          sleepQualityHours: 8,
        },
        {
          timestamp: new Date('2026-01-02T08:00:00.000Z'),
          avgHeartRate: 90,
          stressLevel: null,
          sleepQualityHours: null,
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
          avgSleepQualityHours: 7.5,
          sampleCount: 2,
        },
        {
          date: '2026-01-02',
          avgHeartRate: 90,
          avgStressLevel: null,
          avgSleepQualityHours: null,
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
