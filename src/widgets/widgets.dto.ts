import {
  IFollowOdd,
  IFollowOddBookmaker,
  IFollowOddValue,
  IOddsTableData,
  IPlayerStatsWidgetContent,
  IPlayersStatsResponse,
} from '@app/interfaces';
import { IsArray, IsDefined, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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
  @IsInt()
  season: number;
}

export class WidgetsGamesRespDto extends BaseWidgetDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  leagueId: number;

  @IsOptional()
  @IsInt()
  season: number;
}

class WidgetFixtureOddValue implements IFollowOddValue {
  @IsDefined()
  @IsInt()
  @Min(1)
  id: number;

  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsArray()
  bookmakers: IFollowOddBookmaker[];

  @IsDefined()
  @IsString({ each: true })
  betValTitles: string[];
}

class WidgetFixtureOdd implements IFollowOdd {
  [key: number]: WidgetFixtureOddValue;
}

export class WidgetOddsTableDto implements IOddsTableData {
  @IsDefined()
  @IsInt()
  @Min(1)
  id: number;

  @IsDefined()
  @ValidateNested()
  rows: string[][];

  @IsDefined()
  @IsString({ each: true })
  titles: string[];
}

export class WidgetsFixtureOddsDto {
  @IsDefined()
  @ValidateNested()
  tabs: WidgetFixtureOdd;

  @IsDefined()
  @ValidateNested({ each: true })
  tables: WidgetOddsTableDto[];
}

export class WidgetPlayerStatsDto implements IPlayerStatsWidgetContent {
  [key: string]: IPlayersStatsResponse[];
}
export class WidgetsLeagueStatsRespDto {
  @IsDefined()
  @IsString({ each: true })
  tabs: string[];

  @IsDefined()
  @ValidateNested()
  contents: WidgetPlayerStatsDto;
}
