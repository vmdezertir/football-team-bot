import { BaseApiResponse } from './common';
import { IPLeague, IFixture, IShortInfoTeam } from './team';

export interface IBet {
  id: number;
  name: string;
}

export interface IBetValue {
  value: number;
  odds: string;
}

export interface IBookmakerBets extends IBet {
  value: IBetValue[];
}

export interface IBookmakers extends IBet {
  bets: IBookmakerBets[];
}

export interface IFixtureBetApiResponse extends BaseApiResponse {
  response: IBet[];
}

export interface IFixtureOddsResponse {
  league: IPLeague;
  fixture: IFixture;
  update: string;
  bookmakers: IBookmakers[];
}

export interface IFixtureOddsApiResponse extends BaseApiResponse {
  response: IFixtureOddsResponse[];
}

export interface IPrediction {
  winner: {
    id: number;
    name: string;
    comment: string;
  };
  win_or_draw: boolean;
  under_over: string;
  goals: {
    home: string;
    away: string;
  };
  advice: string;
  percent: {
    home: string;
    draw: string;
    away: string;
  };
}

export interface IFixturePredictionResponse {
  league: IPLeague;
  predictions: IPrediction;
  teams: {
    home: IShortInfoTeam;
    away: IShortInfoTeam;
  };
}
export interface IFixturePredictionApiResponse extends BaseApiResponse {
  response: IFixturePredictionResponse[];
}
