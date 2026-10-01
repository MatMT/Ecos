import { Module } from '@nestjs/common';
import { SharedContentController } from './shared-content.controller';
import { SharedContentService } from './shared-content.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SharedContentController],
  providers: [SharedContentService],
})
export class SharedContentModule {}
