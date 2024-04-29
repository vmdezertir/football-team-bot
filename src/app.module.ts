import { Module } from '@nestjs/common';
import { AppUpdate } from './app.update';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { Postgres } from '@telegraf/session/pg';
import { session } from 'telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AddTeamScene } from '@app/scenes';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        const store = Postgres({
          host: confService.get<string>('DB_HOST'),
          database: confService.get<string>('DB_NAME'),
          user: confService.get<string>('DB_USERNAME'),
          password: confService.get<string>('DB_PASSWORD'),
        });

        return ({
          token: confService.get<string>('BOT_TOKEN'),
          middlewares: [session({ store })],
        });
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        return ({
          type: 'postgres',
          host: confService.get<string>('DB_HOST'),
          port: confService.get<number>('DB_PORT'),
          username: confService.get<string>('DB_USERNAME'),
          password: confService.get<string>('DB_PASSWORD'),
          database: confService.get<string>('DB_NAME'),
          entities: [],
          synchronize: true,
          autoLoadEntities: true,
        });
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AppService, AppUpdate, AddTeamScene],
})


export class AppModule {
}
