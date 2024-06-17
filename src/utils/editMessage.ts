import { Context } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { getUserId } from './getUserId';

export interface IEditMessageExtra {
  messageId?: number;
  message: string;
  buttons?: InlineKeyboardButton[][];
}

export interface IEditMessageMenu {
  messageId?: number;
  buttons: InlineKeyboardButton[][];
}

export const editMessage = async (ctx: Context, { messageId, message, buttons }: IEditMessageExtra) => {
  const chatId = await getUserId(ctx);

  const markup = buttons ? { reply_markup: { inline_keyboard: buttons } } : {};

  await ctx.telegram
    .editMessageText(chatId, messageId, undefined, message, {
      parse_mode: 'HTML',
      ...markup,
    })
    .catch((err: any) => {});
};

export const editMessageMenu = async (ctx: Context, { messageId, buttons }: IEditMessageMenu) => {
  const chatId = await getUserId(ctx);

  await ctx.telegram
    .editMessageReplyMarkup(chatId, messageId, undefined, { inline_keyboard: buttons })
    .catch((err: any) => {});
};
