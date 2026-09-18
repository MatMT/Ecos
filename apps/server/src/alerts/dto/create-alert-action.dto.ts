import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// A plain validated string, not a Prisma enum — deliberately deferred (see
// docs/clinical-panel/GOALS.md §5): the guide's own words call this catalog one that "can become
// an enum once the flow has stabilized," an explicit instability signal absent for Alert's own
// priority/status fields (which are real enums).
export const ALERT_ACTION_TYPES = [
  'reviewed',
  'patient_contacted',
  'appointment_created',
  'session_scheduled',
  'referral_recommended',
  'closed',
] as const;

export class CreateAlertActionDto {
  @ApiProperty({ enum: ALERT_ACTION_TYPES })
  @IsIn(ALERT_ACTION_TYPES)
  actionType!: string;

  @ApiPropertyOptional({ description: 'Details about the action taken.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
