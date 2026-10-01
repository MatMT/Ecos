import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatientActivityAssignmentListQueryDto } from './patient-activity-assignment-list-query.dto';

describe('PatientActivityAssignmentListQueryDto', () => {
  it('transforms valid pagination and status filters', async () => {
    const dto = plainToInstance(PatientActivityAssignmentListQueryDto, {
      skip: '20',
      take: '50',
      status: 'in_progress',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ skip: 20, take: 50, status: 'in_progress' });
  });

  it.each([
    { skip: '-1', take: '20' },
    { skip: '0', take: '0' },
    { skip: '0', take: '101' },
    { status: 'cancelled' },
  ])('rejects invalid query parameters %#', async (query) => {
    const dto = plainToInstance(PatientActivityAssignmentListQueryDto, query);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
