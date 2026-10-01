import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SchedulesService.computeAvailableSlots', () => {
  let service: SchedulesService;
  let tx: {
    therapistSchedule: { findMany: jest.Mock };
    therapistScheduleException: { findMany: jest.Mock };
    psychologistProfile: { findUnique: jest.Mock };
    appointment: { findMany: jest.Mock };
  };

  const THERAPIST_ID = 'therapist-uuid';
  const DATE = '2030-06-03'; // arbitrary future date; day-of-week is irrelevant since findMany is mocked
  const TZ = 'UTC';

  function scheduleRow(
    overrides: Partial<{
      startTime: Date;
      endTime: Date;
      sessionDurationMinutes: number;
      breakMinutes: number;
    }> = {},
  ) {
    return {
      startTime: new Date(Date.UTC(1970, 0, 1, 8, 0, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 12, 0, 0)),
      sessionDurationMinutes: 60,
      breakMinutes: 0,
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      therapistSchedule: { findMany: jest.fn().mockResolvedValue([]) },
      therapistScheduleException: { findMany: jest.fn().mockResolvedValue([]) },
      psychologistProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module = await Test.createTestingModule({
      providers: [SchedulesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get(SchedulesService);
  });

  const fakeTx = () => tx as unknown as Prisma.TransactionClient;

  it('generates slots from a recurring schedule with no conflicts', async () => {
    tx.therapistSchedule.findMany.mockResolvedValue([scheduleRow()]);

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: DATE,
      institutionTimezone: TZ,
    });

    expect(slots.map((s) => s.start.toISOString())).toEqual([
      '2030-06-03T08:00:00.000Z',
      '2030-06-03T09:00:00.000Z',
      '2030-06-03T10:00:00.000Z',
      '2030-06-03T11:00:00.000Z',
    ]);
  });

  it('returns no slots when a full-day exception exists', async () => {
    tx.therapistSchedule.findMany.mockResolvedValue([scheduleRow()]);
    tx.therapistScheduleException.findMany.mockResolvedValue([
      { available: false, startTime: null, endTime: null },
    ]);

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: DATE,
      institutionTimezone: TZ,
    });

    expect(slots).toEqual([]);
  });

  it('removes slots overlapping a partial-block exception', async () => {
    tx.therapistSchedule.findMany.mockResolvedValue([scheduleRow()]);
    tx.therapistScheduleException.findMany.mockResolvedValue([
      {
        available: false,
        startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 10, 0, 0)),
      },
    ]);

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: DATE,
      institutionTimezone: TZ,
    });

    expect(slots.map((s) => s.start.toISOString())).toEqual([
      '2030-06-03T08:00:00.000Z',
      '2030-06-03T10:00:00.000Z',
      '2030-06-03T11:00:00.000Z',
    ]);
  });

  it('adds slots from an extraordinary-availability exception, using the profile default duration', async () => {
    tx.therapistSchedule.findMany.mockResolvedValue([]);
    tx.therapistScheduleException.findMany.mockResolvedValue([
      {
        available: true,
        startTime: new Date(Date.UTC(1970, 0, 1, 14, 0, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 15, 0, 0)),
      },
    ]);
    tx.psychologistProfile.findUnique.mockResolvedValue({
      defaultSessionMinutes: 30,
    });

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: DATE,
      institutionTimezone: TZ,
    });

    expect(slots.map((s) => s.start.toISOString())).toEqual([
      '2030-06-03T14:00:00.000Z',
      '2030-06-03T14:30:00.000Z',
    ]);
  });

  it('removes a slot overlapping an existing pending/confirmed appointment', async () => {
    tx.therapistSchedule.findMany.mockResolvedValue([scheduleRow()]);
    tx.appointment.findMany.mockResolvedValue([
      {
        appointmentDate: new Date('2030-06-03T09:00:00.000Z'),
        endAt: new Date('2030-06-03T10:00:00.000Z'),
      },
    ]);

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: DATE,
      institutionTimezone: TZ,
    });

    const startTimes = slots.map((s) => s.start.toISOString());
    expect(startTimes).not.toContain('2030-06-03T09:00:00.000Z');
    expect(startTimes).toHaveLength(3);
  });

  it('returns [] immediately for a date before today, without querying anything', async () => {
    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: '2000-01-01',
      institutionTimezone: TZ,
    });

    expect(slots).toEqual([]);
    expect(tx.therapistSchedule.findMany).not.toHaveBeenCalled();
  });

  it('drops slots that have already passed when the date is today', async () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    tx.therapistSchedule.findMany.mockResolvedValue([
      scheduleRow({
        startTime: new Date(Date.UTC(1970, 0, 1, 0, 0, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 23, 0, 0)),
        sessionDurationMinutes: 60,
      }),
    ]);

    const slots = await service.computeAvailableSlots(fakeTx(), {
      therapistId: THERAPIST_ID,
      date: todayStr,
      institutionTimezone: TZ,
    });

    for (const slot of slots) {
      expect(slot.start.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});
