import { commands, Disposable } from 'vscode'

import { clearOutput, writeOutput } from './output'
import { changePreset, getCurrentConfiguration } from './settings'
import { transpile } from './transpile'

const testTranspile = () => {
  {
    const { outputText } = transpile(
      `
        export const transpile = (input: string, options: Options) => {
        const { diagnostics, outputText } = transpileModule(input, { compilerOptions: options });

        return { diagnostics, outputText};
        };
      `,
      getCurrentConfiguration().typeScript
    )

    clearOutput()
    writeOutput(outputText)
  }
}

export const registerCommands = (subscriptions: Disposable[]) => {
  subscriptions.push(
    commands.registerCommand('sizer.helloWorld', testTranspile)
  )

  subscriptions.push(
    commands.registerCommand('sizer.changePreset', changePreset)
  )
}
