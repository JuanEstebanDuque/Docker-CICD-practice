import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HistoryEntry } from './interfaces/history-entry.interface';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly filePath = path.join(process.cwd(), 'data', 'history.json');

  constructor() {
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
    }
  }

  private readAll(): HistoryEntry[] {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as HistoryEntry[];
    } catch (err) {
      this.logger.error(
        'No se pudo leer history.json, se asume historial vacío',
        err as Error,
      );
      return [];
    }
  }

  record(entry: Omit<HistoryEntry, 'timestamp'>): void {
    try {
      const all = this.readAll();
      all.push({ ...entry, timestamp: new Date().toISOString() });
      fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('No se pudo escribir en el historial', err as Error);
    }
  }

  getLast(limit = 5): HistoryEntry[] {
    const all = this.readAll();
    return all.slice(-limit).reverse();
  }

  canWrite(): boolean {
    try {
      fs.accessSync(this.filePath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
