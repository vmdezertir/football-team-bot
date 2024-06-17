import { Message } from 'telegraf/typings/core/types/typegram';

import { Scenes } from '@app/@types/custom';

export type TErrorType = 'db' | 'api' | 'notFound';

export const renderError = async (
  ctx: Scenes.SContext<{}>,
  errorType?: TErrorType,
  message?: string,
): Promise<Message.TextMessage> => {
  let text = message || '';
  switch (errorType) {
    case 'db': {
      text = `🤚🏻🟥 <b>Упс. Щось пішло не так</b>\nСпробуй ще раз або перезагрузи бота коммандою <code>/restart</code>`;
      break;
    }
    case 'api': {
      text = '🐞 <b>Виникла неочікувана помилка з базою данних. Спробуйте пізніше</b> ⏳';
      break;
    }
    case 'notFound': {
      text = message || '🤷‍♂️ Нажаль, ніц не знайшов';
      break;
    }
  }

  const msg = await ctx.replyWithHTML(text);
  ctx.session.errMsgId = msg.message_id;
  return msg;
};
