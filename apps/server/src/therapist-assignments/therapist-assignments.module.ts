import { Module } from '@nestjs/common';
import { TherapistAssignmentsController } from './therapist-assignments.controller';
import { TherapistAssignmentsService } from './therapist-assignments.service';

@Module({
  controllers: [TherapistAssignmentsController],
  providers: [TherapistAssignmentsService],
  exports: [TherapistAssignmentsService],
})
export class TherapistAssignmentsModule {}
