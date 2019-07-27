import { languages, window } from 'vscode'

const outputChannel = window.createOutputChannel('Sizer')

export const writeOutput = (output: string) => {
  outputChannel.clear()
  outputChannel.append('// Sizer\n')
  outputChannel.append(output)
}

window.onDidChangeActiveTextEditor(async () => {
  // https://github.com/microsoft/vscode/issues/72021#issuecomment-498665009
  for (const editor of window.visibleTextEditors) {
    if (editor.document.fileName.startsWith('extension-output')) {
      await languages.setTextDocumentLanguage(
        editor.document,
        editor.document.lineAt(0).text.includes('Sizer') ? 'javascript' : 'Log'
      )
    }
  }
})
