import { merge, Observable, of, Subject } from 'rxjs'
import { commands, Disposable, window, workspace } from 'vscode'

export const initializeEvents = (dispose: Disposable[]) => {
  const commandToObservable = (command: string): Observable<unknown> => {
    const subject = new Subject()
    dispose.push(commands.registerCommand(command, () => subject.next(true)))

    return subject
  }

  const eventToObservable = <T>(
    event: (listener: (e: T) => void) => Disposable
  ): Observable<T> => {
    const subject = new Subject<T>()
    dispose.push(event(e => subject.next(e)))

    return subject
  }

  return {
    activeEditor$: merge(
      of(window.activeTextEditor),
      eventToObservable(window.onDidChangeActiveTextEditor)
    ),
    changePreset$: commandToObservable('sizer.changePreset'),
    configuration$: eventToObservable(workspace.onDidChangeConfiguration),
    document$: eventToObservable(workspace.onDidChangeTextDocument),
    start$: of(true),
    textSelection$: eventToObservable(window.onDidChangeTextEditorSelection)
  } as const
}
