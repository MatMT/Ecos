import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateBiometricSummaryDto } from './dto/create-biometric-summary.dto';
import {
  BIOMETRIC_RANGE_KEYS,
  type BiometricRangeKey,
} from './dto/biometric-range.dto';
import { BiometricRecordListQueryDto } from './dto/biometric-record-list-query.dto';
import { BiometricSummaryQueryDto } from './dto/biometric-summary-query.dto';

const MAX_PAGE_SIZE = 100;
const DEFAULT_TRENDS_RANGE_DAYS = 30;
const DEFAULT_TIMEZONE = 'America/El_Salvador';
const DEFAULT_SUMMARY_RANGE: BiometricRangeKey = '7d';
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

interface ResolvedBiometricRange {
  bucket: 'hour' | 'day';
  from: Date;
  key: BiometricRangeKey;
  to: Date;
}

interface BiometricSummaryRawRow {
  avgHeartRateAverage: number | null;
  avgHeartRateCount: bigint | number;
  avgHeartRateMaximum: number | null;
  avgHeartRateMinimum: number | null;
  bloodOxygenAverage: number | null;
  bloodOxygenCount: bigint | number;
  bloodOxygenMaximum: number | null;
  bloodOxygenMinimum: number | null;
  sampleCount: bigint | number;
  seriesAvgHeartRate: number | null;
  seriesBloodOxygen: number | null;
  seriesSampleCount: bigint | number | null;
  seriesStressLevel: number | null;
  stressLevelAverage: number | null;
  stressLevelCount: bigint | number;
  stressLevelMaximum: number | null;
  stressLevelMinimum: number | null;
  timestamp: Date | null;
}

interface DateRange {
  from?: string;
  to?: string;
}

