import { AppService } from './app.service';
import { Action, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';
import { EComands } from '@app/enums';

@Update()
export class AppUpdate {
  constructor(
    private readonly appService: AppService,
  ) {
  }

  @Start()
  async startCommand(ctx: Context) {
    return this.appService.start(ctx);
  }

  @Action(EComands.ADD_TEAM as any)
  async enterAddTeamScene(ctx: SceneContext) {
    return this.appService.enterAddTeamScene(ctx)
  }
}
