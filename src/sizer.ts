// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { distinctUntilChanged, map } from 'rxjs/operators'
import { ExtensionContext } from 'vscode'

import { registerCommands } from './commands'
import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getCurrentConfiguration } from './settings'
import { getRelevantText } from './text'
import { transpile } from './transpile'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = ({ subscriptions }: ExtensionContext) => {
  registerCommands(subscriptions)
  initializeOutput(subscriptions)

  const events = initializeEvents(subscriptions)

  getRelevantText(events)
    .pipe(
      map(t => transpile(t, getCurrentConfiguration().typeScript).outputText),
      distinctUntilChanged()
    )
    .subscribe(t => {
      clearOutput()
      writeOutput(t)
    })
}

// this method is called when your extension is deactivated
export const deactivate = () => undefined
