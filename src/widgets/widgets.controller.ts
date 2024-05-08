import { Controller, Get, HttpCode, HttpStatus, Param, Render } from '@nestjs/common';
import { WidgetsGameRespDto } from './widgets.dto';
import { ConfigService } from '@nestjs/config';

@Controller('widgets')
export class WidgetsController {
  constructor(private configService: ConfigService) {}

  @Get('game/:id')
  @Render('game')
  @HttpCode(HttpStatus.OK)
  async getGame(@Param('id') id: number): Promise<WidgetsGameRespDto> {
    return { id, apiHost: this.configService.get('FOOTBALL_API_HOST'), apiKey: this.configService.get('FOOTBALL_API_KEY') };
  }
}
