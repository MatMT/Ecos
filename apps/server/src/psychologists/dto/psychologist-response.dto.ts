import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class PsychologistResponseDto {
  @ApiProperty({ description: 'Psychologist profile id.' })
  id!: number;

  @ApiProperty({
    description: "The underlying user's id (Supabase Auth / GoTrue).",
  })
  userId!: string;

  @ApiPropertyOptional({
    description: 'Professional license/registration number.',
    nullable: true,
  })
  professionalLicense!: string | null;

  @ApiPropertyOptional({ description: 'Clinical specialty.', nullable: true })
  specialty!: string | null;

  @ApiPropertyOptional({ description: 'Contact phone number.', nullable: true })
  phone!: string | null;

  @ApiProperty({ description: 'Default session duration, in minutes.' })
  defaultSessionMinutes!: number;

  @ApiProperty({
    description: 'Whether this psychologist is currently active.',
  })
  active!: boolean;

  @ApiProperty({ description: 'Account details.', type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
