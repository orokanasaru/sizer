import { combineLatest, merge, Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap, map } from 'rxjs/operators'
import { MinifyOptions } from 'terser'
import { CompilerOptions } from 'typescript'
import { window, workspace } from 'vscode'

import { allValues, equals, isValue } from './utils'

type SizerSettings = Readonly<{
  configurations: {
    terser: {
      name: string
      options: MinifyOptions
    }[]
    typeScript: {
      name: string
      options: CompilerOptions
    }[]
  }
  preset: string
  presets: readonly Readonly<{
    name: string
    sequence: readonly Readonly<{
      name: string
      tool: 'terser' | 'typeScript'
    }>[]
  }>[]
}>

const getSettings = () => workspace.getConfiguration('sizer')

const getPresets = () =>
  getSettings().get('presets') as SizerSettings['presets']

const getConfigurations = () =>
  getSettings().get('configurations') as SizerSettings['configurations']

const getSequenceForPreset = (preset: string) => {
  const presets = getPresets()
  const configurations = getConfigurations()
  const selectedPreset = presets.find(p => p.name === preset)

  if (!selectedPreset) {
    return
  }

  return allValues(
    selectedPreset.sequence.map(s => {
      const config = (configurations[s.tool] as {
        name: string
        options: unknown
      }[]).find(t => t.name === s.name)

      if (config) {
        return { options: config.options, tool: s.tool } as
          | { tool: 'terser'; options: MinifyOptions }
          | { tool: 'typeScript'; options: CompilerOptions }
      }
    })
  )
}

export const getConfig = ({
  changePreset$,
  configuration$,
  start$
}: {
  changePreset$: Observable<unknown>
  configuration$: Observable<unknown>
  start$: Observable<unknown>
}) =>
  combineLatest([
    merge(
      merge(start$, configuration$).pipe(
        map(() => getSettings().get<string>('preset')!),
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
    merge(start$, configuration$)
  ]).pipe(
    map(([preset]) => getSequenceForPreset(preset)),
    filter(isValue),
    distinctUntilChanged(equals)
  )
