import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { groupBy } from 'lodash';
import {
  ILeague,
  ILeagueApiResponse,
  ISquad,
  ITeamFixturesApiResponse,
  ITeamFixturesResponse,
  ITeamLeaguesApiResponse,
  ITeamLeagueResponse,
  ITeamCoachApiResponse,
  ITeamCoachResponse,
  ITeamPlayerInjuresApiResponse,
  ITeamPlayerInjuresResponse,
  BaseApiResponse,
} from '@app/interfaces';
import { ITeam, ITeamApiResponse, ITeamSeasonsApiResponse, ITeamSquadApiResponse } from '@app/interfaces';
import { isAfter, isSameYear, format } from 'date-fns';
import { IFixtureBetApiResponse, IFixtureOddsApiResponse } from '@app/interfaces/odds';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);

  constructor(private readonly httpService: HttpService) {}

  checkLimitError(response: BaseApiResponse) {
    if (response.errors && response.errors?.requests) {
      this.logger.error(response.errors?.requests);
      throw new Error('You have reached the request limit for the day');
    }
  }

  async findAllLeaguesByCountry(countryCode: string): Promise<ILeague[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ILeagueApiResponse>(`/leagues?code=${countryCode}&type=league&current=true`),
    );
    this.checkLimitError(data);

    return data.response.map(({ league }) => league);
  }

  async findAllTeamsByLeague(leagueId: number): Promise<ITeam[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamApiResponse>(`/teams?league=${leagueId}&season=${new Date().getFullYear() - 1}`),
    );
    this.checkLimitError(data);

    return data.response.map(({ team }) => team);
  }

  async findTeamById(teamId: number): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.get<ITeamApiResponse>(`/teams?id=${teamId}`));
    this.checkLimitError(data);

    return data.response.map(({ team }) => team);
  }

  async findTeamSeasons(teamId: number): Promise<number> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamSeasonsApiResponse>(`/teams/seasons?team=${teamId}`),
    );
    this.checkLimitError(data);

    if (data.response.length) {
      return data.response[data.response.length - 1];
    }

    return new Date().getFullYear();
  }

  async findTeamLeagues(teamId: number): Promise<ITeamLeagueResponse[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamLeaguesApiResponse>(`/leagues?team=${teamId}&current=true`),
    );
    this.checkLimitError(data);

    return data.response.filter(({ seasons }) => {
      const season = seasons[0];
      const currentDate = Date.now();
      // fix api. sometimes expired seasons can remain active
      return isSameYear(season.end, currentDate) || isAfter(season.end, currentDate);
    });
  }

  async findTeamPlayers(teamId: number): Promise<ISquad> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamSquadApiResponse>(`/players/squads?team=${teamId}`),
    );
    this.checkLimitError(data);

    const players = data.response?.[0]?.players || [];

    return groupBy(players, 'position') as ISquad;
  }

  async findTeamCoach(teamId: number): Promise<ITeamCoachResponse | undefined> {
    const { data } = await firstValueFrom(this.httpService.get<ITeamCoachApiResponse>(`/coachs?team=${teamId}`));
    this.checkLimitError(data);

    return data.response.find(({ career }) => career.find(({ team, end }) => team.id === teamId && end === null));
  }

  async findTeamPlayerInjures(teamId: number): Promise<ITeamPlayerInjuresResponse[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamPlayerInjuresApiResponse>(
        `/injuries?team=${teamId}&date=${format(Date.now(), 'yyyy-MM-dd')}`,
      ),
    );
    this.checkLimitError(data);

    return data.response;
  }

  async findTeamSquad(teamId: number) {
    return Promise.all([this.findTeamPlayers(teamId), this.findTeamPlayerInjures(teamId), this.findTeamCoach(teamId)]);
  }

  async findTeamFeatureGames(teamId: number): Promise<ITeamFixturesResponse[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<ITeamFixturesApiResponse>(`/fixtures?team=${teamId}&next=5`),
    );
    this.checkLimitError(data);

    return data.response;
  }

  async findFixtureBets() {
    const { data } = await firstValueFrom(this.httpService.get<IFixtureBetApiResponse>(`/odds/bets`));
    this.checkLimitError(data);

    return data.response;
  }

  async findFixtureOdds(fixture: number, bet: number, page: number | undefined = 1) {
    const { data } = await firstValueFrom(
      this.httpService.get<IFixtureOddsApiResponse>(`/odds?bet=${bet}&fixture=${fixture}&page=${page}`),
    );
    this.checkLimitError(data);

    return data.response;
  }
}
