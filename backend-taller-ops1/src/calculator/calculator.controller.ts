import { Body, Controller, Logger, Post } from '@nestjs/common';
import { parseOperands } from '../common/parse-operands';
import { HistoryService } from '../history/history.service';
import { CalculatorService } from './calculator.service';
import { SumDto } from './dto/sum.dto';
import { SubtractDto } from './dto/subtract.dto';
import { MultiplyDto } from './dto/multiply.dto';
import { DivideDto } from './dto/divide.dto';

@Controller()
export class CalculatorController {
  private readonly logger = new Logger(CalculatorController.name);

  constructor(
    private readonly calculatorService: CalculatorService,
    private readonly historyService: HistoryService,
  ) {}

  @Post('sum')
  sum(@Body() body: SumDto) {
    const { a, b } = parseOperands(body);
    const result = this.calculatorService.sum(a, b);
    this.historyService.record({ operation: 'sum', a, b, result });
    return { result };
  }

  @Post('subtract')
  subtract(@Body() body: SubtractDto) {
    const { a, b } = parseOperands(body);
    const result = this.calculatorService.subtract(a, b);
    this.historyService.record({ operation: 'subtract', a, b, result });
    return { result };
  }

  @Post('multiply')
  multiply(@Body() body: MultiplyDto) {
    const { a, b } = parseOperands(body);
    const result = this.calculatorService.multiply(a, b);
    this.historyService.record({ operation: 'multiply', a, b, result });
    return { result };
  }

  @Post('divide')
  divide(@Body() body: DivideDto) {
    const { a, b } = parseOperands(body);
    try {
      const result = this.calculatorService.divide(a, b);
      this.historyService.record({ operation: 'divide', a, b, result });
      return { result };
    } catch (err) {
      this.logger.warn(`División por cero rechazada: a=${a}, b=${b}`);
      throw err;
    }
  }
}
