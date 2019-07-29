import { Observable, of, Subject } from 'rxjs'
import {
  commands,
  ConfigurationChangeEvent,
  Disposable,
  TextDocumentChangeEvent,
  TextEditor,
  TextEditorSelectionChangeEvent,
  window,
  workspace
} from 'vscode'

export type Events = Readonly<{
  activeEditor$: Observable<TextEditor | undefined>
  changePreset$: Observable<unknown>
  configuration$: Observable<ConfigurationChangeEvent>
  document$: Observable<TextDocumentChangeEvent>
  start$: Observable<unknown>
  textSelection$: Observable<TextEditorSelectionChangeEvent>
}>

let events: Events | undefined

export const getEvents = () => events

export const initializeEvents = (dispose: Disposable[]) => {
  if (events) {
    return events
  }

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

  events = {
    activeEditor$: eventToObservable(window.onDidChangeActiveTextEditor),
    changePreset$: commandToObservable('sizer.changePreset'),
    configuration$: eventToObservable(workspace.onDidChangeConfiguration),
    document$: eventToObservable(workspace.onDidChangeTextDocument),
    start$: of(true),
    textSelection$: eventToObservable(window.onDidChangeTextEditorSelection)
  }

  return events
}
