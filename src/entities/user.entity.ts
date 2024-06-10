import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Favorite } from './favorite.entity';
import { IsDefined, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Fixture } from './fixture.entity';

export interface ISetNameValue {
  id: number;
  name: string;
}

export interface ISettings {
  bets: ISetNameValue[];
  bookmakers: ISetNameValue[];
}

class SettingsFieldDto implements ISetNameValue {
  @IsDefined()
  @IsInt()
  @Min(1)
  id: number;

  @IsDefined()
  @IsString()
  name: string;
}
export class SettingsDto implements ISettings {
  @IsDefined()
  @ValidateNested()
  bets: SettingsFieldDto[];

  @IsDefined()
  @ValidateNested()
  bookmakers: SettingsFieldDto[];

  public static getDefault() {
    return {
      bets: [
        {
          id: 1,
          name: 'Match Winner',
        },
        {
          id: 5,
          name: 'Goals Over/Under',
        },
      ],
      bookmakers: [
        {
          id: 8,
          name: 'Bet365',
        },
        {
          id: 11,
          name: '1xBet',
        },
      ],
    };
  }
}

@Entity({ name: 'users' })
@Unique(['telegramId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'telegram_id' })
  telegramId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'user_name', default: 'soccerWizard' })
  userName: string;

  @Column({ type: 'varchar', length: 5, default: 'uk' })
  language: string;

  @Column({ type: 'jsonb', default: SettingsDto.getDefault() })
  settings: SettingsDto;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  @OneToMany(() => Favorite, favorite => favorite.user, { onDelete: 'CASCADE' })
  favorites: Favorite[];

  @ManyToMany(() => Fixture, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'user_fixtures',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'fixture_id', referencedColumnName: 'id' },
  })
  fixtures: Fixture[];
}
