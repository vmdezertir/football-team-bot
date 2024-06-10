import { BaseApiResponse } from './common';
import { IPlayer, IPlayerInjure } from './player';
import { ILeague } from './league';
import { EFixtureStatus } from './fixtureStatus';

export interface IShortInfoTeam {
  id: number;
  name: string;
  logo: string;
}
export interface ITeam extends IShortInfoTeam {
  code: string;
  country: string;
  founded: string;
  national: boolean;
}

export interface ITeamResponse {
  team: ITeam;
}

export interface ITeamSquadResponse {
  team: IShortInfoTeam;
  players: IPlayer[];
}

export interface ITeamApiResponse extends BaseApiResponse {
  response: ITeamResponse[];
}

export interface ITeamSeasonsApiResponse extends BaseApiResponse {
  response: number[];
}

export interface ITeamSquadApiResponse extends BaseApiResponse {
  response: ITeamSquadResponse[];
}

export interface IFixtureStatus {
  long: string;
  short: EFixtureStatus;
  elapsed: number;
}
export interface IFixture {
  id: number;
  referee?: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  status: IFixtureStatus;
}

interface IFLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
}

interface IFTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean;
}
export interface ITeamFixturesResponse {
  fixture: IFixture;
  league: IFLeague;
  teams: {
    home: IFTeam;
    away: IFTeam;
  };
}

export interface ITeamFixturesApiResponse extends BaseApiResponse {
  response: ITeamFixturesResponse[];
}

export type ITeamFixtureByLeague = {
  [key: number]: ITeamFixturesResponse[];
};

interface ICountry {
  name: string;
  code: string;
  flag: string;
}

interface ITeamSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: object;
}
export interface ITeamLeagueResponse {
  league: ILeague;
  country: ICountry;
  seasons: ITeamSeason[];
}
export interface ITeamLeaguesApiResponse extends BaseApiResponse {
  response: ITeamLeagueResponse[];
}

export interface ICareer {
  team: IShortInfoTeam;
  start: string;
  end: string | null;
}
export interface ITeamCoachResponse {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: 47;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  photo: string;
  team: IShortInfoTeam;
  career: ICareer[];
}

export interface ITeamCoachApiResponse extends BaseApiResponse {
  response: ITeamCoachResponse[];
}

export interface IPLeague {
  id: number;
  season: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
}

export interface ITeamPlayerInjuresResponse {
  player: IPlayerInjure;
  team: IShortInfoTeam;
  fixture: IFixture;
  league: IPLeague;
}
export interface ITeamPlayerInjuresApiResponse extends BaseApiResponse {
  response: ITeamPlayerInjuresResponse[];
}
