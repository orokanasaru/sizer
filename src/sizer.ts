import { combineLatest } from 'rxjs'
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators'
import { ExtensionContext } from 'vscode'

import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getConfig } from './settings'
import { minify } from './terser'
import { getRelevantText } from './text'
import { transpile } from './typescript'
import { isEqual } from './utils'

export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = initializeEvents(subscriptions)

  initializeOutput(events)

  combineLatest([getConfig(events), getRelevantText(events)])
    .pipe(
      map(([{ terser, typeScript }, text]) => ({
        terser,
        typeScript: transpile(text, typeScript).outputText
      })),
      distinctUntilChanged(isEqual),
      debounceTime(500),
      map(({ terser, typeScript }) => ({
        terser: minify(typeScript, terser),
        typeScript
      })),
      distinctUntilChanged()
    )
    .subscribe(({ terser, typeScript }) => {
      clearOutput()
      writeOutput('\n/***TypeScript***/\n')
      writeOutput(typeScript)
      writeOutput('\n/***Terser***/\n')
      writeOutput(`${terser.code || terser.error}`)
    }, console.error)
}

export const deactivate = () => undefined
