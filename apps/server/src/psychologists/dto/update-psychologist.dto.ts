import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePsychologistDto } from './create-psychologist.dto';

/**
 * Only the profile fields are editable here. fullName/email/password stay owned by
 * PATCH /users/:id — this avoids a second, divergent path to edit the same User row.
 * `active` is included (unlike CreatePsychologistDto) but a non-administrator changing
 * it is rejected by the remote_psychologist_profiles_protect_active DB trigger, not by
 * this DTO — any authenticated caller may send it, only admins succeed.
 */
export class UpdatePsychologistDto extends PartialType(
  PickType(CreatePsychologistDto, [
    'professionalLicense',
    'specialty',
    'phone',
    'defaultSessionMinutes',
  ] as const),
) {
  @ApiPropertyOptional({
    description:
      'Whether this psychologist is active. Administrator-only — enforced at the database level.',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
