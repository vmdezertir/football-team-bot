import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ILeague, ILeagueApiResponse } from '@app/interfaces';
import { ITeam, ITeamApiResponse } from '@app/interfaces/team';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);

  constructor(private readonly httpService: HttpService) {}

  async findAllLeaguesByCountry(countryCode: string): Promise<ILeague[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ILeagueApiResponse>(`/leagues?code=${countryCode}&type=league&current=true`),
    );

    return data.response.map(({ league }) => league);
  }

  async findAllTeamsByLeague(leagueId: number): Promise<ITeam[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamApiResponse>(`/teams?league=${leagueId}&season=${new Date().getFullYear() - 1}`),
    );
    return data.response.map(({ team }) => team);
  }

  async findTeamById(teamId: number): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.get<ITeamApiResponse>(`/teams?id=${teamId}`));
    return data.response.map(({ team }) => team);
  }
}
