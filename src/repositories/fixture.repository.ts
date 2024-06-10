import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Fixture } from '@app/entities';

@Injectable()
export class FixtureRepository extends Repository<Fixture> {
  constructor(private dataSource: DataSource) {
    super(Fixture, dataSource.manager);
  }
}
