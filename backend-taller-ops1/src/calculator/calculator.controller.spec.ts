import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '../history/history.service';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';

describe('CalculatorController', () => {
  let controller: CalculatorController;
  const historyService = { record: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculatorController],
      providers: [
        CalculatorService,
        { provide: HistoryService, useValue: historyService },
      ],
    }).compile();

    controller = module.get<CalculatorController>(CalculatorController);
  });

  it('sums and records the operation', () => {
    expect(controller.sum({ a: 2, b: 3 })).toEqual({ result: 5 });
    expect(historyService.record).toHaveBeenCalledWith({
      operation: 'sum',
      a: 2,
      b: 3,
      result: 5,
    });
  });

  it('subtracts and records the operation', () => {
    expect(controller.subtract({ a: 5, b: 3 })).toEqual({ result: 2 });
    expect(historyService.record).toHaveBeenCalledWith({
      operation: 'subtract',
      a: 5,
      b: 3,
      result: 2,
    });
  });

  it('multiplies and records the operation', () => {
    expect(controller.multiply({ a: 4, b: 3 })).toEqual({ result: 12 });
    expect(historyService.record).toHaveBeenCalledWith({
      operation: 'multiply',
      a: 4,
      b: 3,
      result: 12,
    });
  });

  it('divides and records the operation', () => {
    expect(controller.divide({ a: 10, b: 2 })).toEqual({ result: 5 });
    expect(historyService.record).toHaveBeenCalledWith({
      operation: 'divide',
      a: 10,
      b: 2,
      result: 5,
    });
  });

  it('rejects division by zero without touching the history', () => {
    expect(() => controller.divide({ a: 10, b: 0 })).toThrow(
      BadRequestException,
    );
    expect(historyService.record).not.toHaveBeenCalled();
  });

  it('rejects missing or non-numeric operands', () => {
    expect(() =>
      controller.sum({ a: undefined as unknown as number, b: 1 }),
    ).toThrow(BadRequestException);
    expect(historyService.record).not.toHaveBeenCalled();
  });
});
