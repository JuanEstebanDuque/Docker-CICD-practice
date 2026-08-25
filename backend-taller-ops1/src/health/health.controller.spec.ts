import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const healthService = { check: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('delegates to the health service', () => {
    const payload = {
      status: 'ok',
      uptime: 1,
      timestamp: 't',
      storage: { writable: true },
    };
    healthService.check.mockReturnValue(payload);

    expect(controller.check()).toEqual(payload);
  });
});
