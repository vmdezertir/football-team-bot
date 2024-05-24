import { SEPARATOR } from '@app/const';
import { CallbackQuery } from '@telegraf/types/markup';

export const getAnswer = (update: { callback_query: CallbackQuery }): string | null => {
  const cbQuery = update.callback_query;
  return 'data' in cbQuery ? cbQuery.data : null;
};

export const getAnswerIdentifiers = (update: { callback_query: CallbackQuery }): string[] => {
  const answer = getAnswer(update);

  if (answer) {
    const [, ...rest] = answer.split(SEPARATOR);

    return rest;
  }

  return [];
};
