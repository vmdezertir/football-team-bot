import countryJson from './country.json';
import { Markup } from 'telegraf';
import { ILeague } from '@app/interfaces';
import { ITeam } from '@app/interfaces/team';
import { Favorite } from '@app/entities';
import { getFlagEmoji } from './emoji';

export const getArrayChunk = (array: any[], size: number = 20): any[][] => {
  let chunks: any[] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const COUNTRY_LIMIT = 30;

export const getCountriesButtons = (page: number = 0) => {
  const countries = Object.entries(countryJson).map((country: [string, unknown]) =>
    Markup.button.callback(`${getFlagEmoji(country[0])} ${country[1]}`, `COUNTRY_${country[0]}`),
  );
  const allButtons = getArrayChunk(countries, COUNTRY_LIMIT);

  const buttons = [];
  if (!!page) {
    buttons.push([Markup.button.callback('⬅️ Назад', `COUNTRY_PAGE_${page - 1}`)]);
  }

  const pageButtons = getArrayChunk(allButtons[page], 2);
  buttons.push(...pageButtons);

  if (page < allButtons.length) {
    buttons.push([Markup.button.callback('Вперед ➡️', `COUNTRY_PAGE_${page + 1}`)]);
  }

  return buttons;
};

export const getLeagueButtons = (leagues?: ILeague[]) =>
  leagues ? leagues.map(({ name, id }) => [Markup.button.callback(name, `LEAGUE_${id}`)]) : [];

export const getTeamButtons = (teams?: ITeam[]) =>
  teams ? teams.map(({ name, code, id }) => [Markup.button.callback(`${name} (${code})`, `TEAM_${id}`)]) : [];

export const getFavoriteTeamButtons = (teams: Favorite[]) =>
  teams.map(({ name, countryCode, uuid }) => [
    Markup.button.callback(`${name} (${countryCode})`, `FAVORITE_TEAM_${uuid}`),
  ]);

export const getTeamLeagueButtons = (leagueId: number, season: number) => [
  [
    Markup.button.webApp(
      'Турнірна таблиця',
      `https://1d34-188-163-21-111.ngrok-free.app/widgets/standings/${leagueId}?season=${season}`,
    ),
  ],
  [
    Markup.button.webApp(
      'Матчі',
      `https://1d34-188-163-21-111.ngrok-free.app/widgets/games/${leagueId}?season=${season}`,
    ),
  ],
];
