import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculatorService],
    }).compile();

    service = module.get<CalculatorService>(CalculatorService);
  });

  it('sums two numbers', () => {
    expect(service.sum(2, 3)).toBe(5);
    expect(service.sum(-2, 3)).toBe(1);
  });

  it('subtracts two numbers', () => {
    expect(service.subtract(5, 3)).toBe(2);
    expect(service.subtract(3, 5)).toBe(-2);
  });

  it('multiplies two numbers', () => {
    expect(service.multiply(4, 3)).toBe(12);
    expect(service.multiply(-4, 3)).toBe(-12);
  });

  it('divides two numbers', () => {
    expect(service.divide(10, 2)).toBe(5);
  });

  it('throws a BadRequestException when dividing by zero', () => {
    expect(() => service.divide(10, 0)).toThrow(BadRequestException);
  });
});
