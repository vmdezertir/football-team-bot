import { Context } from 'telegraf';

export const getUserId = ({ update }: Context): number | undefined => {
  if ('callback_query' in update) {
    return update.callback_query.from.id;
  }

  if ('message' in update) {
    return update.message.from.id;
  }

  return undefined;
};
