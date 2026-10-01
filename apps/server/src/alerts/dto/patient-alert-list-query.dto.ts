import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PatientAlertListQueryDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsEnum(AlertStatus, { message: 'El estado de alerta no es válido.' })
  @IsOptional()
  status?: AlertStatus;

  @ApiPropertyOptional({ enum: AlertType })
  @IsEnum(AlertType, { message: 'El tipo de alerta no es válido.' })
  @IsOptional()
  alertType?: AlertType;

  @ApiPropertyOptional({ enum: AlertPriority })
  @IsEnum(AlertPriority, { message: 'La prioridad de alerta no es válida.' })
  @IsOptional()
  priority?: AlertPriority;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'El desplazamiento debe ser un número entero.' })
  @Min(0, { message: 'El desplazamiento no puede ser negativo.' })
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser al menos uno.' })
  @Max(100, { message: 'El tamaño de página no puede superar cien.' })
  @IsOptional()
  take?: number;
}
