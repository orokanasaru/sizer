// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { combineLatest } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators'
import { ExtensionContext } from 'vscode'

import { registerCommands } from './commands'
import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getConfig } from './settings'
import { minify } from './terser'
import { getRelevantText } from './text'
import { transpile } from './typescript'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = initializeEvents(subscriptions)

  registerCommands(subscriptions)
  initializeOutput(events)

  combineLatest([getConfig(events), getRelevantText(events)])
    .pipe(
      tap(e => console.log('hmm', e)),
      map(([{ terser, typeScript }, text]) => ({
        terser,
        typeScript: transpile(text, typeScript).outputText
      })),
      tap(e => console.log('bah', e)),
      //      distinctUntilChanged(jsonEqual),
      debounceTime(500),
      tap(e => console.log('lol', e)),
      map(({ terser, typeScript }) => ({
        terser: minify(typeScript, terser),
        typeScript
      })),
      tap(e => console.log('meh', e)),
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

// this method is called when your extension is deactivated
export const deactivate = () => undefined
