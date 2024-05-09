import { SceneSessionData, SceneSession, SceneContext } from 'telegraf/typings/scenes';
import SceneContextScene from 'telegraf/typings/scenes/context';
import { Update } from "telegraf/typings/core/types/typegram";

import { CallbackQuery } from '@telegraf/types/markup';
import { CastProperty } from '@app/utils/utilityTypes';
import Context from "telegraf/typings/context";

namespace Scenes {
  interface SContext<S extends object = any, D extends SceneSessionData = SceneSessionData> extends Context {
    session: SceneSession<D>;
    scene: CastProperty<SceneContextScene<SceneContext<D>>, 'state', S>;
    update: Update & { callback_query: CallbackQuery }
  }
}
