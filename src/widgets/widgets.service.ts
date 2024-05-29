import { UserRepository } from '@app/repositories';
import { ApiFootballService } from '@app/services';
import { Injectable, Logger } from '@nestjs/common';
import { WidgetsFixtureOddsDto, WidgetsLeagueStatsRespDto } from './widgets.dto';
import { IFollowOdd, IFollowOddValue, IOddsTableData } from '@app/interfaces';

@Injectable()
export class WidgetsService {
  private readonly logger = new Logger(WidgetsService.name);

  constructor(
    private readonly footballService: ApiFootballService,
    private readonly userRepository: UserRepository,
  ) {}

  async getFixtureOdds(id: number, userId: number): Promise<WidgetsFixtureOddsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'settings'],
    });

    const followBets = (user?.settings.bets || []).reduce((acc, bet) => {
      acc[bet.id] = { id: bet.id, name: bet.name, bookmakers: [], betValTitles: [] };
      return acc;
    }, {} as IFollowOdd);
    const followBookmakers = user?.settings.bookmakers || [];

    const response = await this.footballService.findFixtureOdds(id);

    this.logger.log('response:', JSON.stringify(response));

    // TODO: should be optimized if possible or if have free time
    // filter depends on user settings and group by bet
    const result = response.reduce((acc, { id: bookmakerId, name: bookmakerName, bets }) => {
      if (followBookmakers.some(followBookmaker => followBookmaker.id === bookmakerId)) {
        for (const bet of bets) {
          if (!acc[bet.id]) continue;

          acc[bet.id].bookmakers.push({
            id: bookmakerId,
            name: bookmakerName,
            values: bet.values,
          });
          const updValues = [...acc[bet.id].betValTitles, ...bet.values.map(v => v.value)];
          acc[bet.id].betValTitles = [...new Set(updValues)];
        }
      }

      return acc;
    }, followBets);

    this.logger.log('result:', JSON.stringify(result));

    // normalize for table
    const contents: IOddsTableData[] = Object.values(result).reduce(
      (acc, { id, bookmakers, betValTitles }: IFollowOddValue) => {
        const rows = betValTitles.map((title: string) => [title]);
        const titles = [] as any;

        for (const { name: bNames, values: bValues } of bookmakers) {
          titles.push(bNames);
          for (const [betIndex, betValTitle] of betValTitles.entries()) {
            const f = bValues.find(bValue => bValue.value === betValTitle);
            rows[betIndex].push(f ? f.odd : '-');
          }
        }

        acc.push({ id, rows, titles });

        return acc;
      },
      [],
    );

    this.logger.log('contents:', JSON.stringify(contents));

    return { tabs: followBets, tables: contents };
  }

  async getLeagueStats(leagueId: number, season: number): Promise<WidgetsLeagueStatsRespDto> {
    const response = await this.footballService.findLeagueStats(leagueId, season);

    this.logger.log('response:', JSON.stringify(response));

    return { tabs: ['Голи', 'Гольові паси', 'Жовті картки', 'Червоні картки'], contents: response };
  }
}
