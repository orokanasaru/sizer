import fs from 'fs'
import { mergeDeepRight } from 'ramda'
import { combineLatest, merge, Observable } from 'rxjs'
import { distinctUntilChanged, filter, flatMap, map, tap } from 'rxjs/operators'
import { MinifyOptions } from 'terser'
import { CompilerOptions, getParsedCommandLineOfConfigFile } from 'typescript'
import { window, workspace } from 'vscode'

import { allValues, equals, isValue } from './utils'

export type TypeScriptOptions = {
  compilerOptions?: CompilerOptions
}

// declare const __non_webpack_require__: typeof require

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
      options?: TypeScriptOptions
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
  | { tool: 'terser'; options: MinifyOptions }
  | { tool: 'typeScript'; options: TypeScriptOptions })[]

const getConfiguration = () => workspace.getConfiguration('sizer')

const getPresets = () =>
  getConfiguration().get<SizerSettings['presets']>('presets') || []

const getConfigurations = () =>
  getConfiguration().get<SizerSettings['configurations']>('configurations') ||
  {}

const loadConfigFile = (candidates?: string[]): unknown => {
  if (!candidates) {
    return {}
  }

  for (const candidate of candidates) {
    const folder = (workspace.workspaceFolders || [])[0]

    if (!folder) {
      return {}
    }

    try {
      // tslint:disable-next-line: non-literal-require
      const root = `${folder.uri.fsPath}`
      const path = `${root}\\${candidate}`

      const tsconfig = getParsedCommandLineOfConfigFile(
        path,
        {},
        {
          fileExists: fs.existsSync,
          getCurrentDirectory: () => root,
          onUnRecoverableConfigFileDiagnostic: console.error,
          readDirectory: () => [],
          // tslint:disable-next-line: non-literal-fs-path
          readFile: s => fs.readFileSync(s).toString(),
          trace: console.log,
          useCaseSensitiveFileNames: false
        }
      )

      if (tsconfig) {
        return {
          compilerOptions: tsconfig.options
        }
      }

      // const config = __non_webpack_require__(path) as unknown

      // if (typeof config === 'function') {
      //   return config() as {}
      // }

      // if (typeof config === 'object') {
      //   return config || {}
      // }
    } catch (e) {
      console.log(e)
      continue
    }
  }

  return {}
}

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
          options: mergeDeepRight(
            loadConfigFile(config.config),
            config.options || {}
          ),
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
      merge(start$, configuration$).pipe(
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
            {
              placeHolder: 'Pick a preset'
            }
          )
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
