import { Body, Controller, Get, Post } from '@nestjs/common';
import { GameFormatsService } from './game-formats.service';

@Controller('game-formats')
export class GameFormatsController {
  constructor(private readonly gameFormatsService: GameFormatsService) {}

  @Get('unmatched-time-controls')
  getUnmatchedTimeControls() {
    return this.gameFormatsService.getUnmatchedTimeControls();
  }

  @Post('add-time-control')
  addTimeControl(
    @Body()
    body: {
      raw: string;
      time: string;
      increment: number;
      additionalTime: number | null;
    },
  ) {
    this.gameFormatsService.addTimeControl(body.raw, {
      time: body.time,
      increment: body.increment,
      additionalTime: body.additionalTime,
    });

    return { message: 'Time control added successfully' };
  }
}
