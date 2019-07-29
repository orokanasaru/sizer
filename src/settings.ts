import { combineLatest, merge } from 'rxjs'
import { distinctUntilChanged, filter, flatMap, map } from 'rxjs/operators'
import { MinifyOptions } from 'terser'
import { CompilerOptions } from 'typescript'
import { window, workspace } from 'vscode'

import { Events } from './events'
import { isEqual, isValue } from './utils'

type SizerConfiguration = {
  preset: string
  presets: {
    name: string
    terser: MinifyOptions
    typeScript: CompilerOptions
  }[]
}

const getConfiguration = () => workspace.getConfiguration('sizer')

const getPresets = () =>
  getConfiguration().get('presets') as SizerConfiguration['presets']

export const getConfig = ({ changePreset$, configuration$, start$ }: Events) =>
  combineLatest([
    merge(
      merge(start$, configuration$).pipe(
        map(() => getConfiguration().get<string>('preset')!),
        // enable changing presets without overriding quick pick preset
        distinctUntilChanged()
      ),
      changePreset$.pipe(
        flatMap(() =>
          window.showQuickPick(getPresets().map(p => p.name), {
            placeHolder: 'Pick a preset'
          })
        ),
        filter(isValue)
      )
    ),
    merge(start$, configuration$).pipe(map(getPresets))
  ]).pipe(
    map(([preset, presets]) => presets.filter(p => p.name === preset)[0]),
    filter(isValue),
    distinctUntilChanged(isEqual)
  )
