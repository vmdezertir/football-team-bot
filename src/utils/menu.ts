import countryJson from './country.json';
import { Markup } from 'telegraf';
import { ILeague } from '@app/interfaces';
import { ITeam } from '@app/interfaces/team';
import { Favorite } from '@app/entities';
import { getFlagEmoji } from './emoji';
import { ECallbacks } from '@app/enums';
import { SEPARATOR, COUNTRY_LIMIT } from '@app/const';

export const getArrayChunk = (array: any[], size: number = 20): any[][] => {
  let chunks: any[] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const getCountriesButtons = (page: number = 0) => {
  const countries = Object.entries(countryJson).map((country: [string, unknown]) =>
    Markup.button.callback(
      `${getFlagEmoji(country[0])} ${country[1]}`,
      `${ECallbacks.COUNTRY}${SEPARATOR}${country[0]}`,
    ),
  );
  const allButtons = getArrayChunk(countries, COUNTRY_LIMIT);

  const buttons = [];
  if (!!page) {
    buttons.push([Markup.button.callback('⬅️ Назад', `${ECallbacks.COUNTRY_PAGE}${SEPARATOR}${page - 1}`)]);
  }

  const pageButtons = getArrayChunk(allButtons[page], 2);
  buttons.push(...pageButtons);

  if (page < allButtons.length) {
    buttons.push([Markup.button.callback('Вперед ➡️', `${ECallbacks.COUNTRY_PAGE}${SEPARATOR}${page + 1}`)]);
  }

  return buttons;
};

export const getLeagueButtons = (leagues?: ILeague[]) =>
  leagues ? leagues.map(({ name, id }) => [Markup.button.callback(name, `${ECallbacks.LEAGUE}${SEPARATOR}${id}`)]) : [];

export const getTeamsButtons = (teams?: ITeam[]) =>
  teams
    ? teams.map(({ name, code, id }) => [
        Markup.button.callback(`${name} (${code})`, `${ECallbacks.TEAM}${SEPARATOR}${id}`),
      ])
    : [];

export const getFavoriteTeamButtons = (teams: Favorite[]) =>
  teams.map(({ name, countryCode, id }) => [
    Markup.button.callback(`${name} (${countryCode})`, `${ECallbacks.FAVORITE_TEAM}${SEPARATOR}${id}`),
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

export const getTeamButtons = () => [
  [
    Markup.button.callback('👨‍👨 Склад', ECallbacks.TEAM_SQUAD),
    Markup.button.callback('📊 Статистика', ECallbacks.TEAM_STATS),
  ],
  [Markup.button.callback('⚔️ Найближчі 5 матчів', ECallbacks.TEAM_FIXTURES)],
];

export const getFixtureButtons = (fixture: number) => [
  [
    Markup.button.callback('🎲 Коефіцієнти', `${ECallbacks.FIXTURE_ODDS}${SEPARATOR}${fixture}`),
    Markup.button.callback('🔮 Прогноз', `${ECallbacks.FIXTURE_PRED}${SEPARATOR}${fixture}`),
  ],
  [Markup.button.callback('🔔 Сповістити про початок', `${ECallbacks.FIXTURE_REMIND}${SEPARATOR}${fixture}`)],
];

export const getChooseTeamButtons = (league: number) => [
  [Markup.button.callback('⬅️ Назад 🏆', `${ECallbacks.LEAGUE}${SEPARATOR}${league}`)],
  [Markup.button.callback('До вибору країн', ECallbacks.COUNTRIES)],
  [Markup.button.callback('➕ Зберегти', ECallbacks.SAVE_TEAM)],
];

export const getSaveTeamButtons = (league: number) => [
  [Markup.button.callback('⬅️ Назад 🏆', `${ECallbacks.LEAGUE}${SEPARATOR}${league}`)],
  [Markup.button.callback('До вибору країн', ECallbacks.COUNTRIES)],
  [Markup.button.callback('🫶🏼 Перейти до улюблених', ECallbacks.TO_FAVORITE)],
];
