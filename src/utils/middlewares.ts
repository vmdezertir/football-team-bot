import { getUserId } from './getUserId';
import { Scenes } from '@app/@types/custom';

export const cleanupMiddleware = async (ctx: Scenes.SContext<{}>, next: () => Promise<void>) => {
  const { errMsgId } = ctx.session;
  const chatId = await getUserId(ctx);

  if (errMsgId && chatId) {
    await ctx.telegram.deleteMessage(chatId, errMsgId).catch((err: any) => {});
  }

  await next();
};
