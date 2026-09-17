import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Public endpoint used to confirm the API is up and responding.',
  })
  @ApiResponse({
    status: 200,
    description: 'The API is running normally.',
    schema: {
      example: {
        status: 'ECOS API is running normally',
        timestamp: '2026-09-16T12:00:00.000Z',
      },
    },
  })
  getHealthStatus() {
    return this.appService.getHealthStatus();
  }
}
