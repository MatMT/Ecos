import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentActivityDto } from './create-student-activity.dto';

describe('CreateStudentActivityDto', () => {
  it('accepts only an activity id and optional ISO deadline', async () => {
    const dto = plainToInstance(CreateStudentActivityDto, {
      activityId: 3,
      dueAt: '2026-10-01T15:30:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects server-owned assignment fields under global whitelist validation', async () => {
    const dto = plainToInstance(CreateStudentActivityDto, {
      activityId: 3,
      completedAt: '2026-10-01T15:30:00.000Z',
      origin: 'ecos',
      response: 'Contenido no permitido',
      status: 'completed',
      therapistId: 'other-therapist',
    });

    const errors = await validate(dto, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    expect(errors).not.toHaveLength(0);
  });
});
