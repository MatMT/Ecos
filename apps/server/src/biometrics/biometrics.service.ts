import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_PAGE_SIZE = 100;
const DEFAULT_TRENDS_RANGE_DAYS = 30;

interface DateRange {
  from?: string;
  to?: string;
}

@Injectable()
export class BiometricsService {
  constructor(private readonly prisma: PrismaService) {}

  findBands(studentId: number) {
    return this.prisma.withRls((tx) =>
      tx.bandDevice.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  findRecords(studentId: number, range: DateRange, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.biometricRecord.findMany({
        where: {
          device: { studentId },
          timestamp: buildTimestampFilter(range),
        },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { timestamp: 'desc' },
      }),
    );
  }

  async findLatest(studentId: number) {
    const record = await this.prisma.withRls((tx) =>
      tx.biometricRecord.findFirst({
        where: { device: { studentId } },
        orderBy: { timestamp: 'desc' },
      }),
    );
    if (!record) {
      throw new NotFoundException(
        'No se ha encontrado ningún registro biométrico para este paciente.',
      );
    }
    return record;
  }

  async findTrends(studentId: number, range: DateRange) {
    const from = range.from
      ? new Date(range.from)
      : new Date(Date.now() - DEFAULT_TRENDS_RANGE_DAYS * 24 * 60 * 60 * 1000);
    const to = range.to ? new Date(range.to) : new Date();

    const records = await this.prisma.withRls((tx) =>
      tx.biometricRecord.findMany({
        where: {
          device: { studentId },
          timestamp: { gte: from, lte: to },
        },
        select: { timestamp: true, avgHeartRate: true, stressLevel: true },
        orderBy: { timestamp: 'asc' },
      }),
    );

    const buckets = new Map<
      string,
      {
        count: number;
        heartRateSum: number;
        heartRateCount: number;
        stressSum: number;
        stressCount: number;
      }
    >();

    for (const record of records) {
      if (!record.timestamp) continue;
      const day = record.timestamp.toISOString().slice(0, 10);
      const bucket = buckets.get(day) ?? {
        count: 0,
        heartRateSum: 0,
        heartRateCount: 0,
        stressSum: 0,
        stressCount: 0,
      };
      bucket.count += 1;
      if (record.avgHeartRate !== null) {
        bucket.heartRateSum += record.avgHeartRate;
        bucket.heartRateCount += 1;
      }
      if (record.stressLevel !== null) {
        bucket.stressSum += record.stressLevel;
        bucket.stressCount += 1;
      }
      buckets.set(day, bucket);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        avgHeartRate: bucket.heartRateCount
          ? round2(bucket.heartRateSum / bucket.heartRateCount)
          : null,
        avgStressLevel: bucket.stressCount
          ? round2(bucket.stressSum / bucket.stressCount)
          : null,
        sampleCount: bucket.count,
      }));
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildTimestampFilter(range: DateRange) {
  if (!range.from && !range.to) return undefined;
  return {
    gte: range.from ? new Date(range.from) : undefined,
    lte: range.to ? new Date(range.to) : undefined,
  };
}
