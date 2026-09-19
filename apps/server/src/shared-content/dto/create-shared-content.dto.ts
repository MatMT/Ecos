import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSharedContentDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Specific therapist UUID to share with. If omitted, uses active primary therapist.',
  })
  @IsOptional()
  @IsUUID()
  therapistId?: string;

  @ApiProperty({
    example: 'journal_entry',
    description: 'Type identifier for the shared payload.',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    example:
      'Registro del 18/09: Me sentí sumamente abrumado antes de entrar al laboratorio...',
    description: 'The immutable text content of the shared reflection.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'c8b3e8a2-7201-49b8-a6e1-955dc9fa0821',
    description: 'Originating SQLite ID on the local mobile client.',
  })
  @IsOptional()
  @IsString()
  sourceLocalId?: string;
}
