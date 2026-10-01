import { Module } from '@nestjs/common';
import { ClinicalNotesController } from './clinical-notes.controller';
import { ClinicalNotesService } from './clinical-notes.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ClinicalNotesController],
  providers: [ClinicalNotesService],
})
export class ClinicalNotesModule {}
