import { Observable, of, Subject } from 'rxjs'
import {
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
  configuration$: Observable<ConfigurationChangeEvent>
  document$: Observable<TextDocumentChangeEvent>
  start$: Observable<true>
  textSelection$: Observable<TextEditorSelectionChangeEvent>
}>

let events: Events | undefined

export const getEvents = () => events

export const initializeEvents = (dispose: Disposable[]) => {
  if (events) {
    return events
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
    configuration$: eventToObservable(workspace.onDidChangeConfiguration),
    document$: eventToObservable(workspace.onDidChangeTextDocument),
    start$: of(true),
    textSelection$: eventToObservable(window.onDidChangeTextEditorSelection)
  }

  return events
}
