import { Injectable, Logger } from '@nestjs/common';
import Axios from 'axios';
import { groupBy } from 'lodash';
import {
  ILeague,
  ISquad,
  ITeamFixturesResponse,
  ITeamLeagueResponse,
  ITeamCoachResponse,
  ITeamPlayerInjuresResponse,
  IFixturePredictionResponse,
  IFixtureOddsResponse,
  IBet,
  ITeamSquadResponse,
  ITeamResponse,
  ILeagueResponse,
  IPlayersStatsResponse,
  IPlayerStatsWidgetContent,
  IBookmakers,
} from '@app/interfaces';
import { ITeam } from '@app/interfaces';
import { isAfter, isSameYear, format } from 'date-fns';
import { AxiosCacheInstance, setupCache, CacheRequestConfig } from 'axios-cache-interceptor';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  axiosInstance: AxiosCacheInstance;
  oneHourCache: number;
  oneDayCache: number;

  constructor(private readonly configService: ConfigService) {
    // TODO: switch cache from Memory Storage to Redis
    this.axiosInstance = setupCache(
      Axios.create({
        baseURL: `https://${this.configService.get('FOOTBALL_API_HOST')}`,
        headers: {
          'x-rapidapi-host': this.configService.get('FOOTBALL_API_HOST'),
          'x-rapidapi-key': this.configService.get('FOOTBALL_API_KEY'),
        },
      }),
    );
    this.oneHourCache = 1000 * 60 * 60;
    // Recommended Calls : 1 call per day. But we will reduce it to 12 hour
    this.oneDayCache = 1000 * 60 * 720;
  }

  private async getRequest<T = any>(url: string, config?: CacheRequestConfig): Promise<T> {
    const { data } = await this.axiosInstance.get(url, config);
    if (data.response.errors && data.response.errors?.requests) {
      this.logger.error(data.response.errors?.requests);
      throw new Error('You have reached the request limit for the day');
    }

    return data.response;
  }

  async findAllLeaguesByCountry(countryCode: string): Promise<ILeague[]> {
    const response = await this.getRequest<ILeagueResponse[]>(`/leagues?code=${countryCode}&type=league&current=true`, {
      cache: {
        ttl: this.oneHourCache,
      },
    });

    return response.map(({ league }) => league);
  }

  async findAllTeamsByLeague(leagueId: number): Promise<ITeam[]> {
    const response = await this.getRequest<ITeamResponse[]>(
      `/teams?league=${leagueId}&season=${new Date().getFullYear() - 1}`,
      {
        cache: {
          ttl: this.oneDayCache,
        },
      },
    );

    return response.map(({ team }) => team);
  }

  async findTeamById(teamId: number): Promise<ITeam[]> {
    const response = await this.getRequest<ITeamResponse[]>(`/teams?id=${teamId}`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });

    return response.map(({ team }) => team);
  }

  async findTeamSeasons(teamId: number): Promise<number> {
    const response = await this.getRequest<number[]>(`/teams/seasons?team=${teamId}`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });

    if (response.length) {
      return response[response.length - 1];
    }

    return new Date().getFullYear();
  }

  async findTeamLeagues(teamId: number): Promise<ITeamLeagueResponse[]> {
    const response = await this.getRequest<ITeamLeagueResponse[]>(`/leagues?team=${teamId}&current=true`, {
      cache: {
        ttl: this.oneHourCache,
      },
    });

    return response.filter(({ seasons }) => {
      const season = seasons[0];
      const currentDate = Date.now();
      // fix api. sometimes expired seasons can remain active
      return isSameYear(season.end, currentDate) || isAfter(season.end, currentDate);
    });
  }

  async findTeamPlayers(teamId: number): Promise<ISquad> {
    const response = await this.getRequest<ITeamSquadResponse[]>(`/players/squads?team=${teamId}`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });
    const players = response?.[0]?.players || [];

    return groupBy(players, 'position') as ISquad;
  }

  async findTeamCoach(teamId: number): Promise<ITeamCoachResponse | undefined> {
    const response = await this.getRequest<ITeamCoachResponse[]>(`/coachs?team=${teamId}`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });

    return response.find(({ career }) => career.find(({ team, end }) => team.id === teamId && end === null));
  }

  async findTeamPlayerInjures(teamId: number): Promise<ITeamPlayerInjuresResponse[]> {
    return this.getRequest<ITeamPlayerInjuresResponse[]>(
      `/injuries?team=${teamId}&date=${format(Date.now(), 'yyyy-MM-dd')}`,
      {
        cache: {
          ttl: this.oneDayCache,
        },
      },
    );
  }

  async findTeamSquad(teamId: number) {
    return Promise.all([this.findTeamPlayers(teamId), this.findTeamPlayerInjures(teamId), this.findTeamCoach(teamId)]);
  }

  async findTeamFeatureGames(teamId: number): Promise<ITeamFixturesResponse[]> {
    return this.getRequest<ITeamFixturesResponse[]>(`/fixtures?team=${teamId}&next=5&timezone=Europe/Kiev`, {
      cache: {
        ttl: 1000 * 60 * 5,
      },
    });
  }

  async findFixtureBets(): Promise<IBet[]> {
    const response = await this.getRequest<IBet[]>(`/odds/bets`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });

    if (!response) {
      return [];
    }

    return response.filter(b => b.id && b.name);
  }

  async findFixtureOdds(fixture: number): Promise<IBookmakers[]> {
    const response = await this.getRequest<IFixtureOddsResponse[]>(`/odds?fixture=${fixture}`, {
      cache: {
        ttl: this.oneHourCache,
      },
    });

    if (!response) {
      return [];
    }

    const bookmakersData = response[0]?.bookmakers;

    if (!bookmakersData) {
      this.logger.error(`No found bookmakers data inside response`);
      return [];
    }

    return bookmakersData;
  }

  async findFixturePrediction(fixture: number): Promise<IFixturePredictionResponse[]> {
    return this.getRequest<IFixturePredictionResponse[]>(`/predictions?fixture=${fixture}`, {
      cache: {
        ttl: this.oneHourCache,
      },
    });
  }

  async findLeagueStats(leagueId: number, season: number): Promise<IPlayerStatsWidgetContent> {
    const paths = ['topscorers', 'topassists', 'topyellowcards', 'topredcards'];
    const promises = paths.map(path =>
      this.getRequest<IPlayersStatsResponse[]>(`/players/${path}?league=${leagueId}&season=${season}`, {
        cache: {
          ttl: this.oneDayCache,
        },
      }),
    );
    const data = await Promise.allSettled(promises);

    return data.reduce((acc, response, cIndex) => {
      if (response.status !== 'fulfilled') {
        return acc;
      }
      const { value } = response as PromiseFulfilledResult<IPlayersStatsResponse[]>;
      const key = paths[cIndex];
      acc[key] = value;
      return acc;
    }, {} as IPlayerStatsWidgetContent);
  }

  async findBookmakers(): Promise<IBet[]> {
    const response = await this.getRequest<IBet[]>(`/odds/bookmakers`, {
      cache: {
        ttl: this.oneDayCache,
      },
    });

    if (!response) {
      return [];
    }

    return response.filter(b => b.id && b.name);
  }
}
