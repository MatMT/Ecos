import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TherapistAssignmentsService } from '../therapist-assignments/therapist-assignments.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let tx: {
    studentProfile: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let usersService: { createUserRecord: jest.Mock };
  let therapistAssignmentsService: { assignPrimaryTherapist: jest.Mock };

  beforeEach(async () => {
    tx = {
      studentProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    usersService = { createUserRecord: jest.fn() };
    therapistAssignmentsService = { assignPrimaryTherapist: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        {
          provide: TherapistAssignmentsService,
          useValue: therapistAssignmentsService,
        },
      ],
    }).compile();

    service = module.get(StudentsService);
  });

  describe('create', () => {
    it('creates the user and profile, and assigns a therapist when given', async () => {
      const fakeUser = { id: 'student-uuid', role: Role.student };
      usersService.createUserRecord.mockResolvedValue(fakeUser);
      tx.studentProfile.create.mockResolvedValue({ id: 10 });
      tx.studentProfile.findUniqueOrThrow.mockResolvedValue({
        id: 10,
        user: fakeUser,
      });

      const dto = {
        fullName: 'Ana Martínez',
        email: 'ana@example.com',
        password: 'Seed1234!',
        assignedDoctorId: 'therapist-uuid',
      };

      const result = await service.create(dto, 5);

      expect(
        therapistAssignmentsService.assignPrimaryTherapist,
      ).toHaveBeenCalledWith(tx, {
        studentId: 10,
        therapistId: 'therapist-uuid',
      });
      expect(result).toEqual({ id: 10, user: fakeUser });
    });

    it('does not attempt an assignment when assignedDoctorId is omitted', async () => {
      usersService.createUserRecord.mockResolvedValue({ id: 'student-uuid' });
      tx.studentProfile.create.mockResolvedValue({ id: 11 });
      tx.studentProfile.findUniqueOrThrow.mockResolvedValue({ id: 11 });

      await service.create(
        { fullName: 'X', email: 'x@example.com', password: 'Seed1234!' },
        5,
      );

      expect(
        therapistAssignmentsService.assignPrimaryTherapist,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the patient does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('returns the patient when found', async () => {
      const profile = { id: 1 };
      tx.studentProfile.findUnique.mockResolvedValue(profile);

      await expect(service.findOne(1)).resolves.toEqual(profile);
    });
  });
});
