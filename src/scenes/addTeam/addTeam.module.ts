import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx } from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/scenes';
import { Markup } from 'telegraf';
import { EScenes } from '@app/enums';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
@Scene(EScenes.ADD_TEAM_SCENE)
export class AddTeamScene {
  @SceneEnter()
  async start(@Ctx() ctx: SceneContext) {
    const alphabet = ALPHABET.split('').map((l) => Markup.button.callback(l, `KEY_${l}`));
    let buttons = [];
    for (let i = 0; i < alphabet.length; i += 4) {
      buttons.push(alphabet.slice(i, i + 4));
    }

    await ctx.reply('Яка команда цікавить?/nДля пришвидшення пошуку виберіть букву на яку починається назва країни в якій грає команда', Markup.inlineKeyboard(buttons));
    return;
  }
}
