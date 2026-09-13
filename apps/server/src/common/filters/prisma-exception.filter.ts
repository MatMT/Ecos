import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

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

    switch (exception.code) {
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