@Injectable()
export class BiometricsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveSummary(dto: CreateBiometricSummaryDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      let resolvedStudentId = dto.studentId;

      if (!resolvedStudentId && currentUser) {
        const student = await tx.studentProfile.findFirst({
          where: { userId: currentUser.id },
        });
        if (student) {
          resolvedStudentId = student.id;
        }
      }

      if (!resolvedStudentId) {
        throw new BadRequestException(
          'No se ha podido asociar la telemetría a un paciente válido.',
        );
      }

      let device = await tx.bandDevice.findFirst({
        where: { studentId: resolvedStudentId },
      });

      if (!device) {
        device = await tx.bandDevice.create({
          data: {
            studentId: resolvedStudentId,
            deviceCode: 'NEXO-BAND-DEFAULT',
            bindingStatus: true,
            lastSync: new Date(),
          },
        });
      } else {
        await tx.bandDevice.update({
          where: { id: device.id },
          data: { lastSync: new Date() },
        });
      }

      return tx.biometricRecord.create({
        data: {
          deviceId: device.id,
          avgHeartRate: dto.averageHeartRate,
          stressLevel: dto.averageStress,
          bloodOxygen: dto.averageOxygen ?? 98,
          timestamp: new Date(dto.windowEnd),
        },
      });
    });
  }

  findBands(studentId: number) {
    return this.prisma.withRls((tx) =>
      tx.bandDevice.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findRecords(studentId: number, query: BiometricRecordListQueryDto) {
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);
    const range = resolveBiometricRange(query.range);

    return this.prisma.withRls(async (tx) => {
      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: {
          user: {
            select: {
              institution: { select: { timezone: true } },
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const select = {
        id: true,
        avgHeartRate: true,
        stressLevel: true,
        bloodOxygen: true,
        timestamp: true,
        createdAt: true,
      };
      const allTimeWhere: Prisma.BiometricRecordWhereInput = {
        device: { studentId },
      };
      const where: Prisma.BiometricRecordWhereInput = {
        ...allTimeWhere,
        timestamp: { gte: range.from, lt: range.to },
      };
      const orderBy = [
        { timestamp: { sort: 'desc' as const, nulls: 'last' as const } },
        { createdAt: 'desc' as const },
        { id: 'desc' as const },
      ];

      const [latest, data, total] = await Promise.all([
        tx.biometricRecord.findFirst({
          where: allTimeWhere,
          orderBy,
          select,
        }),
        tx.biometricRecord.findMany({ where, skip, take, orderBy, select }),
        tx.biometricRecord.count({ where }),
      ]);

      return {
        latest,
        data,
        meta: {
          skip,
          take,
          total,
          totalPages: Math.ceil(total / take),
          institutionTimezone:
            patient.user.institution?.timezone ?? DEFAULT_TIMEZONE,
        },
      };
    });
  }

  async findSummary(studentId: number, query: BiometricSummaryQueryDto) {
    const range = resolveBiometricRange(query.range);

    return this.prisma.withRls(async (tx) => {
      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: {
          user: {
            select: {
              institution: { select: { timezone: true } },
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const institutionTimezone =
        patient.user.institution?.timezone ?? DEFAULT_TIMEZONE;
      const rows = await tx.$queryRaw<BiometricSummaryRawRow[]>`
        WITH filtered_records AS (
          SELECT
            record."timestamp",
            record.avg_heart_rate,
            record.stress_level,
            record.blood_oxygen
          FROM public.remote_biometric_records AS record
          INNER JOIN public.remote_band_devices AS device
            ON device.id = record.device_id
          WHERE device.student_id = ${studentId}
            AND record."timestamp" IS NOT NULL
            AND record."timestamp" >= ${range.from}
            AND record."timestamp" < ${range.to}
        ),
        summary AS (
          SELECT
            COUNT(*) AS "sampleCount",
            COUNT(avg_heart_rate) AS "avgHeartRateCount",
            AVG(avg_heart_rate)::double precision AS "avgHeartRateAverage",
            MIN(avg_heart_rate)::double precision AS "avgHeartRateMinimum",
            MAX(avg_heart_rate)::double precision AS "avgHeartRateMaximum",
            COUNT(stress_level) AS "stressLevelCount",
            AVG(stress_level)::double precision AS "stressLevelAverage",
            MIN(stress_level)::double precision AS "stressLevelMinimum",
            MAX(stress_level)::double precision AS "stressLevelMaximum",
            COUNT(blood_oxygen) AS "bloodOxygenCount",
            AVG(blood_oxygen)::double precision AS "bloodOxygenAverage",
            MIN(blood_oxygen)::double precision AS "bloodOxygenMinimum",
            MAX(blood_oxygen)::double precision AS "bloodOxygenMaximum"
          FROM filtered_records
        ),
        series AS (
          SELECT
            (
              date_trunc(
                ${range.bucket}::text,
                ("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${institutionTimezone}
              ) AT TIME ZONE ${institutionTimezone}
            ) AS "timestamp",
            COUNT(*) AS "seriesSampleCount",
            AVG(avg_heart_rate)::double precision AS "seriesAvgHeartRate",
            AVG(stress_level)::double precision AS "seriesStressLevel",
            AVG(blood_oxygen)::double precision AS "seriesBloodOxygen"
          FROM filtered_records
          GROUP BY 1
        )
        SELECT
          summary.*,
          series."timestamp",
          series."seriesSampleCount",
          series."seriesAvgHeartRate",
          series."seriesStressLevel",
          series."seriesBloodOxygen"
        FROM summary
        LEFT JOIN series ON TRUE
        ORDER BY series."timestamp" ASC
      `;

      const firstRow = rows[0];
      if (!firstRow) {
        throw new Error('La agregación biométrica no produjo una respuesta.');
      }

      return {
        range: {
          key: range.key,
          from: range.from,
          to: range.to,
          bucket: range.bucket,
          institutionTimezone,
        },
        sampleCount: toNumber(firstRow.sampleCount),
        metrics: {
          avgHeartRate: toMetricSummary(firstRow, 'avgHeartRate'),
          stressLevel: toMetricSummary(firstRow, 'stressLevel'),
          bloodOxygen: toMetricSummary(firstRow, 'bloodOxygen'),
        },
        series: rows.flatMap((row) =>
          row.timestamp === null || row.seriesSampleCount === null
            ? []
            : [
                {
                  timestamp: row.timestamp,
                  sampleCount: toNumber(row.seriesSampleCount),
                  avgHeartRate: row.seriesAvgHeartRate,
                  stressLevel: row.seriesStressLevel,
                  bloodOxygen: row.seriesBloodOxygen,
                },
              ],
        ),
      };
    });
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
        select: {
          timestamp: true,
          avgHeartRate: true,
          stressLevel: true,
          sleepQualityHours: true,
        },
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
        sleepSum: number;
        sleepCount: number;
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
        sleepSum: 0,
        sleepCount: 0,
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
      if (record.sleepQualityHours !== null) {
        bucket.sleepSum += record.sleepQualityHours;
        bucket.sleepCount += 1;
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
        avgSleepQualityHours: bucket.sleepCount
          ? round2(bucket.sleepSum / bucket.sleepCount)
          : null,
        sampleCount: bucket.count,
      }));
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveBiometricRange(
  rangeKey: BiometricRangeKey | undefined,
): ResolvedBiometricRange {
  const key = rangeKey ?? DEFAULT_SUMMARY_RANGE;
  if (!BIOMETRIC_RANGE_KEYS.includes(key)) {
    throw new BadRequestException(
      'El período biométrico solicitado no es válido.',
    );
  }

  const hoursByRange: Record<BiometricRangeKey, number> = {
    '24h': 24,
    '7d': 7 * 24,
    '30d': 30 * 24,
    '90d': 90 * 24,
  };
  const to = new Date();

  return {
    key,
    from: new Date(to.getTime() - hoursByRange[key] * HOUR_IN_MILLISECONDS),
    to,
    bucket: key === '24h' ? 'hour' : 'day',
  };
}

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

function toMetricSummary(
  row: BiometricSummaryRawRow,
  metric: 'avgHeartRate' | 'stressLevel' | 'bloodOxygen',
) {
  const values = {
    avgHeartRate: {
      count: row.avgHeartRateCount,
      average: row.avgHeartRateAverage,
      minimum: row.avgHeartRateMinimum,
      maximum: row.avgHeartRateMaximum,
    },
    stressLevel: {
      count: row.stressLevelCount,
      average: row.stressLevelAverage,
      minimum: row.stressLevelMinimum,
      maximum: row.stressLevelMaximum,
    },
    bloodOxygen: {
      count: row.bloodOxygenCount,
      average: row.bloodOxygenAverage,
      minimum: row.bloodOxygenMinimum,
      maximum: row.bloodOxygenMaximum,
    },
  } satisfies Record<
    'avgHeartRate' | 'stressLevel' | 'bloodOxygen',
    {
      average: number | null;
      count: bigint | number;
      maximum: number | null;
      minimum: number | null;
    }
  >;

  return {
    ...values[metric],
    count: toNumber(values[metric].count),
  };
}
