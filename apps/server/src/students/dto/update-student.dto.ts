import { PartialType, PickType } from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';

/**
 * Only studentCode/primaryDiagnosis are editable here. fullName/email/password stay
 * owned by PATCH /users/:id; reassigning the therapist goes through
 * /therapist-assignments, not this endpoint — it's a historical operation, not a plain
 * field edit.
 */
export class UpdateStudentDto extends PartialType(
  PickType(CreateStudentDto, ['studentCode', 'primaryDiagnosis'] as const),
) {}
