import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Postgres } from '@telegraf/session/pg';
import { Hears, Start, TelegrafModule, Update } from 'nestjs-telegraf';
import { Context, session } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';

import { Favorite, Fixture, User } from '@app/entities';
import { EScenes } from '@app/enums';
import { FavoriteRepository, FixtureRepository, UserRepository } from '@app/repositories';
import { AddTeamScene, FavoriteScene, SettingsScene } from '@app/scenes';
import { ApiFootballService, RemindQueueConsumerService } from '@app/services';
import { TelegramStartService } from '@app/telegram/telegram.service';
import { cleanupMiddleware } from '@app/utils';

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
