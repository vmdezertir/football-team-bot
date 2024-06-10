import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from '@app/telegram/telegram.module';
import { WidgetsModule } from '@app/widgets/widgets.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        return {
          type: 'postgres',
          host: confService.get<string>('DB_HOST'),
          port: confService.get<number>('DB_PORT'),
          username: confService.get<string>('DB_USERNAME'),
          password: confService.get<string>('DB_PASSWORD'),
          database: confService.get<string>('DB_NAME'),
          entities: [],
          synchronize: true,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        return {
          redis: {
            host: confService.get<string>('REDIS_DB_HOST'),
            port: confService.get<number>('REDIS_DB_PORT'),
          },
        };
      },
      inject: [ConfigService],
    }),
    TelegramModule,
    WidgetsModule,
  ],
})
export class AppModule {}
