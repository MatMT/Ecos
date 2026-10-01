import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatientAlertListQueryDto } from './patient-alert-list-query.dto';

describe('PatientAlertListQueryDto', () => {
  it('transforms valid pagination and enum filters', async () => {
    const dto = plainToInstance(PatientAlertListQueryDto, {
      skip: '20',
      take: '50',
      status: AlertStatus.reviewed,
      alertType: AlertType.panic_button,
      priority: AlertPriority.high,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      skip: 20,
      take: 50,
      status: AlertStatus.reviewed,
      alertType: AlertType.panic_button,
      priority: AlertPriority.high,
    });
  });

  it.each([
    { skip: '-1', take: '20' },
    { skip: '0', take: '0' },
    { skip: '0', take: '101' },
    { status: 'open' },
    { alertType: 'sos' },
    { priority: 'urgent' },
  ])('rejects invalid query parameters %#', async (query) => {
    const dto = plainToInstance(PatientAlertListQueryDto, query);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
