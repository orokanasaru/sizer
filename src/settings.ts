import { window, workspace } from 'vscode'

import { TypeScriptOptions } from './transpile'

export type SizerConfiguration = {
  preset: string
  presets: {
    name: string
    typeScript: TypeScriptOptions
  }[]
}

export const getConfiguration = () => workspace.getConfiguration('sizer')

export const getCurrentPreset = () =>
  getConfiguration().get('preset') as SizerConfiguration['preset']

export const getPresets = () =>
  getConfiguration().get('presets') as SizerConfiguration['presets']

export const getPresetNames = () => getPresets().map(p => p.name)

export const getPresetConfiguration = (preset: string) =>
  getPresets().filter(p => p.name === preset)[0]

export const getCurrentConfiguration = () =>
  getPresetConfiguration(getCurrentPreset())

export const changePreset = async () => {
  const preset = await window.showQuickPick(getPresetNames(), {
    placeHolder: 'Pick a preset'
  })

  if (!preset) {
    return
  }

  await getConfiguration().update('preset', preset)
}
