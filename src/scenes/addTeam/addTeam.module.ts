import { Injectable, Logger } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { ECallbacks, EScenes } from '@app/enums';
import {
  getAnswer,
  getAnswerIdentifiers,
  getChooseTeamButtons,
  getCountriesButtons,
  getLeagueButtons,
  getSaveTeamButtons,
  getTeamsButtons,
  getUserId,
  renderError,
} from '@app/utils';
import { Markup } from 'telegraf';
import { ApiFootballService } from '@app/services/apiFootball.service';
import { ITeam } from '@app/interfaces/team';
import { Scenes } from '@app/@types/custom';
import { ILeague } from '@app/interfaces';
import { FavoriteRepository, UserRepository } from '@app/repositories';
import { error } from 'console';
import { SEPARATOR } from '@app/const';
import { editMessage, editMessageMenu } from '@app/utils/editMessage';

interface SceneData {
  teams?: ITeam[];
  team?: ITeam | null;
  country?: string;
  leagues?: ILeague[];
  league?: number;
  page?: number;
}

type SceneCtx = Scenes.SContext<SceneData>;

@Injectable()
@Scene(EScenes.ADD_TEAM)
export class AddTeamScene {
  constructor(
    private readonly footballService: ApiFootballService,
    private readonly userRepository: UserRepository,
    private readonly repository: FavoriteRepository,
  ) {}

  private readonly logger = new Logger(AddTeamScene.name);

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const { addTeamMsgId } = ctx.session;
    if (addTeamMsgId) {
      await ctx.deleteMessage(addTeamMsgId).catch(err => {
        this.logger.warn(`Can't delete message ${addTeamMsgId}:`, err);
      });
      ctx.session.addTeamMsgId = undefined;
    }

