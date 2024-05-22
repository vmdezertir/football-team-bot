import { Controller, Get, HttpCode, HttpStatus, Param, Query, Render } from '@nestjs/common';
import { WidgetsGameRespDto, WidgetsGamesRespDto, WidgetsStandingsRespDto } from './widgets.dto';
import { ConfigService } from '@nestjs/config';

@Controller('widgets')
export class WidgetsController {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  @Get('game/:id')
  @Render('game')
  @HttpCode(HttpStatus.OK)
  async getGame(@Param('id') id: number): Promise<WidgetsGameRespDto> {
    return {
      id,
      apiHost: this.configService.get('FOOTBALL_API_HOST') as string,
      apiKey: this.configService.get('FOOTBALL_API_KEY') as string,
    };
  }

  @Get('games/:leagueId')
  @Render('games')
  @HttpCode(HttpStatus.OK)
  async getGames(@Param('leagueId') leagueId: number, @Query('season') season: number): Promise<WidgetsGamesRespDto> {
    return {
      leagueId,
      season,
      apiHost: this.configService.get('FOOTBALL_API_HOST') as string,
      apiKey: this.configService.get('FOOTBALL_API_KEY') as string,
    };
  }

  @Get('standings/:leagueId')
  @Render('standings')
  @HttpCode(HttpStatus.OK)
  async getStandings(
    @Param('leagueId') leagueId: number,
    @Query('season') season: number,
  ): Promise<WidgetsStandingsRespDto> {
    return {
      leagueId,
      season,
      apiHost: this.configService.get('FOOTBALL_API_HOST') as string,
      apiKey: this.configService.get('FOOTBALL_API_KEY') as string,
    };
  }
}
