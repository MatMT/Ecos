import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PsychologistsModule } from './psychologists/psychologists.module';
import { TherapistAssignmentsModule } from './therapist-assignments/therapist-assignments.module';
import { StudentsModule } from './students/students.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RlsContextInterceptor } from './common/interceptors/rls-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('supabase.jwtSecret'),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PsychologistsModule,
    TherapistAssignmentsModule,
    StudentsModule,
    SchedulesModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsContextInterceptor },
  ],
})
export class AppModule {}
