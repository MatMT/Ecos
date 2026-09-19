import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { UsersModule } from '../users/users.module';
import { TherapistAssignmentsModule } from '../therapist-assignments/therapist-assignments.module';

@Module({
  imports: [UsersModule, TherapistAssignmentsModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
