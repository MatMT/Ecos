import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';

@Injectable()
export class ClinicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  create(
    studentId: number,
    dto: CreateClinicalRecordDto,
    currentUser?: RequestUser,
  ) {
    return this.prisma.withRls(async (tx) => {
      const user = this.requireCurrentUser(currentUser);
      const student = await tx.studentProfile.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(
          'No se ha encontrado el paciente indicado.',
        );
      }

      const existing = await tx.clinicalRecord.findUnique({
        where: { studentId },
      });
      if (existing) {
        throw new ConflictException(
          'El paciente ya cuenta con un expediente clínico.',
        );
      }

      const record = await tx.clinicalRecord.create({
        data: { studentId, ...dto },
      });

      await this.auditService.log(tx, {
        userId: user.id,
        institutionId: user.institutionId,
        action: 'CLINICAL_RECORD_CREATED',
        entity: 'ClinicalRecord',
        entityId: String(record.id),
      });

      return record;
    });
  }

  findOne(studentId: number, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const record = await tx.clinicalRecord.findUnique({
        where: { studentId },
      });
      if (!record) {
        throw new NotFoundException(
          'No se ha encontrado el expediente clínico solicitado.',
        );
      }

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'CLINICAL_RECORD_VIEWED',
        entity: 'ClinicalRecord',
        entityId: String(record.id),
      });

      return record;
    });
  }

  update(
    studentId: number,
    dto: UpdateClinicalRecordDto,
    currentUser?: RequestUser,
  ) {
    return this.prisma.withRls(async (tx) => {
      const user = this.requireCurrentUser(currentUser);
      const existing = await tx.clinicalRecord.findUnique({
        where: { studentId },
      });
      if (!existing) {
        throw new NotFoundException(
          'No se ha encontrado el expediente clínico solicitado.',
        );
      }
      const record = await tx.clinicalRecord.update({
        where: { studentId },
        data: dto,
      });

      await this.auditService.log(tx, {
        userId: user.id,
        institutionId: user.institutionId,
        action: 'CLINICAL_RECORD_UPDATED',
        entity: 'ClinicalRecord',
        entityId: String(record.id),
      });

      return record;
    });
  }

  private requireCurrentUser(currentUser?: RequestUser): RequestUser {
    if (!currentUser) {
      throw new ForbiddenException('No se ha podido identificar al usuario.');
    }

    return currentUser;
  }
}
