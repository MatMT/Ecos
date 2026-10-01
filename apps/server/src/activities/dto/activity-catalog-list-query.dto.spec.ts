import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActivityCatalogListQueryDto } from './activity-catalog-list-query.dto';

describe('ActivityCatalogListQueryDto', () => {
  it('transforms valid pagination and availability filters', async () => {
    const dto = plainToInstance(ActivityCatalogListQueryDto, {
      skip: '20',
      take: '50',
      active: 'false',
      search: '  respiración  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      skip: 20,
      take: 50,
      active: false,
      search: 'respiración',
    });
  });

  it.each([
    { skip: '-1', take: '20' },
    { skip: '0', take: '0' },
    { skip: '0', take: '101' },
    { active: 'yes' },
    { search: 'a'.repeat(256) },
  ])('rejects invalid query parameters %#', async (query) => {
    const dto = plainToInstance(ActivityCatalogListQueryDto, query);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
