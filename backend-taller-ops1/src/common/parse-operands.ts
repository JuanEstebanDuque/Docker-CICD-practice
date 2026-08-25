import { BadRequestException } from '@nestjs/common';

export interface RawOperands {
  a?: unknown;
  b?: unknown;
}

export function parseOperands(body: RawOperands): { a: number; b: number } {
  const a = Number(body?.a);
  const b = Number(body?.b);

  if (
    body?.a === undefined ||
    body?.b === undefined ||
    Number.isNaN(a) ||
    Number.isNaN(b)
  ) {
    throw new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Los operandos "a" y "b" son requeridos y deben ser numéricos.',
    });
  }

  return { a, b };
}
