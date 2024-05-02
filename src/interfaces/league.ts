export interface ILeague {
  id: number;
  name: string;
  type: string;
  logo: string;
}

interface ILeagueResponse {
  league: ILeague;
}

export interface ILeagueApiResponse {
  get: string;
  results: number;
  response: ILeagueResponse[];
}
