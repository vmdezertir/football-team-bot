import { Context } from 'telegraf';

export const renderError = (ctx: Context) => {
  return ctx.replyWithHTML(
    `🤚🏻🟥 <b>Упс. Щось пішло не так</b>\nСпробуй ще раз або перезагрузи бота коммандою <code>/restart</code>`,
  );
};

export const renderLoading = (ctx: Context) => {
  return ctx.reply('Оброблюю запит 🏃🏻‍♂️ ⚽. Почекай трохи');
};

export const renderApiError = (ctx: Context) => {
  return ctx.replyWithHTML('🐞 <b>Виникла неочікувана помилка з базою данних. Спробуйте пізніше</b> ⏳');
};
