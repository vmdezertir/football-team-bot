import { Module } from '@nestjs/common';
import { Hears, Start, TelegrafModule, Update } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Postgres } from '@telegraf/session/pg';
import { Context, session } from 'telegraf';
import { AddTeamScene, FavoriteScene, SettingsScene } from '@app/scenes';
import { TelegramStartService } from '@app/telegram/telegram.service';
import { EScenes } from '@app/enums';
import { SceneContext } from 'telegraf/scenes';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite, Fixture, User } from '@app/entities';
import { FavoriteRepository, UserRepository, FixtureRepository } from '@app/repositories';
import { cleanupMiddleware } from '@app/utils';
import { BullModule } from '@nestjs/bull';
import { ApiFootballService, RemindQueueConsumerService } from '@app/services';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        const store = Postgres({
          host: confService.get<string>('DB_HOST'),
          database: confService.get<string>('DB_NAME'),
          user: confService.get<string>('DB_USERNAME'),
          password: confService.get<string>('DB_PASSWORD'),
        });

        return {
          token: confService.get('BOT_TOKEN') as string,
          middlewares: [session({ store }), cleanupMiddleware],
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'remind' }),
    TypeOrmModule.forFeature([User, Favorite, Fixture]),
  ],
  providers: [
    ConfigService,
    TelegramStartService,
    ApiFootballService,
    RemindQueueConsumerService,
    AddTeamScene,
    SettingsScene,
    FavoriteScene,
    UserRepository,
    FavoriteRepository,
    FixtureRepository,
  ],
})
@Update()
export class TelegramModule {
  constructor(private readonly service: TelegramStartService) {}

  @Start()
  async startCommand(ctx: Context) {
    return this.service.start(ctx);
  }

  @Hears('🤔 Вказати команду')
  async enterAddTeamScene(ctx: SceneContext) {
    await ctx.scene.enter(EScenes.ADD_TEAM);
  }

  @Hears('🫶🏼 Улюблені')
  async enterFavoriteScene(ctx: SceneContext) {
    await ctx.scene.enter(EScenes.FAVORITE);
  }

  @Hears('🛠️ Налаштування')
  async enterSettingsScene(ctx: SceneContext) {
    return ctx.scene.enter(EScenes.SETTINGS);
  }

  @Hears('🔄 Перезапустити')
  async restart(ctx: SceneContext) {
    return ctx.scene.reenter();
  }
}
