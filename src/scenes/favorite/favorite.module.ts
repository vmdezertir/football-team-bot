import { EScenes } from '@app/enums';
import { FavoriteRepository } from '@app/repositories';
import { ApiFootballService } from '@app/services';
import { Injectable, Logger } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '@app/@types/custom';
import { Markup } from 'telegraf';
import {
  getAnswer,
  getFavoriteTeamButtons,
  getLeagueTypeEmoji,
  getPlayerPositionEmoji,
  getTeamLeagueButtons,
  getUserId,
  renderApiError,
  renderError,
  renderLoading,
} from '@app/utils';
import { EPlayerPosition } from '@app/interfaces';
import { format } from 'date-fns/format';
import { uk as ukLocale } from 'date-fns/locale/uk';

interface SceneData {
  teamId?: number;
}
type SceneCtx = Scenes.SContext<SceneData>;

@Injectable()
@Scene(EScenes.FAVORITE)
export class FavoriteScene {
  constructor(
    private readonly footballService: ApiFootballService,
    private readonly repository: FavoriteRepository,
  ) {}

  private readonly logger = new Logger(FavoriteScene.name);

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    await renderLoading(ctx);
    const userId = getUserId(ctx);
    if (!userId) return;

    const teams = await this.repository.findBy({ userId });
    if (!teams.length) {
      await ctx.editMessageText(
        '🔍 У тебе ще відсутні улюблені команди\n Будь ласка, вкажи свої улюблені команди\n Вибери відповідний пункт меню! 👇',
        { parse_mode: 'HTML' },
      );
      return;
    }

