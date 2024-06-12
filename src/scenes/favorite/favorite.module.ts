import { ECallbacks, EScenes } from '@app/enums';
import { FavoriteRepository, FixtureRepository, UserRepository } from '@app/repositories';
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
  renderError,
} from '@app/utils';
import { EPlayerPosition, IFollowJob, ITeamFixturesResponse } from '@app/interfaces';
import { format } from 'date-fns/format';
import { toZonedTime } from 'date-fns-tz';
import { uk as ukLocale } from 'date-fns/locale/uk';
import { MESSAGE_STR_SEPARATOR } from '@app/const';
import { ConfigService } from '@nestjs/config';
import { editMessage, editMessageMenu } from '@app/utils/editMessage';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { InsertResult } from 'typeorm';
import { differenceInMilliseconds, subMinutes } from 'date-fns';

interface SceneData {
  teamId?: number;
  fixtures?: ITeamFixturesResponse[];
}
type SceneCtx = Scenes.SContext<SceneData>;

@Injectable()
@Scene(EScenes.FAVORITE)
export class FavoriteScene {
  constructor(
    @InjectQueue('remind') private readonly remindQueue: Queue<IFollowJob>,
    private readonly footballService: ApiFootballService,
    private readonly userRepository: UserRepository,
    private readonly repository: FavoriteRepository,
    private readonly fixtureRepository: FixtureRepository,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(FavoriteScene.name);

  async manageUserFixtureRelation({
    fixture,
    userId,
  }: {
    fixture: number;
    userId: number;
  }): Promise<number | undefined> {
    const savedFollower = await this.fixtureRepository.findOne({
      where: { id: fixture },
      relations: ['users'],
      select: { id: true, users: { id: true } },
    });
    let addedId;

    if (!savedFollower) {
      const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
      const saved: InsertResult = await this.fixtureRepository.insert({ id: fixture, users: [user] });
      return saved.identifiers[0].id;
    }

    const isUserInFixture = savedFollower.users.some(user => user.id === userId);

    if (isUserInFixture) {
      savedFollower.users = savedFollower.users.filter(user => user.id !== userId);
    } else {
      const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
      savedFollower.users.push(user);
      addedId = savedFollower.id;
    }

    await this.fixtureRepository.save(savedFollower);

    return addedId;
  }

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    if (!userId) return;

    const { favTeamMsgId } = ctx.session;
    if (favTeamMsgId) {
      await ctx.deleteMessage(favTeamMsgId).catch(err => {
        this.logger.warn(`Can't delete message ${favTeamMsgId}:`, err);
      });
      ctx.session.favTeamMsgId = undefined;
    }

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: { favorites: true },
      relations: { favorites: true },
    });

    if (!user) {
      await renderError(ctx, 'db');
      return;
    }

    const { favorites } = user;
    if (!favorites.length) {
      const message =
        '🔍 У тебе ще відсутні улюблені команди\n Будь ласка, вкажи свої улюблені команди\n\n<i>Вибери відповідний пункт меню</i>! 👇';
      await renderError(ctx, 'notFound', message);
      return;
    }

    const menu = Markup.inlineKeyboard(getFavoriteTeamButtons(favorites));
    const msg = await ctx.replyWithHTML(
      'Ocь список найкращих команд світу, без перебільшення😉\n По якій команді потрібна інформація? 👇',
      menu,
    );
    ctx.session.favTeamMsgId = msg.message_id;
    return;
  }

  @Action(new RegExp(`^${ECallbacks.FAVORITE_TEAM}`))
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    const [id] = getAnswerIdentifiers(ctx.update);
    const { favTeamMsgId: messageId } = ctx.session;

    if (!id) {
      return;
    }

    const team = await this.repository.findOneById(id);

    if (!team) {
      await renderError(ctx, 'db');
      return;
    }

    ctx.scene.state.teamId = team.apiId;
    const buttons = getTeamButtons();
    const message = `🧑🏽‍🤝‍🧑🏻 <b>${team.name}</b>
    \n👇 Що саме тебе цікавить?`;

    return editMessage(ctx, { messageId, message, buttons });
  }

  @Action(ECallbacks.REMOVE_TEAM)
  async removeTeam(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;
    const userId = getUserId(ctx);

    if (!teamId) {
      return;
    }

    try {
      const user = await this.userRepository.findOneBy({ telegramId: userId });
      await this.repository.delete({ apiId: teamId, userId: user?.id });
      await ctx.scene.reenter();
    } catch (error) {
      this.logger.error(`Can't delete team ${teamId}`, error);
      await renderError(ctx, 'db');
    }

    return;
  }

  @Action(ECallbacks.TEAM_SQUAD)
  async getSquad(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;

    if (!teamId) {
      return;
    }

    let players, injPlayers, coach;

    try {
      [players, injPlayers, coach] = await this.footballService.findTeamSquad(teamId);
    } catch (err) {
      this.logger.error('api findTeamSquad err:', err);
      await renderError(ctx, 'api');
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
      this.logger.error('api findTeamLeagues err:', err);
      await renderError(ctx, 'api');
      return;
    }

    if (!leagues.length) {
      await renderError(ctx, 'notFound', '🌴🍹⛱️🥥 Немає активних турнірів 🏆');
      return;
    }

    await ctx.reply('Що саме тебе цікавить? 👇');

    const path = this.configService.get<string>('BOT_API_URL');

    for (const { league, seasons } of leagues) {
      this.logger.log('league seasons:', seasons);
      const menu = getTeamLeagueButtons(league.id, seasons[0].year, path);
      const icon = getLeagueTypeEmoji(league.type);
      await ctx.replyWithHTML(`${icon} <b>${league.type}. ${league.name}</b>`, Markup.inlineKeyboard(menu));
    }
  }

  @Action(ECallbacks.TEAM_FIXTURES)
  async getFixtures(@Ctx() ctx: SceneCtx) {
    const { teamId } = ctx.scene.state;
    const userId = getUserId(ctx);

    if (!teamId || !userId) {
      return;
    }

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: { id: true, fixtures: { id: true } },
      relations: ['fixtures'],
    });

    this.logger.log('user', JSON.stringify(user));

    if (!user) {
      await renderError(ctx, 'db');
      return;
    }

    let fixtures: ITeamFixturesResponse[];
    try {
      fixtures = await this.footballService.findTeamFeatureGames(teamId);
      ctx.scene.state.fixtures = fixtures;
    } catch (err) {
      this.logger.error('api findTeamFeatureGames err:', err);
      await renderError(ctx, 'api');
      return;
    }

    if (!fixtures.length) {
      await renderError(ctx, 'notFound', '🌴🍹⛱️🥥 Немає найближчих запланованих матчів');
      return;
    }

    const path = this.configService.get<string>('BOT_API_URL');

    for (const [index, { teams, league, fixture }] of Object.entries(fixtures)) {
      const currentIndex = Number(index);
      let res = '';
      if (
        !currentIndex ||
        (currentIndex && fixtures[currentIndex]?.league.id !== fixtures[currentIndex - 1]?.league.id)
      ) {
        res = `🏆 <u>${league.name} (${league.round})</u>\n`;
      }
      const zonedDate = toZonedTime(fixture.date, 'Europe/Kiev');

      res = `${res}\n<b>${teams.home.name}</b> ⚔️ <b>${teams.away.name}</b>\n📅Дата: ${format(zonedDate, 'eeee, dd MMM, HH:mm', { locale: ukLocale })} (Київський час)\n🗣 Peфері: ${fixture.referee || '-'}\n`;
      const reply = await ctx.replyWithHTML(res);
      const isFollow = user.fixtures.some(f => f.id === fixture.id);
      const buttons = getFixtureButtons({
        fixture: fixture.id,
        userId: user.id,
        path,
        messageId: reply.message_id,
        isFollow,
      });
      await editMessageMenu(ctx, { messageId: reply.message_id, buttons });
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
      this.logger.error('api findFixturePrediction err:', err);
      await renderError(ctx, 'api');
      return;
    }
    if (!predictionData.length) {
      await renderError(ctx, 'notFound', '🔮🎱 На данну хвилину не знаю. Таролог ще налаштовується');
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
        \n⚽ Голи гостей: <b>${goals.away}</b>*
        \n💡 Порада: <b>${advice}</b>
        \n\n* Наприклад -1.5 означає, що в матчі буде максимум 1.5 голів, тобто 1 гол.`);
    }
  }

  @Action(new RegExp(`^${ECallbacks.FIXTURE_REMIND}`))
  async remindMe(@Ctx() ctx: SceneCtx) {
    const [fixtureId, messageId, userId] = getAnswerIdentifiers(ctx.update);
    const path = this.configService.get<string>('BOT_API_URL');

    if (!fixtureId || !messageId || !userId) {
      return;
    }

    const follower = {
      fixture: Number(fixtureId),
      userId: Number(userId),
    };
    let isFollow = false;

    try {
      const fId = await this.manageUserFixtureRelation(follower);
      const { fixtures: stateFixtures } = ctx.scene.state;
      let fixtureData = stateFixtures?.find(f => f.fixture.id === fId);

      // if it's old reference, than api call
      if (fId && !fixtureData) {
        fixtureData = await this.footballService.findFixture(fId);
      }

      if (fId && fixtureData?.fixture.timestamp) {
        const jobData: IFollowJob = {
          id: fId,
        };
        const fDateMS = fixtureData.fixture.timestamp * 1000;
        // notify 10 minutes before the start
        const adjustedFDate = subMinutes(new Date(fDateMS), 10);
        const currentDate = new Date();

        await this.remindQueue.add(jobData, {
          delay: differenceInMilliseconds(adjustedFDate, currentDate),
          jobId: `remind_fixture_${fixtureId}`,
          removeOnComplete: true,
        });
        isFollow = true;
      }
    } catch (error) {
      this.logger.error('saving follow fixture error:', error);
      return renderError(ctx, 'api');
    }

    const buttons = getFixtureButtons({
      ...follower,
      path,
      messageId: Number(messageId),
      isFollow,
    });
    await editMessageMenu(ctx, { messageId: Number(messageId), buttons });
    return;
  }
}
