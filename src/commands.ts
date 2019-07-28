import { commands, Disposable } from 'vscode'

import { changePreset } from './settings'

export const registerCommands = (subscriptions: Disposable[]) => {
  subscriptions.push(
    commands.registerCommand('sizer.changePreset', changePreset)
  )
}
