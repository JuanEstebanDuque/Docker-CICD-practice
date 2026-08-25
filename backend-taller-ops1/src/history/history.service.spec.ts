import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { HistoryEntry } from './interfaces/history-entry.interface';
import { HistoryService } from './history.service';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryService],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  describe('getLast', () => {
    it('returns the most recent entries first, respecting the limit', () => {
      const entries = [
        { operation: 'sum', a: 1, b: 1, result: 2, timestamp: 't1' },
        { operation: 'subtract', a: 5, b: 2, result: 3, timestamp: 't2' },
        { operation: 'multiply', a: 2, b: 3, result: 6, timestamp: 't3' },
      ];
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(entries));

      const result = service.getLast(2);

      expect(result).toEqual([entries[2], entries[1]]);
    });

    it('returns an empty array when the file cannot be read', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('disk error');
      });

      expect(service.getLast()).toEqual([]);
    });
  });

  describe('record', () => {
    it('appends a new entry with an ISO timestamp', () => {
      mockedFs.readFileSync.mockReturnValue('[]');

      service.record({ operation: 'sum', a: 2, b: 3, result: 5 });

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [, written] = mockedFs.writeFileSync.mock.calls[0];
      const saved = JSON.parse(written as string) as HistoryEntry[];
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({
        operation: 'sum',
        a: 2,
        b: 3,
        result: 5,
      });
      expect(typeof saved[0].timestamp).toBe('string');
    });

    it('does not throw when writing fails', () => {
      mockedFs.readFileSync.mockReturnValue('[]');
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('disk full');
      });

      expect(() =>
        service.record({ operation: 'sum', a: 1, b: 1, result: 2 }),
      ).not.toThrow();
    });
  });

  describe('canWrite', () => {
    it('returns true when the file is writable', () => {
      mockedFs.accessSync.mockReturnValue(undefined);
      expect(service.canWrite()).toBe(true);
    });

    it('returns false when access is denied', () => {
      mockedFs.accessSync.mockImplementation(() => {
        throw new Error('EACCES');
      });
      expect(service.canWrite()).toBe(false);
    });
  });
});
