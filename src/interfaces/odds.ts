import { BaseApiResponse } from './common';
import { IFixture, IPLeague, IShortInfoTeam } from './team';

export interface IBet {
  id: number;
  name: string;
}

export interface IBetValue {
  value: string;
  odd: string;
}

export interface IBookmakerBets extends IBet {
  values: IBetValue[];
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

export interface IFollowOddBetValue {
  value: string;
  odd: string;
}

export interface IFollowOddBookmaker {
  id: number;
  name: string;
  values: IFollowOddBetValue[];
}

export interface IFollowOddValue {
  id: number;
  name: string;
  bookmakers: IFollowOddBookmaker[];
  betValTitles: string[];
}
export interface IFollowOdd {
  [key: number]: IFollowOddValue;
}

export interface IOddsTableData {
  id: number;
  rows: string[][];
  titles: string[];
}
