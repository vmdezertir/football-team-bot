import { Injectable } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { EComands, EScenes } from '@app/enums';
import { SceneContext } from 'telegraf/scenes';

@Injectable()
export class AppService {
  async start(ctx: Context): Promise<void> {
    await ctx.replyWithHTML(
      `<b>Дай боже! 👋</b>\n⚽ Я допоможу тобі слідкувати за життям твоїх улюбленних футбольних команд.`,
      Markup.keyboard([
        [
          Markup.button.callback('⭐ Улюблені', EComands.SEE_FAVORITES),
        ],
      ]),
    );
    await ctx.reply(
'Якщо в тебе вже є додані команди, то ти можеш скористатись пунктом меню "⭐ Улюблені"  або вкажи нові.\nВибери необхідний пункт меню',
      Markup.inlineKeyboard([[Markup.button.callback('Вказати команду', EComands.ADD_TEAM)], [Markup.button.callback('⭐ Улюблені', EComands.SEE_FAVORITES)]]),
    );
  }

  async enterAddTeamScene(ctx: SceneContext): Promise<void> {
    await ctx.scene.enter(EScenes.ADD_TEAM_SCENE)
  }
}
