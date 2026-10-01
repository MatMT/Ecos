import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from './activity-response.dto';

export class ActivityCatalogListMetaResponseDto {
  @ApiProperty()
  skip!: number;

  @ApiProperty()
  take!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class ActivityCatalogListResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  data!: ActivityResponseDto[];

  @ApiProperty({ type: ActivityCatalogListMetaResponseDto })
  meta!: ActivityCatalogListMetaResponseDto;
}
