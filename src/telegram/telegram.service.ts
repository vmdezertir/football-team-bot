import { Injectable, Logger } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { ECommands } from '@app/enums';
import { UserRepository } from '@app/repositories';
@Injectable()
export class TelegramStartService {
  private readonly logger = new Logger(TelegramStartService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async start(ctx: Context): Promise<void> {
    const message = ctx.message;
    if (!message) {
      return;
    }

    this.logger.log('New user enter', message?.from);

    const commonMenu = [
      [Markup.button.callback('🤔 Вказати команду', ECommands.ADD_TEAM)],
      [Markup.button.callback('🫶🏼 Улюблені', ECommands.SEE_FAVORITES)],
      [Markup.button.callback('🔄 Перезапустити', ECommands.RESTART)],
    ];

    const { id, first_name, last_name, username, language_code } = message.from;
    try {
      await this.userRepository.insert({
        telegramId: id,
        name: `${first_name}${last_name ? ' ' + last_name : ''}`,
        userName: username,
        language: language_code,
      });
    } catch (err) {
      this.logger.log('Повторний вхід');
      await ctx.replyWithHTML(
        `<b>Вітаємо з поверненням на поле!</b>\nГотовий до нового матчу? Якщо потрібна порада чи підтримка, просто підбий мʼяча та запитай. Давайте рухатися до перемоги разом! 👇`,
        Markup.keyboard(commonMenu),
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>Вітаємо тебе у світі футбольних емоцій, новий друже! 👋</b>
            \n⚽ Ти крокнув у захоплюючий світ нашого телеграм боту, де кожен матч, кожен гол і кожен переможний момент стають частиною твоєї футбольної пригоди.
            \n<b>Доступний функціонал бота:</b>
            \n1. <b>Додавання улюблених команд:</b> Користувач може додавати свої улюблені футбольні команди до списку обраного. Це дає можливість отримувати оновлення про них та доступ до інших функцій, пов'язаних з цими командами.
            \n2. <b>Статистика по улюбленим командам:</b> Користувач може переглядати статистичні дані про свої улюблені команди, такі як результати, голи, жовті та червоні картки тощо.
            \n3. <b>Прогнози на майбутні матчі:</b> Бот надає прогнози на майбутні матчі улюблених команд, допомагаючи користувачам зробити приблизну оцінку результатів.
            \n4. <b>Мінулі ігри:</b> Користувач може переглядати історію минулих матчів своїх улюблених команд, разом із результатами та основними подіями матчу.
            \n5. <b>Нагадування про майбутні матчі:</b> Бот надсилає користувачеві нагадування про майбутні матчі його улюблених команд за певний період часу перед початком матчу.
            \n6. <b>Текстова трансляція матчів:</b> Користувач може переглядати текстову трансляцію матчів своїх улюблених команд, отримуючи оновлення про події на полі в режимі реального часу.
            \n\nЯкщо в тебе вже є додані команди, то ти можеш вибрати "🫶🏼 Улюблені" або вказати нові скориставшись пунктом меню 👇`,
      Markup.keyboard(commonMenu),
    );
  }
}
