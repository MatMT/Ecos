import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PsychologistsService } from './psychologists.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('PsychologistsService', () => {
  let service: PsychologistsService;
  let tx: {
    psychologistProfile: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    studentProfile: { findMany: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };
  let usersService: { createUserRecord: jest.Mock };

  beforeEach(async () => {
    tx = {
      psychologistProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: { findMany: jest.fn() },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    usersService = { createUserRecord: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PsychologistsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(PsychologistsService);
  });

  describe('create', () => {
    it('creates the User via UsersService and the profile in the same transaction', async () => {
      const fakeUser = { id: 'user-uuid', role: Role.psychologist };
      usersService.createUserRecord.mockResolvedValue(fakeUser);
      tx.psychologistProfile.create.mockResolvedValue({
        id: 1,
        userId: 'user-uuid',
      });

      const dto = {
        fullName: 'Marta López',
        email: 'marta@example.com',
        password: 'Seed1234!',
        specialty: 'Terapia familiar',
      };

      const result = await service.create(dto, 5);

      expect(usersService.createUserRecord).toHaveBeenCalledWith(
        tx,
        {
          full_name: 'Marta López',
          email: 'marta@example.com',
          password: 'Seed1234!',
          role: Role.psychologist,
        },
        5,
      );
      expect(tx.psychologistProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid',
          professionalLicense: undefined,
          specialty: 'Terapia familiar',
          phone: undefined,
          defaultSessionMinutes: undefined,
        },
      });
      expect(result).toEqual({ id: 1, userId: 'user-uuid', user: fakeUser });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the profile does not exist', async () => {
      tx.psychologistProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the profile when found', async () => {
      const profile = { id: 1, userId: 'user-uuid' };
      tx.psychologistProfile.findUnique.mockResolvedValue(profile);

      await expect(service.findOne('user-uuid')).resolves.toEqual(profile);
    });
  });

  describe('findStudents', () => {
    it('queries StudentProfile by assignedDoctorId', async () => {
      tx.studentProfile.findMany.mockResolvedValue([{ id: 1 }]);

      await service.findStudents('user-uuid');

      expect(tx.studentProfile.findMany).toHaveBeenCalledWith({
        where: { assignedDoctorId: 'user-uuid' },
        include: { user: true },
      });
    });
  });
});
