import { EScenes, ESettingsActions } from '@app/enums';
import { UserRepository } from '@app/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '@app/@types/custom';
import {
  START_SETTINGS_BTS,
  getAnswerIdentifiers,
  getSettingsBookBetButtons,
  getUserId,
  renderError,
} from '@app/utils';
import { ApiFootballService } from '@app/services';
import { Markup } from 'telegraf';
import { editMessage } from '@app/utils/editMessage';
import { ISetNameValue, ISettings, SettingsDto, User } from '@app/entities';

interface SceneData {
  bookmakers?: ISetNameValue[];
  bets?: ISetNameValue[];
}

type SceneCtx = Scenes.SContext<SceneData>;
@Injectable()
@Scene(EScenes.SETTINGS)
export class SettingsScene {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly footballService: ApiFootballService,
  ) {}

  private readonly logger = new Logger(SettingsScene.name);

  public async getUserSettings(ctx: SceneCtx): Promise<SettingsDto> {
    const userId = getUserId(ctx);
    if (!userId)
      return {
        bookmakers: [],
        bets: [],
      };

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: ['settings'],
    });

    if (!user) {
      return {
        bookmakers: [],
        bets: [],
      };
    }

    return user.settings;
  }

  public async setUserSettings(
    ctx: SceneCtx,
    field: 'bookmakers' | 'bets',
    updatedValue: ISetNameValue,
  ): Promise<ISettings> {
    const id = getUserId(ctx);

    if (!id) {
      throw new Error('User id not found');
    }

    return this.userRepository.manager.transaction(async transactionalEntityManager => {
      const userRepo = transactionalEntityManager.getRepository(User);
      const user = await userRepo.findOneBy({ telegramId: id });

      if (!user) {
        throw new Error('User not found');
      }

      const index = user.settings[field].findIndex(item => item.id === updatedValue.id);

      if (index !== -1) {
        user.settings[field].splice(index, 1);
      } else {
        user.settings[field].push(updatedValue);
      }

      const upd = await userRepo.save(user);

      return upd.settings;
    });
  }

  async initBookmakerMenu(ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const [bookmakerId, bookmakerName] = getAnswerIdentifiers(ctx.update);
    const message = `<b>Налаштування</b>:\nВибери букмекерів які цікаві для тебе: 👇`;
    const { settingsMsgId: messageId } = ctx.session;

    if (bookmakerId && bookmakerName) {
      const { bookmakers } = ctx.scene.state;
      const updatedValue = {
        id: Number(bookmakerId),
        name: bookmakerName,
      };

      try {
        const updSettings = await this.setUserSettings(ctx, 'bookmakers', updatedValue);
        const buttons = getSettingsBookBetButtons(
          ESettingsActions.SETTINGS_BOOKMAKERS,
          bookmakers || [],
          updSettings.bookmakers,
        );
        await editMessage(ctx, { message, messageId: messageId, buttons });
      } catch (error) {
        this.logger.error('initBookmakerMenu:', error);
        await renderError(ctx, 'db');
      }
      return;
    }

    const [settings, bookmakers] = await Promise.all([
      this.getUserSettings(ctx),
      this.footballService.findBookmakers(),
    ]);
    ctx.scene.state.bookmakers = bookmakers;

    const buttons = getSettingsBookBetButtons(ESettingsActions.SETTINGS_BOOKMAKERS, bookmakers, settings.bookmakers);

    await editMessage(ctx, { message, messageId: messageId, buttons });
  }

  async initBetsMenu(ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const [betId, betName] = getAnswerIdentifiers(ctx.update);
    const message = `<b>Налаштування</b>:\nВибери вид ставок: 👇`;
    const { settingsMsgId: messageId } = ctx.session;

    if (betId && betName) {
      const { bets } = ctx.scene.state;
      const updatedValue = {
        id: Number(betId),
        name: betName,
      };

      try {
        const updSettings = await this.setUserSettings(ctx, 'bets', updatedValue);
        const buttons = getSettingsBookBetButtons(ESettingsActions.SETTINGS_BET, bets || [], updSettings.bets);
        await editMessage(ctx, { message, messageId: messageId, buttons });
      } catch (error) {
        this.logger.error('initBetsMenu:', error);
        await renderError(ctx, 'db');
      }
      return;
    }

    const [settings, bets] = await Promise.all([this.getUserSettings(ctx), this.footballService.findFixtureBets()]);
    ctx.scene.state.bets = bets;

    const buttons = getSettingsBookBetButtons(ESettingsActions.SETTINGS_BET, bets, settings.bets);

    await editMessage(ctx, { message, messageId: messageId, buttons });
  }

  async initStartMenu(ctx: SceneCtx, start?: boolean) {
    await ctx.sendChatAction('typing');
    const message = `Тут ти можеш налаштувати наступне: 👇`;
    const { settingsMsgId: messageId } = ctx.session;

    if (start && messageId) {
      await ctx.deleteMessage(messageId).catch(() => {});
      ctx.session.settingsMsgId = undefined;
    }

    if (start) {
      const msg = await ctx.replyWithHTML(message, Markup.inlineKeyboard(START_SETTINGS_BTS));
      ctx.session.settingsMsgId = msg.message_id;
      return;
    }

    return editMessage(ctx, { message, messageId: messageId, buttons: START_SETTINGS_BTS });
  }

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    return this.initStartMenu(ctx, true);
  }

  @Action(ESettingsActions.SETTINGS)
  async setInitSettings(@Ctx() ctx: SceneCtx) {
    return this.initStartMenu(ctx);
  }

  @Action(new RegExp(ESettingsActions.SETTINGS_BOOKMAKERS))
  async setBookmakers(@Ctx() ctx: SceneCtx) {
    return this.initBookmakerMenu(ctx);
  }

  @Action(new RegExp(ESettingsActions.SETTINGS_BET))
  async setBets(@Ctx() ctx: SceneCtx) {
    return this.initBetsMenu(ctx);
  }
}
