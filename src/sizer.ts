// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { combineLatest } from 'rxjs'
import { distinctUntilChanged, map } from 'rxjs/operators'
import { ExtensionContext } from 'vscode'

import { registerCommands } from './commands'
import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getConfig } from './settings'
import { getRelevantText } from './text'
import { transpile } from './transpile'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = initializeEvents(subscriptions)

  registerCommands(subscriptions)
  initializeOutput(events)

  combineLatest([getConfig(events), getRelevantText(events)])
    .pipe(
      map(([config, text]) => transpile(text, config.typeScript).outputText),
      distinctUntilChanged()
    )
    .subscribe(t => {
      clearOutput()
      writeOutput(t)
    })
}

// this method is called when your extension is deactivated
export const deactivate = () => undefined
