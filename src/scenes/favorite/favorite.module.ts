import { EScenes } from '@app/enums';
import { FavoriteRepository } from '@app/repositories';
import { ApiFootballService } from '@app/services';
import { Injectable, Logger } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '@app/@types/custom';
import { Markup } from 'telegraf';
import { getAnswer, getFavoriteTeamButtons, getUserId } from '@app/utils';

interface SceneData {}
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
    await ctx.reply('Оброблюю запит ⚽ ⚽ ⚽');
    const userId = getUserId(ctx);
    if (!userId) return;

    const teams = await this.repository.findBy({ userId });
    if (!teams.length) {
      await ctx.editMessageText(
        '🔍 У тебе ще відсутні улюблені команди\n Будь ласка, вкажи свої улюблені команди\n Вибери відповідний пункт меню!',
        { parse_mode: 'HTML' },
      );
      return;
    }

    const menu = Markup.inlineKeyboard(getFavoriteTeamButtons(teams));
    await ctx.replyWithHTML(
      'Ocь список найкращих команд світу, без перебільшення😉\n По якій команді потрібна інформація?',
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

    const teamId = Number(answer.split('FAVORITE_TEAM_')[1] || 0);
  }
}
