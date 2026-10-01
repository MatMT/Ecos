import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BiometricRecordListQueryDto } from './biometric-record-list-query.dto';

describe('BiometricRecordListQueryDto', () => {
  it('transforms a valid pagination query', async () => {
    const dto = plainToInstance(BiometricRecordListQueryDto, {
      skip: '20',
      take: '50',
      range: '30d',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ skip: 20, take: 50, range: '30d' });
  });

  it.each([
    { skip: '-1', take: '20' },
    { skip: '0', take: '0' },
    { skip: '0', take: '101' },
    { skip: '0', take: '20', range: '365d' },
  ])('rejects invalid pagination parameters %#', async (query) => {
    const dto = plainToInstance(BiometricRecordListQueryDto, query);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
