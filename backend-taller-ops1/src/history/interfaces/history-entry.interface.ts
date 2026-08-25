export type OperationType = 'sum' | 'subtract' | 'multiply' | 'divide';

export interface HistoryEntry {
  operation: OperationType;
  a: number;
  b: number;
  result: number;
  timestamp: string;
}
