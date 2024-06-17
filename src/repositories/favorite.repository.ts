import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { InsertResult } from 'typeorm/query-builder/result/InsertResult';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';

import { Favorite } from '@app/entities';

@Injectable()
export class FavoriteRepository extends Repository<Favorite> {
  constructor(private dataSource: DataSource) {
    super(Favorite, dataSource.manager);
  }

  async insert(entity: QueryDeepPartialEntity<Favorite>): Promise<InsertResult> {
    return super.insert(entity).catch(e => {
      throw new BadRequestException(FavoriteRepository.getSafeDbMessageError(e));
    });
  }

  async update(
    criteria: FindOptionsWhere<Favorite>,
    partialEntity: QueryDeepPartialEntity<Favorite>,
  ): Promise<UpdateResult> {
    return super.update(criteria, partialEntity).catch(e => {
      throw new BadRequestException(FavoriteRepository.getSafeDbMessageError(e));
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
