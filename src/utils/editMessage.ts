import { Context } from 'telegraf';
import { getUserId } from './getUserId';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export interface IEditMessageExtra {
  messageId?: number;
  message: string;
  buttons?: InlineKeyboardButton[][];
}

export const editMessage = async (ctx: Context, { messageId, message, buttons }: IEditMessageExtra) => {
  const chatId = await getUserId(ctx);

  const markup = buttons ? { reply_markup: { inline_keyboard: buttons } } : {};

  return ctx.telegram.editMessageText(chatId, messageId, undefined, message, {
    parse_mode: 'HTML',
    ...markup,
  });
};
