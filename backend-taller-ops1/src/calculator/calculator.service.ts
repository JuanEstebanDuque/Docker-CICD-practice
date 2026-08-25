import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class CalculatorService {
  sum(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'No es posible dividir por cero.',
      });
    }
    return a / b;
  }
}
