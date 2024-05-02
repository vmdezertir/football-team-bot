export interface ITeam {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: string;
  national: boolean;
  logo: string;
}

interface ITeamResponse {
  team: ITeam;
}

export interface ITeamApiResponse {
  get: string;
  results: number;
  response: ITeamResponse[];
}
