import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '../history/history.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const historyService = { canWrite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HistoryService, useValue: historyService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('reports a healthy status with numeric uptime', () => {
    historyService.canWrite.mockReturnValue(true);

    const result = service.check();

    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(typeof result.timestamp).toBe('string');
    expect(result.storage).toEqual({ writable: true });
  });

  it('reflects when the storage is not writable', () => {
    historyService.canWrite.mockReturnValue(false);

    const result = service.check();

    expect(result.storage).toEqual({ writable: false });
  });
});
