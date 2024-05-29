import { EScenes } from '@app/enums';
import { FavoriteRepository, UserRepository } from '@app/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '@app/@types/custom';
import { Markup } from 'telegraf';
import { getFavoriteTeamButtons, getUserId } from '@app/utils';

interface SceneData {}
type SceneCtx = Scenes.SContext<SceneData>;

@Injectable()
@Scene(EScenes.SETTINGS)
export class SettingsScene {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly repository: FavoriteRepository,
  ) {}

  private readonly logger = new Logger(SettingsScene.name);

  @SceneEnter()
  async start(@Ctx() ctx: SceneCtx) {
    const userId = getUserId(ctx);
    if (!userId) return;

    const user = await this.userRepository.findOne({
      where: { telegramId: userId },
      select: ['favorites', 'settings'],
      relations: { favorites: true },
    });
    if (!user) {
      return;
    }

    const { favorites, settings } = user;

    this.logger.log(favorites);

    const menu = Markup.inlineKeyboard(getFavoriteTeamButtons(favorites));
    await ctx.replyWithHTML(
      'Ocь список найкращих команд світу, без перебільшення😉\n По якій команді потрібна інформація? 👇',
      menu,
    );
    return;
  }

  // @Action(new RegExp(`^${ECallbacks.FAVORITE_TEAM}`))
  // async chooseTeam(@Ctx() ctx: SceneCtx) {
  //   const [id] = getAnswerIdentifiers(ctx.update);

  //   if (!id) {
  //     return;
  //   }

  //   const team = await this.repository.findOneById(id);

  //   if (!team) {
  //     return;
  //   }

  //   ctx.scene.state = { ...ctx.scene.state, teamId: team.apiId };

  //   await ctx.replyWithHTML(
  //     `🧑🏽‍🤝‍🧑🏻 <b>${team.name}</b>
  //   \n👇 Що саме тебе цікавить?`,
  //     Markup.inlineKeyboard(getTeamButtons()),
  //   );
  //   return;
  // }
}
