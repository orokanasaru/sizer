import { combineLatest, merge, Subject } from 'rxjs'
import { distinctUntilChanged, map } from 'rxjs/operators'
import { window, workspace } from 'vscode'

import { Events } from './events'
import { TypeScriptOptions } from './transpile'

type SizerConfiguration = {
  preset: string
  presets: {
    name: string
    typeScript: TypeScriptOptions
  }[]
}

const getConfiguration = () => workspace.getConfiguration('sizer')

const getCurrentPreset = () =>
  getConfiguration().get('preset') as SizerConfiguration['preset']

const getPresets = () =>
  getConfiguration().get('presets') as SizerConfiguration['presets']

const getPresetNames = () => getPresets().map(p => p.name)

const selectedPreset$ = new Subject<string>()

export const changePreset = async () =>
  selectedPreset$.next(
    await window.showQuickPick(getPresetNames(), {
      placeHolder: 'Pick a preset'
    })
  )

export const getConfig = ({ configuration$, start$ }: Events) =>
  combineLatest([
    merge(
      merge(start$, configuration$).pipe(
        map(getCurrentPreset),
        distinctUntilChanged()
      ),
      selectedPreset$
    ),
    merge(start$, configuration$).pipe(map(getPresets))
  ]).pipe(
    map(([preset, presets]) => presets.filter(p => p.name === preset)[0]),
    distinctUntilChanged((p, n) => JSON.stringify(p) === JSON.stringify(n))
  )
