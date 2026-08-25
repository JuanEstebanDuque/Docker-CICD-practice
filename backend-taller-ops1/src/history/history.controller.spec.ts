import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

describe('HistoryController', () => {
  let controller: HistoryController;
  const historyService = { getLast: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [{ provide: HistoryService, useValue: historyService }],
    }).compile();

    controller = module.get<HistoryController>(HistoryController);
  });

  it('defaults to the last 5 entries when no limit is given', () => {
    historyService.getLast.mockReturnValue([]);

    controller.findLast(undefined);

    expect(historyService.getLast).toHaveBeenCalledWith(5);
  });

  it('respects a valid limit query param', () => {
    historyService.getLast.mockReturnValue([]);

    controller.findLast('10');

    expect(historyService.getLast).toHaveBeenCalledWith(10);
  });

  it('clamps the limit between 1 and 50', () => {
    historyService.getLast.mockReturnValue([]);

    controller.findLast('999');
    expect(historyService.getLast).toHaveBeenCalledWith(50);

    controller.findLast('0');
    expect(historyService.getLast).toHaveBeenCalledWith(1);
  });

  it('wraps the service result in a data envelope', () => {
    const entries = [
      { operation: 'sum', a: 1, b: 1, result: 2, timestamp: 't' },
    ];
    historyService.getLast.mockReturnValue(entries);

    expect(controller.findLast('5')).toEqual({ data: entries });
  });
});
