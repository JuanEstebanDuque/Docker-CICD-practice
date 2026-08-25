import { Controller, Get, Query } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  findLast(@Query('limit') limit?: string) {
    const requested = limit === undefined ? NaN : Number(limit);
    const parsedLimit = Number.isNaN(requested)
      ? 5
      : Math.min(Math.max(requested, 1), 50);
    return { data: this.historyService.getLast(parsedLimit) };
  }
}
