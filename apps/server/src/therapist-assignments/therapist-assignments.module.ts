import { Module } from '@nestjs/common';
import { TherapistAssignmentsController } from './therapist-assignments.controller';
import { TherapistAssignmentsService } from './therapist-assignments.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TherapistAssignmentsController],
  providers: [TherapistAssignmentsService],
  exports: [TherapistAssignmentsService],
})
export class TherapistAssignmentsModule {}
