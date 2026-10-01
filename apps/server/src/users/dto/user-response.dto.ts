import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'Supabase Auth (GoTrue) user id.',
    example: '3fae1c9e-4b2a-4b7b-9c1d-8f2b6a7e5d10',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Institution this user belongs to.',
    example: 1,
    nullable: true,
  })
  institutionId!: number | null;

  @ApiPropertyOptional({
    description: 'Full legal name.',
    example: 'Ana Martínez',
    nullable: true,
  })
  fullName!: string | null;

  @ApiPropertyOptional({
    description: 'Email address.',
    example: 'ana.martinez@example.com',
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    description: 'Role assigned to this user.',
    enum: Role,
    nullable: true,
  })
  role!: Role | null;

  @ApiProperty({ description: 'When the account was created.' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the account was last updated.' })
  updatedAt!: Date;
}
