import {ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';


export class FindStudentsQueryDto {
    @ApiPropertyOptional({default: 0, minimum: 0})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip: number = 0;

    @ApiPropertyOptional({default:20,minimum:1,maximum:100})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    take: number = 20;

    @ApiPropertyOptional({description: 'Filter by student name, email, or student code'})
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({description: 'Filter by assigned psychologist UUID'})
    @IsOptional()
    @IsUUID()
    therapistId?: string;
}