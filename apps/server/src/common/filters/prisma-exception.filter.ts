import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface DriverAdapterErrorMeta {
  driverAdapterError?: {
    cause?: {
      code?: string;
      message?: string;
    };
  };
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      'Ha ocurrido un error en el procesamiento de la solicitud. Por favor, intente nuevamente.';

    // Raw Postgres errors (driver-adapter passthrough — trigger RAISE EXCEPTION, RLS
    // denials, etc.) surface as Prisma's generic P2039 with the real code/message nested
    // in meta.driverAdapterError.cause, not as one of Prisma's own known codes.
    const driverCause = (exception.meta as DriverAdapterErrorMeta | undefined)
      ?.driverAdapterError?.cause;

    switch (driverCause?.code ?? exception.code) {
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'No se ha encontrado el recurso solicitado.';
        break;
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con los datos proporcionados.';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message =
          'La operación viola una restricción de integridad referencial.';
        break;
      case 'P0001':
        // A trigger (e.g. protect_privileged_columns) explicitly rejected the operation —
        // this is an authorization refusal, not a server bug. The message is one we raise
        // ourselves in application-owned triggers, so it's safe to surface as-is.
        status = HttpStatus.FORBIDDEN;
        message = driverCause?.message ?? message;
        break;
      case '23P01':
        // Exclusion constraint violation (e.g. remote_appointments_no_doctor_overlap) —
        // Postgres's own code for this, distinct from 23505/P2002 which only covers plain
        // unique-constraint violations. Not representable in schema.prisma, so Prisma has no
        // native mapping for it — same raw-driver-passthrough situation as P0001 above.
        status = HttpStatus.CONFLICT;
        message =
          'El horario indicado se superpone con otra cita ya existente.';
        break;
    }

    this.logger.error(
      `Prisma ${exception.code} on ${request.method} ${request.url}: ${exception.message}`,
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