    const menu = Markup.inlineKeyboard(getCountriesButtons());
    const msg = await ctx.replyWithHTML(
      'Запрошую тебе на захоплюючу подорож у світ футбольних емоцій!\nСпершу, давай оберемо країну, яка цікавить. Представ собі величні гори 🏔️ Швейцарії, спокійні води 🌊 Голландії чи маєтність 🏰 історії в Іспанії.\n🤔 Подумай про свої вподобання та відчуйте магію вибору. 👇',
      menu,
    );
    ctx.session.addTeamMsgId = msg.message_id;
  }

  @Action(ECallbacks.COUNTRIES)
  async chooseCountries(@Ctx() ctx: SceneCtx) {
    const { addTeamMsgId: messageId } = ctx.session;
    const buttons = getCountriesButtons();
    return editMessage(ctx, { messageId, message: 'Обирай країну?', buttons });
  }

  @Action(new RegExp(`^${ECallbacks.COUNTRY_PAGE}`))
  async scrollCountries(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);
    const { addTeamMsgId: messageId } = ctx.session;

    this.logger.log(`${ECallbacks.COUNTRY_PAGE} answer: ${answer}`);

    if (!answer) {
      return;
    }

    let buttons = [];

    const [page] = getAnswerIdentifiers(ctx.update);

    this.logger.log(`country page: ${page}`);

    if (!page) {
      return;
    }

    ctx.scene.state.page = Number(page);
    buttons = getCountriesButtons(Number(page));
    return editMessageMenu(ctx, { messageId: messageId, buttons });
  }

  @Action(new RegExp(`^${ECallbacks.COUNTRY}`))
  async chooseCountry(@Ctx() ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const answer = getAnswer(ctx.update);
    const { addTeamMsgId: messageId } = ctx.session;

    if (!answer) {
      return;
    }

    let buttons = [];

    const [code] = getAnswerIdentifiers(ctx.update);

    this.logger.log(`country code: ${code}`);

    if (!code) {
      return;
    }

    let leagues;
    ctx.scene.state.country = code;

    try {
      leagues = await this.footballService.findAllLeaguesByCountry(code);
      ctx.scene.state.leagues = leagues;
    } catch (err) {
      this.logger.error('api findAllLeaguesByCountry error:', err);
      await renderError(ctx, 'api');
      return;
    }

    if (!leagues || !leagues.length) {
      const message = `🤷‍♂️ Нажаль, ніц не знайшов жодної ліги по країні <b>${code}</b>. Спробуй вибрати іншу країну`;
      await renderError(ctx, 'notFound', message);
      return;
    }

    const { page = 0 } = ctx.scene.state;

    buttons = [
      [Markup.button.callback('⬅️ Назад', `${ECallbacks.COUNTRY_PAGE}${SEPARATOR}${page}`)],
      ...getLeagueButtons(leagues),
    ];

    const message = `Чудово. Тепер, коли ми обрали країну <b>(${code})</b>, час зануритися у її футбольну атмосферу. Уяви собі гучні трибуни 🏟, яскраві фанатські хореографії 💃 та енергію ⚡️ гри. 🎊 Звук сирен та вибухи радощів заповнюють повітря.\n<b>Що скажеш на рахунок 🏆 ліги?</b>`;
    return editMessage(ctx, { messageId: messageId, message, buttons });
  }

  @Action(new RegExp(`^${ECallbacks.LEAGUE}`))
  async chooseLeague(@Ctx() ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const [leagueIdStr] = getAnswerIdentifiers(ctx.update);
    if (!leagueIdStr) {
      return;
    }
    const leagueId = Number(leagueIdStr);

    ctx.scene.state.league = leagueId;
    let teams;
    const { addTeamMsgId: messageId } = ctx.session;

    try {
      teams = await this.footballService.findAllTeamsByLeague(leagueId);
    } catch (err) {
      this.logger.error('api findAllTeamsByLeague err:', err);
      await renderError(ctx, 'api');
      return;
    }
    ctx.scene.state.teams = teams;

    if (!teams || !teams.length) {
      const message = '🔍 Нажаль, нічого не знайшов. Спробуй іншу 🏆 лігу';
      await renderError(ctx, 'notFound', message);
      return;
    }

    const { country } = ctx.scene.state;

    const buttons = getTeamsButtons(teams);

    const message = `Нарешті, настав час обрати саму команду, яка стане твоїм футбольним провідником у цій захоплюючій подорожі ✈️. Це момент, коли ти відчуваєш справжнє співчуття та пристрасть до обраної команди. \n❤️ <b>Чи вибереш ти традиційно сильну команду з багаторічною історією, чи підтримаєш молоду та амбіційну команду, яка лише починає свій шлях до слави?</b>`;
    return editMessage(ctx, {
      messageId,
      message,
      buttons: [[Markup.button.callback('⬅️ Назад', `${ECallbacks.COUNTRY}${SEPARATOR}${country}`)], ...buttons],
    });
  }

  @Action(new RegExp(`^${ECallbacks.TEAM}`))
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    await ctx.sendChatAction('typing');
    const [teamId] = getAnswerIdentifiers(ctx.update);
    if (!teamId) {
      return;
    }

    const { teams } = ctx.scene.state;
    const { addTeamMsgId: messageId } = ctx.session;

    const team = teams ? teams.find(({ id }) => id == Number(teamId)) : null;
    ctx.scene.state.team = team;

    if (team) {
      const { league } = ctx.scene.state;
      if (!league) {
        return;
      }

      const buttons = getChooseTeamButtons(league);
      const message = `🥅 Чудовий вибір!
      \n <b>${team.name}</b> (${team.country})
      \n Клуб заснований: ${team.founded}`;

      return editMessage(ctx, { messageId, message, buttons });
    }
  }

  @Action(ECallbacks.SAVE_TEAM)
  async saveChoose(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    const { addTeamMsgId: messageId } = ctx.session;

    const { team, league, country } = ctx.scene.state;

    if (!team || !userId || !league) return;

    try {
      const user = await this.userRepository.findOneBy({ telegramId: userId });
      if (!user) {
        return;
      }

      await this.repository.insert({
        userId: user.id,
        name: team.name,
        countryCode: country,
        apiId: team.id,
      });
    } catch (err) {
      this.logger.error('Team save error:', error);
      await renderError(
        ctx,
        'notFound',
        `Команда <b>${team.name}</b> вже додана.\nВсі збережені команди можна побачити в меню "🫶🏼 Улюблені"`,
      );
      return;
    }

    const message = `<b>${team.name}</b> додано до улюблених`;
    return editMessage(ctx, { messageId, message, buttons: getSaveTeamButtons(league) });
  }

  @Action(ECallbacks.TO_FAVORITE)
  async goToFavorite(@Ctx() ctx: SceneCtx) {
    return ctx.scene.enter(EScenes.FAVORITE);
  }
}
