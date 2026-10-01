import { Module } from '@nestjs/common';
import { ClinicalRecordsController } from './clinical-records.controller';
import { ClinicalRecordsService } from './clinical-records.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ClinicalRecordsController],
  providers: [ClinicalRecordsService],
})
export class ClinicalRecordsModule {}
