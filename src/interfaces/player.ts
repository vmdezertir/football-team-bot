import { IShortInfoTeam } from './team';

export enum EPlayerPosition {
  Goalkeeper = 'Goalkeeper',
  Defender = 'Defender',
  Midfielder = 'Midfielder',
  Attacker = 'Attacker',
}

export interface IPlayer {
  id: number;
  name: string;
  age: number;
  number: number;
  position: EPlayerPosition;
  photo: string;
}

export type ISquad = {
  [key in EPlayerPosition]: IPlayer[];
};

export interface IPlayerInjure {
  id: number;
  name: string;
  photo: string;
  type: string;
  reason: string;
}

export interface IPlayerBirth {
  date: string;
  place: string;
  country: string;
}
export interface IPlayerInfo {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: 23;
  birth: IPlayerBirth;
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

export interface IPlayerStatGames {
  appearences: number;
  lineups: number;
  minutes: number;
  number: number | null;
  position: string;
  rating: string;
  captain: boolean;
}

export interface IPlayerStatShots {
  total: number;
  on: number;
}

export interface IPlayerStatGoals {
  total: number;
  conceded: number;
  assists: number | null;
  saves: number | null;
}

export interface IPlayerStatCards {
  yellow: number;
  yellowred: number;
  red: number;
}

export interface IPlayerStatPenalties {
  won: number | null;
  commited: number | null;
  scored: number;
  missed: number;
  saved: number | null;
}

export interface IPlayerStats {
  team: IShortInfoTeam;
  games: IPlayerStatGames;
  shots: IPlayerStatShots;
  goals: IPlayerStatGoals;
  cards: IPlayerStatCards;
  penalty: IPlayerStatPenalties;
}

export interface IPlayersStatsResponse {
  player: IPlayerInfo;
  statistics: IPlayerStats[];
}

export interface IPlayerStatsWidgetContent {
  [key: string]: IPlayersStatsResponse[];
}
