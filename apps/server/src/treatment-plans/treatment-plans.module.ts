import { Module } from '@nestjs/common';
import { TreatmentPlansController } from './treatment-plans.controller';
import { TreatmentPlansService } from './treatment-plans.service';

@Module({
  controllers: [TreatmentPlansController],
  providers: [TreatmentPlansService],
})
export class TreatmentPlansModule {}
