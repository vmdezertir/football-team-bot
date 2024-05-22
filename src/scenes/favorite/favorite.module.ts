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

    const resultStr = fixtures.reduce((acc, { league, teams, fixture }, currentIndex) => {
      if (
        !currentIndex ||
        (currentIndex && fixtures[currentIndex]?.league.id !== fixtures[currentIndex - 1]?.league.id)
      ) {
        acc = `${acc}\n🏆 <u>${league.name} (${league.round})</u>\n`;
      }

      acc = `${acc}\n<b>${teams.home.name}</b> ⚔️ <b>${teams.away.name}</b>\n📅Дата: ${format(fixture.date, 'eeee, dd MMM, HH:mm', { locale: ukLocale })} (UTC)\n🗣 Peфері: ${fixture.referee || '-'}\n`;

      return acc;
    }, '');

    await ctx.replyWithHTML(resultStr);
  }
}
