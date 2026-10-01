import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class StudentResponseDto {
  @ApiProperty({ description: 'Patient profile id.' })
  id!: number;

  @ApiProperty({
    description: "The underlying user's id (Supabase Auth / GoTrue).",
  })
  userId!: string;

  @ApiPropertyOptional({
    description: 'Institutional student code.',
    nullable: true,
  })
  studentCode!: string | null;

  @ApiPropertyOptional({
    description: 'Primary diagnosis, if any.',
    nullable: true,
  })
  primaryDiagnosis!: string | null;

  @ApiPropertyOptional({
    description: 'Current primary therapist (User) id.',
    nullable: true,
  })
  assignedDoctorId!: string | null;

  @ApiProperty({ description: 'Account details.', type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
