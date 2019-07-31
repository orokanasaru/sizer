import { clone } from 'ramda'
import { combineLatest, Observable } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, share } from 'rxjs/operators'
import { minify, MinifyOptions } from 'terser'
import { transpileModule } from 'typescript'

import { Sequence, TypeScriptOptions } from './sequence'
import { equals } from './utils'

export type Transforms = { name: string; text: string }[]

export const terser = (input: string, options: MinifyOptions) =>
  // terser mutates the options which breaks equality checking later
  minify(input, clone(options))

export const typeScript = (
  input: string,
  { compilerOptions }: TypeScriptOptions
) =>
  transpileModule(input, {
    compilerOptions,
    // infer ts vs tsx based on presence of closing tags
    // enables use on unnamed files
    fileName: input.match(/<\/|\/>/) ? 'tmp.tsx' : 'tmp.ts'
  })

export const getTransforms = ({
  relevantText$,
  sequence$
}: {
  relevantText$: Observable<string>
  sequence$: Observable<Sequence>
}) =>
  combineLatest([relevantText$, sequence$]).pipe(
    debounceTime(500),
    map(([initialText, sequence]) =>
      sequence.reduce(
        (transforms, transform) => {
          const inputText = transforms.slice(-1)[0].text.trimEnd()
          let text: string

          switch (transform.tool) {
            case 'terser': {
              text = terser(inputText, transform.options).code || ''
              break
            }

            case 'typeScript': {
              text = typeScript(inputText, transform.options).outputText
              break
            }

            default: {
              text = inputText
            }
          }

          return [...transforms, { name: transform.tool, text }]
        },
        [{ name: 'initial', text: initialText }]
      )
    ),
    distinctUntilChanged(equals),
    share()
  )
