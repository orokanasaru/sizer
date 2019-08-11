import cosmiconfig from 'cosmiconfig'
import fs from 'fs'
import * as R from 'ramda'
import { combineLatest, Observable } from 'rxjs'
import { distinctUntilChanged, flatMap, map } from 'rxjs/operators'
import { MinifyOptions } from 'terser'
import { CompilerOptions, getParsedCommandLineOfConfigFile } from 'typescript'

import { Sequence } from './sequence'
import { equals } from './utils'

export type SequenceConfig = (
  | { tool: 'terser'; options: MinifyOptions }
  | { tool: 'typeScript'; options: CompilerOptions })[]

export const getSequenceConfig = ({
  fileName$,
  sequence$
}: {
  fileName$: Observable<string>
  sequence$: Observable<Sequence>
}) =>
  combineLatest([fileName$, sequence$]).pipe(
    flatMap(([fileName, sequence]) =>
      Promise.all(
        sequence.map(async s => {
          if (!s.configFiles) {
            return {
              ...s,
              config: {}
            }
          }

          switch (s.tool) {
            case 'terser': {
              const config = await cosmiconfig('terser', {
                searchPlaces: s.configFiles
              }).search(fileName)

              return {
                ...s,
                config: config ? config.config : {}
              }
            }

            case 'typeScript': {
              const config = await cosmiconfig('tsconfig', {
                searchPlaces: s.configFiles
              }).search(fileName)

              if (!config) {
                return {
                  ...s,
                  config: {}
                }
              }

              const tsconfig = getParsedCommandLineOfConfigFile(
                config.filepath,
                {},
                {
                  fileExists: fs.existsSync,
                  getCurrentDirectory: () => process.cwd(),
                  onUnRecoverableConfigFileDiagnostic: console.error,
                  readDirectory: () => [],
                  // tslint:disable-next-line: non-literal-fs-path
                  readFile: f => fs.readFileSync(f).toString(),
                  trace: console.log,
                  useCaseSensitiveFileNames: false
                }
              )

              return {
                ...s,
                config: tsconfig ? tsconfig.options : {}
              }
            }

            default: {
              return s
            }
          }
        })
      )
    ),
    map(s =>
      s.map(
        ({ config, options, tool }) =>
          ({
            options: R.mergeDeepRight(config, options || {}),
            tool
          } as SequenceConfig[number])
      )
    ),
    distinctUntilChanged(equals)
  )
