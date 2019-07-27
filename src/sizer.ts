// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext } from 'vscode'

import { testTranspile } from './commands'
import { changePreset } from './settings'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  const registerCommand = (name: string, cb: () => void) => {
    context.subscriptions.push(commands.registerCommand(name, cb))
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  registerCommand('sizer.helloWorld', testTranspile)
  registerCommand('sizer.changePreset', changePreset)
}

// this method is called when your extension is deactivated
export function deactivate() {}
