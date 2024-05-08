import { IsDefined, IsInt, IsString, Min } from 'class-validator';

export class WidgetsGameRespDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  id: number;

  @IsDefined()
  @IsString()
  apiHost: string;

  @IsDefined()
  @IsString()
  apiKey: string;
}
