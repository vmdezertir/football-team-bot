import countryJson from './country.json';
import { Markup } from 'telegraf';
import { ILeague } from '@app/interfaces';
import { ITeam } from '@app/interfaces/team';
import { Favorite, ISetNameValue } from '@app/entities';
import { getFlagEmoji } from './emoji';
import { ECallbacks, ESettingsActions } from '@app/enums';
import { SEPARATOR, COUNTRY_LIMIT } from '@app/const';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export const getArrayChunk = (array: any[], size: number = 20): InlineKeyboardButton.CallbackButton[][] => {
  let chunks: any[] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const getCountriesButtons = (page: number = 0): InlineKeyboardButton.CallbackButton[][] => {
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

export const getTeamLeagueButtons = (leagueId: number, season: number, path?: string) => [
  [Markup.button.webApp('🏆 Турнірна таблиця', `${path}/widgets/standings/${leagueId}?season=${season}`)],
  [
    Markup.button.webApp('📋 Статистика', `${path}/widgets/standings/${leagueId}/stats?season=${season}`),
    Markup.button.webApp('⚔️ Матчі', `${path}/widgets/games/${leagueId}?season=${season}`),
  ],
];

export const getTeamButtons = () => [
  [
    Markup.button.callback('👨‍👨 Склад', ECallbacks.TEAM_SQUAD),
    Markup.button.callback('📊 Статистика', ECallbacks.TEAM_STATS),
  ],
  [Markup.button.callback('⚔️ Найближчі 5 матчів', ECallbacks.TEAM_FIXTURES)],
];

export const getFixtureButtons = (fixture: number, user: number, path?: string) => [
  [
    Markup.button.webApp('🎲 Коефіцієнти', `${path}/widgets/fixture/${fixture}/odds?user=${user}`),
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

export const START_SETTINGS_BTS = [
  [
    Markup.button.callback('🎰 Типи ставок', ESettingsActions.SETTINGS_BET),
    Markup.button.callback('⚜️ Букмекери', ESettingsActions.SETTINGS_BOOKMAKERS),
  ],
];

export const getSettingsBookBetButtons = (
  action: ESettingsActions,
  available: ISetNameValue[],
  favorite: ISetNameValue[],
): InlineKeyboardButton.CallbackButton[][] => {
  const bButtons = available.map(({ id, name }) => {
    const active = favorite.some(fb => fb.id === id);

    return Markup.button.callback(`${active ? '📌 ' : ''}${name}`, `${action}${SEPARATOR}${id}${SEPARATOR}${name}`);
  });

  return [
    [Markup.button.callback('⬅️ Назад', ESettingsActions.SETTINGS)],
    ...getArrayChunk(bButtons, action === ESettingsActions.SETTINGS_BET ? 2 : 3),
  ];
};
