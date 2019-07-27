import { Disposable, TextEditorSelectionChangeEvent, window } from 'vscode'

import { clearOutput, writeOutput } from './output'
import { getCurrentConfiguration } from './settings'
import { transpile } from './transpile'

const handleSelectionChange = ({
  selections,
  textEditor
}: TextEditorSelectionChangeEvent) => {
  if (
    textEditor.document.uri.scheme !== 'output' &&
    textEditor.document.languageId.match(/(java|type)script/i)
  ) {
    const input = selections
      .map(textEditor.document.getText)
      .filter(t => t)
      .join('\n')

    if (!input) {
      return
    }

    const { outputText } = transpile(
      input,
      getCurrentConfiguration().typeScript
    )

    clearOutput()
    writeOutput(outputText)
  }
}

export const initializeInput = (subscriptions: Disposable[]) => {
  subscriptions.push(
    window.onDidChangeTextEditorSelection(handleSelectionChange)
  )
}
