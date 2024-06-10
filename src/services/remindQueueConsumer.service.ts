import { EFixtureStatus, IFixture, IFollowJob } from '@app/interfaces';
import { FixtureRepository } from '@app/repositories';
import { Processor, Process, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { ApiFootballService } from './apiFootball.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { MESSAGE_NOTIFY_SEPARATOR } from '@app/const';

@Processor('remind')
export class RemindQueueConsumerService {
  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly repository: FixtureRepository,
    private readonly configService: ConfigService,
    private readonly footballService: ApiFootballService,
  ) {}

  private readonly logger = new Logger(RemindQueueConsumerService.name);

  getIsNeedNotify(status: EFixtureStatus): boolean {
    if (
      [EFixtureStatus.TBD, EFixtureStatus.NS, EFixtureStatus.PST, EFixtureStatus.CANC, EFixtureStatus.ABD].includes(
        status,
      )
    ) {
      return true;
    }

    return false;
  }

  getMessageData(
    fixture: IFixture,
    homeTeam: string,
    awayTeam: string,
  ): { text: string; buttons: InlineKeyboardButton[][] } {
    const path = this.configService.get<string>('BOT_API_URL');
    const zonedDate = toZonedTime(fixture.date, 'Europe/Kiev');
    let text = '';
    let buttons: InlineKeyboardButton[][] = [[]];

    switch (fixture.status.short) {
      // Scheduled
      case EFixtureStatus.TBD:
      case EFixtureStatus.NS: {
        text = `${MESSAGE_NOTIFY_SEPARATOR}Звітую! Футбольний матч <b>${homeTeam}</b> ⚔️ <b>${awayTeam}</b> розпочнеться за <b>10 хвилин!</b> ⚽️🎉\nПриготуйтеся до захоплюючого поєдинку та готуйтеся підтримати свою команду! 🙌\nМачт починається о <b>${format(zonedDate, 'HH:mm')} (Київський час)</b>\nНе пропустіть жодної деталі! Слідкуйте за матчем та нашими оновленнями для найсвіжішої інформації. 📢💬👇`;
        buttons = [[Markup.button.webApp('🔴 Онлайн текстова трансляція', `${path}/widgets/game/${fixture.id}`)]];
        break;
      }

      // Postponed
      case EFixtureStatus.PST: {
        text = `${MESSAGE_NOTIFY_SEPARATOR}🚫❗️ Ми маємо важливе оголошення: футбольний матч <b>${homeTeam}</b> ⚔️ <b>${awayTeam}</b>, був <b>перенесений</b> на нову дату. Це можливо зроблено з метою забезпечення кращого досвіду для вас та інших уболівальників.🚫❗️`;
        break;
      }

      // Cancelled
      case EFixtureStatus.CANC: {
        text = `${MESSAGE_NOTIFY_SEPARATOR}З🚫❗️ великим сумом повідомляємо, що сьогоднішній футбольний матч <b>${homeTeam}</b> ⚔️ <b>${awayTeam}</b> був <b>скасований</b> з неочікуваних причин. Вибачте за будь-які незручності, які це може викликати🚫❗️`;
        break;
      }

      // Abandoned
      case EFixtureStatus.ABD: {
        text = `${MESSAGE_NOTIFY_SEPARATOR}🚫❗️ Ми маємо важливе оголошення: футбольний матч <b>${homeTeam}</b> ⚔️ <b>${awayTeam}</b>, був <b>скасований</b> з різних причин, таких як погана погода, питання безпеки, проблеми з освітленням або недостатній склад гравців чи арбітрів.🚫❗️\n 🕵️‍♂️💡 <b>Що далі?</b> 💡🕵️‍♂️ Чи буде матч <b>перенесений</b> на нову дату, залежить від конкретних правил та регламентів змагання.`;
        break;
      }

      default:
        break;
    }

    return { text, buttons };
  }

  @Process()
  async process({ data }: Job<IFollowJob>) {
    const { id } = data;
    const userFixture = await this.repository.findOne({
      where: { id },
      relations: { users: true },
      select: { id: true, users: { telegramId: true } },
    });

    if (!userFixture) {
      return {};
    }

    if (!userFixture.users.length) {
      return {
        id,
      };
    }

    const { fixture, teams } = await this.footballService.findFixture(id);

    if (!this.getIsNeedNotify(fixture.status.short)) {
      return {
        id,
      };
    }

    const msgPromises = [];
    const { text, buttons } = this.getMessageData(fixture, teams.home.name, teams.away.name);

    for (const { telegramId } of userFixture.users) {
      msgPromises.push(
        this.bot.telegram.sendMessage(telegramId, text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons },
        }),
      );
    }

    await Promise.all(msgPromises);

    return { id };
  }

  @OnQueueCompleted()
  async complete({ data }: Job<IFollowJob>) {
    const { id } = data;

    this.logger.log(`Fixture ${id} delete afte job complete`);

    try {
      await this.repository.delete(id);
    } catch (error) {
      this.logger.warn(`Can't delete fixture ${id}`);
    }
  }
}
