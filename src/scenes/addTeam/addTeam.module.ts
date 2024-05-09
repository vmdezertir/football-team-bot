import { Injectable, Logger } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { EScenes } from '@app/enums';
import { getAnswer, getCountriesButtons, getLeagueButtons, getTeamButtons, getUserId } from '@app/utils';
import { Markup } from 'telegraf';
import { ApiFootballService } from '@app/services/apiFootball.service';
import { ITeam } from '@app/interfaces/team';
import { Scenes } from '@app/@types/custom';
import { ILeague } from '@app/interfaces';
import { FavoriteRepository } from '@app/repositories';
import { error } from 'console';

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
    private readonly repository: FavoriteRepository,
  ) {}

  private readonly logger = new Logger(AddTeamScene.name);

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    const menu = Markup.inlineKeyboard(getCountriesButtons());
    await ctx.replyWithHTML(
      'Запрошую тебе на захоплюючу подорож у світ футбольних емоцій!\nСпершу, давай оберемо країну, яка цікавить. Представ собі величні гори Швейцарії, спокійні води Голландії чи маєтність історії в Іспанії.\nПодумай про свої вподобання та відчуйте магію вибору.',
      menu,
    );
    return;
  }

  @Action('COUNTRIES')
  async chooseCountries(@Ctx() ctx: SceneCtx) {
    const menu = Markup.inlineKeyboard(getCountriesButtons());
    await ctx.replyWithHTML('Обирай країну?', menu);
    return;
  }

  @Action(/^COUNTRY_/)
  async chooseCountry(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer) {
      return;
    }

    let buttons = [];

    if (answer.startsWith('COUNTRY_PAGE_')) {
      const page = Number(answer.split('COUNTRY_PAGE_')[1] || 0);
      buttons = getCountriesButtons(page);
      await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
      return;
    }

    const countryCode = answer.split('COUNTRY_')[1];
    await ctx.editMessageText('Оброблюю запит ⚽ ⚽ ⚽');
    const leagues = await this.footballService.findAllLeaguesByCountry(countryCode);

    if (!leagues.length) {
      await ctx.editMessageText('Нажаль, нічого не знайшов. Спробуй іншу країну');
      const buttons = getCountriesButtons();
      await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
      return;
    }

    ctx.scene.state = { country: countryCode, leagues };
    await ctx.editMessageText(
      `Чудово. Тепер, коли ми обрали країну <b>(${countryCode})</b>, час зануритися у її футбольну атмосферу. Уяви собі гучні трибуни, яскраві фанатські хореографії та енергію гри. Звук сирен та вибухи радощів заповнюють повітря.\n<b>Що скажеш на рахунок 🏆 ліги?</b>`,
      { parse_mode: 'HTML' },
    );
    buttons = getLeagueButtons(leagues);
    if (buttons.length) {
      await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
    }
    return;
  }

  @Action(/^LEAGUE_/)
  async chooseLeague(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('LEAGUE_')) {
      return;
    }
    const leagueId = Number(answer.split('LEAGUE_')[1] || 0);
    ctx.scene.state = { ...ctx.scene.state, league: leagueId };
    await ctx.editMessageText('Оброблюю запит ⚽ ⚽ ⚽');
    const teams = await this.footballService.findAllTeamsByLeague(leagueId);
    ctx.scene.state = { ...ctx.scene.state, teams };

    if (!teams.length) {
      await ctx.editMessageText('🔍 Нажаль, нічого не знайшов. Спробуй іншу 🏆 лігу');
      const { leagues } = ctx.scene.state;
      const buttons = getLeagueButtons(leagues);
      if (buttons.length) {
        await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
      }
      return;
    }

    const { country } = ctx.scene.state;

    await ctx.editMessageText(
      `Нарешті, настав час обрати саму команду, яка стане твоїм футбольним провідником у цій захоплюючій подорожі. Це момент, коли ти відчуваєш справжнє співчуття та пристрасть до обраної команди. \n<b>Чи вибереш ти традиційно сильну команду з багаторічною історією, чи підтримаєш молоду та амбіційну команду, яка лише починає свій шлях до слави?</b>`,
      { parse_mode: 'HTML' },
    );
    const buttons = getTeamButtons(teams);
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [[Markup.button.callback('⬅️ Назад', `COUNTRY_${country}`)], ...buttons],
    });
    return;
  }

  @Action(/^TEAM_/)
  async chooseTeam(@Ctx() ctx: SceneCtx) {
    const answer = getAnswer(ctx.update);

    if (!answer || !answer.startsWith('TEAM_')) {
      return;
    }

    const teamId = Number(answer.split('TEAM_')[1] || 0);

    const { teams } = ctx.scene.state;
    const team = teams ? teams.find(({ id }) => id == teamId) : null;
    ctx.scene.state = { ...ctx.scene.state, team };

    if (team) {
      await ctx.editMessageText(
        `🥅 Чудовий вибір!
      \n <b>${team.name}</b> (${team.country})
      \n Клуб заснований: ${team.founded}`,
        { parse_mode: 'HTML' },
      );
      const { league } = ctx.scene.state;
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [Markup.button.callback('⬅️ Назад 🏆', `LEAGUE_${league}`)],
          [Markup.button.callback('До вибору країн', 'COUNTRIES')],
          [Markup.button.callback('Зберегти', 'SAVE_TEAM')],
        ],
      });
    }
  }

  @Action('SAVE_TEAM')
  async saveChoose(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    const { team, league } = ctx.scene.state;

    if (!team || !userId) return;

    try {
      await this.repository.insert({
        userId,
        name: team.name,
        countryCode: team.country,
        id: team.id,
      });
    } catch (err) {
      this.logger.error('Team save error:', error);
      await ctx.editMessageText(
        `Команда <b>${team.name}</b> вже додана.\nВсі збережені команди можна побачити в меню "Улюблені"`,
        { parse_mode: 'HTML' },
      );
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [Markup.button.callback('⬅️ Назад', `LEAGUE_${league}`)],
          [Markup.button.callback('До вибору країн', 'COUNTRIES')],
          [Markup.button.callback('Перейти до збережених', 'TO_FAVORITE')],
        ],
      });
      return;
    }

    await ctx.editMessageText(`<b>${team.name}</b> додано до улюблених`, { parse_mode: 'HTML' });
    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [Markup.button.callback('⬅️ Назад', `LEAGUE_${league}`)],
        [Markup.button.callback('До вибору країн', 'COUNTRIES')],
        [Markup.button.callback('Перейти до улюблених', 'TO_FAVORITE')],
      ],
    });
  }

  @Action('TO_FAVORITE')
  async goToFavorite(@Ctx() ctx: SceneCtx) {
    await ctx.scene.enter(EScenes.FAVORITE);
  }
}
