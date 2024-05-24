import { FindOptionsWhere, DataSource, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { InsertResult } from 'typeorm/query-builder/result/InsertResult';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';

import { Injectable, BadRequestException } from '@nestjs/common';
import { User } from '@app/entities';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.manager);
  }

  async insert(entity: QueryDeepPartialEntity<User>): Promise<InsertResult> {
    return super.insert(entity).catch(e => {
      throw new BadRequestException(UserRepository.getSafeDbMessageError(e));
    });
  }

  async update(criteria: FindOptionsWhere<User>, partialEntity: QueryDeepPartialEntity<User>): Promise<UpdateResult> {
    return super.update(criteria, partialEntity).catch(e => {
      throw new BadRequestException(UserRepository.getSafeDbMessageError(e));
    });
  }

  private static getSafeDbMessageError(caughtError: any): string {
    console.log(caughtError);
    let message = 'Database error';

    switch (caughtError.code) {
      case '23505': // unique_violation
        // eslint-disable-next-line no-case-declarations
        const col = (caughtError.detail.match(/\([^()]+\)/g)[0] || '', '()');
        message = 'UNIQUE_' + col.trim().toUpperCase();
        break;
    }

    return message;
  }
}
