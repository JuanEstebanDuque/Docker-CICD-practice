import { Module } from '@nestjs/common';
import { HistoryModule } from '../history/history.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [HistoryModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
