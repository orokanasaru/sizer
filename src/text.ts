import { combineLatest, EMPTY, merge, of } from 'rxjs'
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap
} from 'rxjs/operators'
import { Selection, TextDocument, TextEditor } from 'vscode'

import { Events } from './events'

export const isEditorRelevant = (editor: TextEditor | undefined) =>
  editor !== undefined && isDocumentRelevant(editor.document)

const isDocumentRelevant = (document: TextDocument) =>
  document.uri.scheme !== 'output' &&
  document.languageId.match(/(java|type)script/i) !== null

const getSelectedText = (
  selections: readonly Selection[],
  editor: TextEditor
) =>
  selections
    .map(editor.document.getText)
    .filter(t => t)
    .join('\n')

export const getRelevantText = ({
  activeEditor$,
  document$,
  textSelection$
}: Events) =>
  activeEditor$.pipe(
    switchMap(e =>
      isEditorRelevant(e)
        ? combineLatest([
            of(e!.document),
            merge(
              // kick off for on start scenario
              of(getSelectedText(e!.selections, e!)),
              document$.pipe(
                // gets fired when writing to log
                filter(d => isDocumentRelevant(d.document)),
                map(d => d.document.getText())
              ),
              textSelection$.pipe(
                // gets fired when writing to log
                filter(t => isEditorRelevant(t.textEditor)),
                map(t => getSelectedText(t.selections, t.textEditor)),
                // only want to fire once when empty
                distinctUntilChanged()
              )
            )
          ])
        : EMPTY
    ),
    map(([doc, text]) => text || doc.getText()),
    distinctUntilChanged(),
    debounceTime(100)
  )
