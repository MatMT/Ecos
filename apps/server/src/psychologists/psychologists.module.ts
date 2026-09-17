import { Module } from '@nestjs/common';
import { PsychologistsController } from './psychologists.controller';
import { PsychologistsService } from './psychologists.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [PsychologistsController],
  providers: [PsychologistsService],
})
export class PsychologistsModule {}