    const menu = Markup.inlineKeyboard(getFavoriteTeamButtons(teams));
    await ctx.replyWithHTML(
      'Ocь список найкращих команд світу, без перебільшення😉\n По якій команді потрібна інформація? 👇',
      menu,
    );
    return;
  }

  @Action(/^FAVORITE_TEAM_/)
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('FAVORITE_TEAM_')) {
      return;
    }

    const uuid = answer.split('FAVORITE_TEAM_')[1];
    const team = await this.repository.findOneById(uuid);

    if (!team) {
      await renderError(ctx);
      return;
    }

    ctx.scene.state = { ...ctx.scene.state, teamId: team.id };

    await ctx.replyWithHTML(
      `🧑🏽‍🤝‍🧑🏻 <b>${team.name}</b>
    \n👇 Що саме тебе цікавить?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('👨‍👨 Склад команди', 'TEAM_SQUAD')],
        [Markup.button.callback('📊 Статистика', 'TEAM_STATS')],
        [Markup.button.callback('⚔️ Найближчі 5 матчів', 'TEAM_FIXTURES')],
      ]),
    );
    return;
  }

  @Action('TEAM_SQUAD')
  async getSquad(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

    await renderLoading(ctx);
    let players, injPlayers, coach;

    try {
      [players, injPlayers, coach] = await this.footballService.findTeamSquad(teamId);
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }

    for (const position of Object.values(EPlayerPosition)) {
      const playersTxt = players[position]?.map(p => {
        const injurePlayer = injPlayers.find(({ player }) => player.id === p.id);
        let injureInfo = '';
        if (injurePlayer) {
          injureInfo = `🏥 ${injurePlayer.player.type}: <i>${injurePlayer.player.reason}</i>`;
        }
        return `\n<b>${p.number || '-'}</b> - ${p.name} (<i>${p.age} р.</i>) ${injureInfo}`;
      });
      await ctx.replyWithHTML(`${getPlayerPositionEmoji(position)} <b>${position}</b>${playersTxt?.join('')}`);
    }

    if (coach)
      await ctx.replyWithHTML(`👨🏻 Тренер\n<b>${coach.name}</b>. 🏁<i>${coach.nationality}</i> (${coach.age} p.)`);
  }

  @Action('TEAM_STATS')
  async getStats(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

    await renderLoading(ctx);
    let leagues;

    try {
      leagues = await this.footballService.findTeamLeagues(teamId);
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }

    if (!leagues.length) {
      await ctx.reply('🌴🍹⛱️🥥 Немає активних турнірів 🏆');
      return;
    }

    await ctx.reply('Що саме тебе цікавить? 👇');

    for (const { league, seasons } of leagues) {
      const menu = getTeamLeagueButtons(league.id, seasons[0].year);
      const icon = getLeagueTypeEmoji(league.type);
      await ctx.replyWithHTML(`${icon} <b>${league.type}. ${league.name}</b>`, Markup.inlineKeyboard(menu));
    }
  }

  @Action('TEAM_FIXTURES')
  async getFixtures(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

    await renderLoading(ctx);
    let fixtures;
    try {
      fixtures = await this.footballService.findTeamFeatureGames(teamId);
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }

    if (!fixtures.length) {
      await ctx.reply('🌴🍹⛱️🥥 Немає найближчих запланованих матчів');
      return;
    }

    for (const [index, { teams, league, fixture }] of Object.entries(fixtures)) {
      const currentIndex = Number(index);
      let res = '';
      if (
        !currentIndex ||
        (currentIndex && fixtures[currentIndex]?.league.id !== fixtures[currentIndex - 1]?.league.id)
      ) {
        res = `🏆 <u>${league.name} (${league.round})</u>\n`;
      }

      res = `${res}\n<b>${teams.home.name}</b> ⚔️ <b>${teams.away.name}</b>\n📅Дата: ${format(fixture.date, 'eeee, dd MMM, HH:mm', { locale: ukLocale })} (UTC)\n🗣 Peфері: ${fixture.referee || '-'}\n`;
      const menu = [
        [
          Markup.button.callback('🎲 Коефіцієнти', `FIXTURE_ODDS_${fixture.id}`),
          Markup.button.callback('🔮 Прогноз', `FIXTURE_PRED_${fixture.id}`),
        ],
        [Markup.button.callback('🔔 Сповістити про початок', `FIXTURE_REMIND_${fixture.id}`)],
      ];
      await ctx.replyWithHTML(res, Markup.inlineKeyboard(menu));
    }
  }

  @Action(/^FIXTURE_ODDS_/)
  async getOdds(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('FIXTURE_ODDS_')) {
      return;
    }

    // const fixture = Number(answer.split('FIXTURE_ODDS_')[1]);
    await renderLoading(ctx);
  }

  @Action(/^FIXTURE_PRED_/)
  async getPredictions(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('FIXTURE_PRED_')) {
      return;
    }

    const fixture = Number(answer.split('FIXTURE_PRED_')[1]);
    await renderLoading(ctx);
    let predictionData;

    try {
      predictionData = await this.footballService.findFixturePrediction(fixture);
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }
    if (!predictionData.length) {
      await ctx.reply('🔮🎱 На данну хвилину не знаю. Таролог ще налаштовується');
      return;
    }

    for (const { predictions, teams } of predictionData) {
      const { advice, percent, winner, under_over, goals } = predictions;
      await ctx.replyWithHTML(`
        <b>Вірогідність перемоги в матчі ${teams.home.name} ⚔️ ${teams.away.name}</b>:
        \n1️⃣ ${percent.home} 🤝 ${percent.draw} 2️⃣ ${percent.away}
        \n💪 <b>Вірогідний переможець</b>: ${winner.name} (<i>${winner.comment}</i>)
        \n↕️ <b>Під/Над</b>: ${under_over}*
        \n⚽︎ <b>Голи вдома</b>: ${goals.home}*
        \n⚽︎ <b>Голи в гостях</b>: ${goals.away}*
        \n☝ <b>Порада</b>: ${advice}
        \n\n* Наприклад -1.5 означає, що в матчі буде максимум 1.5 голів, тобто 1 гол.`);
    }
  }

  @Action(/^FIXTURE_REMIND_/)
  async remindMe(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('FIXTURE_REMIND_')) {
      return;
    }

    // const fixture = Number(answer.split('FIXTURE_REMIND_')[1]);
    await ctx.reply('Функціонал в розробці');
  }
}
