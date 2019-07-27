// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext } from 'vscode'

import { registerCommands } from './commands'
import { initializeInput } from './input'
import { initializeOutput } from './output'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate({ subscriptions }: ExtensionContext) {
  registerCommands(subscriptions)
  initializeInput(subscriptions)
  initializeOutput(subscriptions)
}

// this method is called when your extension is deactivated
export function deactivate() {}
