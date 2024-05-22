import { BaseApiResponse } from './common';
import { IPLeague, IFixture } from './team';

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
