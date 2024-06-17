import { CallbackQuery } from '@telegraf/types/markup';
import Context from 'telegraf/typings/context';
import { Update } from 'telegraf/typings/core/types/typegram';
import { SceneContext, SceneSession, SceneSessionData } from 'telegraf/typings/scenes';
import SceneContextScene from 'telegraf/typings/scenes/context';

import { CastProperty } from '@app/utils/utilityTypes';

interface CSessionData {
  errMsgId?: number;
  settingsMsgId?: number;
  addTeamMsgId?: number;
  favTeamMsgId?: number;
}
namespace Scenes {
  interface SContext<S extends object = any, D extends SceneSessionData = SceneSessionData> extends Context {
    session: SceneSession<D> & CSessionData;
    scene: CastProperty<SceneContextScene<SceneContext<D>>, 'state', S>;
    update: Update & { callback_query: CallbackQuery };
  }
}
