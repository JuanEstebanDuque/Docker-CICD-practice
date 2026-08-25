import { Module } from '@nestjs/common';
import { CalculatorModule } from './calculator/calculator.module';
import { HistoryModule } from './history/history.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [CalculatorModule, HistoryModule, HealthModule],
})
export class AppModule {}
