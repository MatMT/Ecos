import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TIMELINE_ITEM_TYPES = [
  'APPOINTMENT',
  'CLINICAL_NOTE',
  'ALERT',
  'ACTIVITY',
  'SHARED_CONTENT',
] as const;

export type TimelineItemType = (typeof TIMELINE_ITEM_TYPES)[number];

export class TimelineItemDto {
  @ApiProperty({ enum: TIMELINE_ITEM_TYPES })
  type!: TimelineItemType;

  @ApiProperty()
  occurredAt!: Date;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  referenceId!: number;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;
}
