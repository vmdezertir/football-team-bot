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
  renderApiError,
} from '@app/utils';
import { Markup } from 'telegraf';
import { ApiFootballService } from '@app/services/apiFootball.service';
import { ITeam } from '@app/interfaces/team';
import { Scenes } from '@app/@types/custom';
import { ILeague } from '@app/interfaces';
import { FavoriteRepository, UserRepository } from '@app/repositories';
import { error } from 'console';
import { SEPARATOR } from '@app/const';

interface SceneData {
  teams?: ITeam[];
  team?: ITeam | null;
  country?: string;
  leagues?: ILeague[];
  league?: number;
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
    const menu = Markup.inlineKeyboard(getCountriesButtons());
    await ctx.replyWithHTML(
      'Запрошую тебе на захоплюючу подорож у світ футбольних емоцій!\nСпершу, давай оберемо країну, яка цікавить. Представ собі величні гори 🏔️ Швейцарії, спокійні води 🌊 Голландії чи маєтність 🏰 історії в Іспанії.\n🤔 Подумай про свої вподобання та відчуйте магію вибору. 👇',
      menu,
    );
    return;
  }

  @Action(ECallbacks.COUNTRIES)
  async chooseCountries(@Ctx() ctx: SceneCtx) {
    const menu = Markup.inlineKeyboard(getCountriesButtons());
    await ctx.replyWithHTML('Обирай країну?', menu);
    return;
  }

  @Action(new RegExp(`^${ECallbacks.COUNTRY_PAGE}`))
  async scrollCountries(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);
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

    buttons = getCountriesButtons(Number(page));
    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
  }

  @Action(new RegExp(`^${ECallbacks.COUNTRY}`))
  async chooseCountry(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

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
    ctx.scene.state = { ...ctx.scene.state, country: code };

    try {
      leagues = await this.footballService.findAllLeaguesByCountry(code);
      ctx.scene.state = { ...ctx.scene.state, leagues };
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }

    if (!leagues || !leagues.length) {
      await ctx.replyWithHTML(`🤷‍♂️ Нажаль, нічого не знайшов по <b>${code}</b>. Спробуй іншу країну`);
      return;
    }

    buttons = [[Markup.button.callback('⬅️ Назад', ECallbacks.COUNTRIES)], ...getLeagueButtons(leagues)];

    await ctx.replyWithHTML(
      `Чудово. Тепер, коли ми обрали країну <b>(${code})</b>, час зануритися у її футбольну атмосферу. Уяви собі гучні трибуни 🏟, яскраві фанатські хореографії 💃 та енергію ⚡️ гри. 🎊 Звук сирен та вибухи радощів заповнюють повітря.\n<b>Що скажеш на рахунок 🏆 ліги?</b>`,
      Markup.inlineKeyboard(buttons),
    );
    return;
  }

  @Action(new RegExp(`^${ECallbacks.LEAGUE}`))
  async chooseLeague(@Ctx() ctx: SceneCtx) {
    const [leagueId] = getAnswerIdentifiers(ctx.update);
    if (!leagueId) {
      return;
    }

    ctx.scene.state = { ...ctx.scene.state, league: Number(leagueId) };
    let teams;

    try {
      teams = await this.footballService.findAllTeamsByLeague(Number(leagueId));
    } catch (err) {
      this.logger.error(err);
      renderApiError(ctx);
      return;
    }
    ctx.scene.state = { ...ctx.scene.state, teams };

    if (!teams || !teams.length) {
      const { leagues } = ctx.scene.state;
      const buttons = getLeagueButtons(leagues);
      await ctx.replyWithHTML('🔍 Нажаль, нічого не знайшов. Спробуй іншу 🏆 лігу', Markup.inlineKeyboard(buttons));
      return;
    }

    const { country } = ctx.scene.state;

    const buttons = getTeamsButtons(teams);

    await ctx.replyWithHTML(
      `Нарешті, настав час обрати саму команду, яка стане твоїм футбольним провідником у цій захоплюючій подорожі ✈️. Це момент, коли ти відчуваєш справжнє співчуття та пристрасть до обраної команди. \n❤️ <b>Чи вибереш ти традиційно сильну команду з багаторічною історією, чи підтримаєш молоду та амбіційну команду, яка лише починає свій шлях до слави?</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Назад', `${ECallbacks.COUNTRY}${SEPARATOR}${country}`)],
        ...buttons,
      ]),
    );
    return;
  }

  @Action(new RegExp(`^${ECallbacks.TEAM}`))
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    const [teamId] = getAnswerIdentifiers(ctx.update);
    if (!teamId) {
      return;
    }

    const { teams } = ctx.scene.state;
    const team = teams ? teams.find(({ id }) => id == Number(teamId)) : null;
    ctx.scene.state = { ...ctx.scene.state, team };

    if (team) {
      const { league } = ctx.scene.state;
      if (!league) {
        return;
      }
      const buttons = getChooseTeamButtons(league);
      await ctx.replyWithHTML(
        `🥅 Чудовий вибір!
      \n <b>${team.name}</b> (${team.country})
      \n Клуб заснований: ${team.founded}`,
        Markup.inlineKeyboard(buttons),
      );
    }
  }

  @Action(ECallbacks.SAVE_TEAM)
  async saveChoose(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
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
      await ctx.replyWithHTML(
        `Команда <b>${team.name}</b> вже додана.\nВсі збережені команди можна побачити в меню "🫶🏼 Улюблені"`,
        Markup.inlineKeyboard(getSaveTeamButtons(league)),
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>${team.name}</b> додано до улюблених`,
      Markup.inlineKeyboard(getSaveTeamButtons(league)),
    );
  }

  @Action(ECallbacks.TO_FAVORITE)
  async goToFavorite(@Ctx() ctx: SceneCtx) {
    await ctx.scene.enter(EScenes.FAVORITE);
  }
}
