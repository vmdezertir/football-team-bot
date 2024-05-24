import { ECallbacks, EScenes } from '@app/enums';
import { FavoriteRepository, UserRepository } from '@app/repositories';
import { ApiFootballService } from '@app/services';
import { Injectable, Logger } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '@app/@types/custom';
import { Markup } from 'telegraf';
import {
  getAnswerIdentifiers,
  getFavoriteTeamButtons,
  getFixtureButtons,
  getLeagueTypeEmoji,
  getPlayerPositionEmoji,
  getTeamButtons,
  getTeamLeagueButtons,
  getUserId,
  renderApiError,
  renderLoading,
} from '@app/utils';
import { EPlayerPosition } from '@app/interfaces';
import { format } from 'date-fns/format';
import { uk as ukLocale } from 'date-fns/locale/uk';
import { MESSAGE_STR_SEPARATOR } from '@app/const';

interface SceneData {
  teamId?: number;
}
type SceneCtx = Scenes.SContext<SceneData>;

@Injectable()
@Scene(EScenes.FAVORITE)
export class FavoriteScene {
  constructor(
    private readonly footballService: ApiFootballService,
    private readonly userRepository: UserRepository,
    private readonly repository: FavoriteRepository,
  ) {}

  private readonly logger = new Logger(FavoriteScene.name);

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    if (!userId) return;

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: { favorites: true },
      relations: { favorites: true },
    });
    if (!user) {
      return;
    }

    const { favorites } = user;
    if (!favorites.length) {
      await ctx.replyWithHTML(
        '🔍 У тебе ще відсутні улюблені команди\n Будь ласка, вкажи свої улюблені команди\n\n<i>Вибери відповідний пункт меню</i>! 👇',
        { parse_mode: 'HTML' },
      );
      return;
    }

    this.logger.log(favorites);

    const menu = Markup.inlineKeyboard(getFavoriteTeamButtons(favorites));
    await ctx.replyWithHTML(
      'Ocь список найкращих команд світу, без перебільшення😉\n По якій команді потрібна інформація? 👇',
      menu,
    );
    return;
  }

  @Action(new RegExp(`^${ECallbacks.FAVORITE_TEAM}`))
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    const [id] = getAnswerIdentifiers(ctx.update);

    if (!id) {
      return;
    }

    const team = await this.repository.findOneById(id);

    if (!team) {
      return;
    }

    ctx.scene.state = { ...ctx.scene.state, teamId: team.apiId };

    await ctx.replyWithHTML(
      `🧑🏽‍🤝‍🧑🏻 <b>${team.name}</b>
    \n👇 Що саме тебе цікавить?`,
      Markup.inlineKeyboard(getTeamButtons()),
    );
    return;
  }

  @Action(ECallbacks.TEAM_SQUAD)
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

  @Action(ECallbacks.TEAM_STATS)
  async getStats(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

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

  @Action(ECallbacks.TEAM_FIXTURES)
  async getFixtures(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

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
      const menu = getFixtureButtons(fixture.id);
      await ctx.replyWithHTML(res, Markup.inlineKeyboard(menu));
    }
  }

  @Action(new RegExp(`^${ECallbacks.FIXTURE_ODDS}`))
  async getOdds(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    const [fixture] = getAnswerIdentifiers(ctx.update);

    if (!fixture || !userId) {
      return;
    }

    await renderLoading(ctx);

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: ['id', 'settings'],
    });

    if (!user) {
      return;
    }
    let odds;

    const { settings } = user;
    try {
      odds = await this.footballService.findFixtureOdds(Number(fixture), settings.bets, settings.bookmakers);
    } catch (error) {
      this.logger.error(error);
      renderApiError(ctx);
      return;
    }
  }

  @Action(new RegExp(`^${ECallbacks.FIXTURE_PRED}`))
  async getPredictions(@Ctx() ctx: SceneCtx) {
    const [fixture] = getAnswerIdentifiers(ctx.update);
    this.logger.log(`${ECallbacks.FIXTURE_PRED} fixture: ${fixture}`);

    if (!fixture) {
      return;
    }

    let predictionData;

    try {
      predictionData = await this.footballService.findFixturePrediction(Number(fixture));
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
        ${MESSAGE_STR_SEPARATOR}
        \n<b>Вірогідність перемоги в матчі ${teams.home.name} ⚔️ ${teams.away.name}</b>:
        \n1️⃣ ${percent.home} 🤝 ${percent.draw} 2️⃣ ${percent.away}
        \n💪 Вірогідний переможець: <b>${winner.name}</b> (<i>${winner.comment}</i>)
        \n↕️ Під/Над: <b>${under_over}</b>*
        \n⚽ Голи господарів: <b>${goals.home}</b>*
        \n⚽︎ Голи гостей: <b>${goals.away}</b>*
        \n💡 Порада: <b>${advice}</b>
        \n\n* Наприклад -1.5 означає, що в матчі буде максимум 1.5 голів, тобто 1 гол.`);
    }
  }

  @Action(new RegExp(`^${ECallbacks.FIXTURE_REMIND}`))
  async remindMe(@Ctx() ctx: SceneCtx) {
    const [fixture] = getAnswerIdentifiers(ctx.update);

    if (!fixture) {
      return;
    }

    await ctx.reply('Функціонал в розробці');
  }
}
