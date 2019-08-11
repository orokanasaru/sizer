import { combineLatest, merge, Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap, map } from 'rxjs/operators'
import { MinifyOptions } from 'terser'
import { CompilerOptions } from 'typescript'
import { window, workspace } from 'vscode'

import { allValues, equals, isValue } from './utils'

type SizerSettings = {
  configurations?: {
    terser?: {
      config?: string[]
      name?: string
      options?: MinifyOptions
    }[]
    typeScript?: {
      config?: string[]
      name?: string
      options?: CompilerOptions
    }[]
  }
  preset?: string
  presets?: {
    name?: string
    sequence?: {
      name?: string
      tool?: 'terser' | 'typeScript'
    }[]
  }[]
}

export type Sequence = (
  | { configFiles?: string[]; tool: 'terser'; options: MinifyOptions }
  | {
      configFiles?: string[]
      tool: 'typeScript'
      options: CompilerOptions
    })[]

const getConfiguration = () => workspace.getConfiguration('sizer')

const getPresets = () =>
  getConfiguration().get<SizerSettings['presets']>('presets') || []

const getConfigurations = () =>
  getConfiguration().get<SizerSettings['configurations']>('configurations') ||
  {}

const getSequenceForPreset = (preset: string) => {
  const selectedPreset = getPresets().find(p => p.name === preset)

  if (!selectedPreset) {
    return
  }

  return allValues(
    (selectedPreset.sequence || []).map(s => {
      if (!s.tool) {
        return
      }

      const config = ((getConfigurations()[s.tool] || []) as {
        config?: string[]
        name?: string
        options?: unknown
      }[]).find(t => t.name === s.name)

      if (config) {
        return {
          configFiles: config.config,
          options: config.options,
          tool: s.tool
        } as Sequence[number]
      }
    })
  )
}

export const getSequence = ({
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
      merge(configuration$, start$).pipe(
        map(() => getConfiguration().get<string>('preset')!),
        // enable changing presets without overriding quick pick preset
        distinctUntilChanged()
      ),
      changePreset$.pipe(
        flatMap(() =>
          window.showQuickPick(
            getPresets()
              .map(p => p.name)
              .filter(isValue),
            { placeHolder: 'Pick a preset' }
          )
        ),
        filter(isValue)
      )
    ),
    merge(configuration$, start$)
  ]).pipe(
    map(([preset]) => getSequenceForPreset(preset)),
    filter(isValue),
    distinctUntilChanged(equals)
  )
