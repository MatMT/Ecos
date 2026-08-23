import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthStatus(): { status: string; timestamp: string } {
    return {
      status: 'ECOS API is running normally',
      timestamp: new Date().toISOString(),
    };
  }
}
