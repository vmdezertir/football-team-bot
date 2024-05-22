import { BaseApiResponse } from './common';

export interface ILeague {
  id: number;
  name: string;
  type: string;
  logo: string;
}

interface ILeagueResponse {
  league: ILeague;
}

export interface ILeagueApiResponse extends BaseApiResponse {
  response: ILeagueResponse[];
}
