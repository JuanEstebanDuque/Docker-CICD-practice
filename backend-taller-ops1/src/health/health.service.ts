import { Injectable } from '@nestjs/common';
import { HistoryService } from '../history/history.service';

@Injectable()
export class HealthService {
  constructor(private readonly historyService: HistoryService) {}

  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      storage: {
        writable: this.historyService.canWrite(),
      },
    };
  }
}
