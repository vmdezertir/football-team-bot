import { IsDefined, IsInt, IsOptional, IsString, Min } from 'class-validator';

class BaseWidgetDto {
  @IsDefined()
  @IsString()
  apiHost: string;

  @IsDefined()
  @IsString()
  apiKey: string;
}

export class WidgetsGameRespDto extends BaseWidgetDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  id: number;
}

export class WidgetsStandingsRespDto extends BaseWidgetDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  leagueId: number;

  @IsOptional()
  @IsString()
  season?: string;
}

export class WidgetsGamesRespDto extends BaseWidgetDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  leagueId: number;

  @IsOptional()
  @IsString()
  season?: string;
}
