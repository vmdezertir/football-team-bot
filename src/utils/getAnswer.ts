import { CallbackQuery } from '@telegraf/types/markup';

export const getAnswer = (update: { callback_query: CallbackQuery }): string | null => {
  const cbQuery = update.callback_query;
  return 'data' in cbQuery ? cbQuery.data : null;
};
