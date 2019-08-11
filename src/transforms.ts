import * as R from 'ramda'
import { combineLatest, Observable } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, share } from 'rxjs/operators'
import { minify, MinifyOptions } from 'terser'
import { CompilerOptions, transpileModule } from 'typescript'

import { SequenceConfig } from './sequence-config'
import { TransformOptions } from './transforms'
import { equals } from './utils'

export type Transforms = { name: string; text: string }[]

export type TransformOptions<T> = {
  fileName?: string
  input: string
  options?: T
}

const terser = ({ input, options }: TransformOptions<MinifyOptions>) =>
  // terser mutates the options which breaks equality checking later
  minify(input, R.clone(options))

const typeScript = ({
  input,
  fileName,
  options
}: TransformOptions<CompilerOptions>) =>
  transpileModule(input, {
    compilerOptions: options,
    // infer ts vs tsx based on presence of closing tags
    // enables use on unnamed files
    fileName: fileName || input.match(/<\/|\/>/) ? 'tmp.tsx' : 'tmp.ts'
  })

export const getTransforms = ({
  fileName$,
  relevantText$,
  sequenceConfig$
}: {
  fileName$: Observable<string>
  relevantText$: Observable<string>
  sequenceConfig$: Observable<SequenceConfig>
}) =>
  combineLatest([fileName$, relevantText$, sequenceConfig$]).pipe(
    debounceTime(500),
    map(([fileName, initialText, sequence]) =>
      sequence.reduce(
        (transforms, transform) => {
          const inputText = transforms.slice(-1)[0].text.trimEnd()
          let text: string

          switch (transform.tool) {
            case 'terser': {
              text =
                terser({ input: inputText, options: transform.options }).code ||
                ''
              break
            }

            case 'typeScript': {
              text = typeScript({
                fileName,
                input: inputText,
                options: transform.options
              }).outputText
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
