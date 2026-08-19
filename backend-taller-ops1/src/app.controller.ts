import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

class SumDto {  
  a: number;
  b: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('sum')
  sum(@Body() body: SumDto) {
    const a = Number(body?.a) ?? 0;
    const b = Number(body?.b) ?? 0;
    const result = this.appService.sum(a, b);
    return { result };
  }
}
