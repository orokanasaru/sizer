import { merge, Observable } from 'rxjs'
import { languages, OutputChannel, window } from 'vscode'

let outputChannel: OutputChannel | undefined

export const clearOutput = () => {
  outputChannel!.clear()
  outputChannel!.append('// Sizer\n')
}

export const writeOutput = (output: string) => {
  outputChannel!.append(output)
}

const setLanguage = async () => {
  // https://github.com/microsoft/vscode/issues/72021#issuecomment-498665009
  for (const editor of window.visibleTextEditors) {
    if (editor.document.uri.scheme === 'output') {
      await languages.setTextDocumentLanguage(
        editor.document,
        editor.document.lineAt(0).text.includes('Sizer')
          ? 'javascriptreact'
          : 'Log'
      )
    }
  }
}

export const initializeOutput = ({
  activeEditor$,
  start$
}: {
  activeEditor$: Observable<unknown>
  start$: Observable<unknown>
}) => {
  merge(start$, activeEditor$).subscribe(setLanguage)

  outputChannel = window.createOutputChannel('Sizer')
}
