import * as R from 'ramda'
import { withLatestFrom } from 'rxjs/operators'
import { Disposable, ExtensionContext, window } from 'vscode'

import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getSequence } from './sequence'
import { getSequenceConfig } from './sequence-config'
import { getStats } from './stats'
import { getFileName, getRelevantText, isEditorRelevant } from './text'
import { getTransforms } from './transforms'

export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = R.pipe(
    (s: Disposable[]) => ({ ...initializeEvents(s), subscriptions: s }),
    e => ({ ...e, relevantText$: getRelevantText(e) }),
    e => ({ ...e, fileName$: getFileName(e) }),
    e => ({ ...e, sequence$: getSequence(e) }),
    e => ({ ...e, sequenceConfig$: getSequenceConfig(e) }),
    e => ({ ...e, transforms$: getTransforms(e) }),
    e => ({ ...e, stats$: getStats(e) })
  )(subscriptions)

  initializeOutput(events)

  const statusBar = window.createStatusBarItem()
  statusBar.command = 'sizer.changePreset'
  subscriptions.push(statusBar)

  events.activeEditor$.subscribe(e =>
    isEditorRelevant(e) ? statusBar.show() : statusBar.hide()
  )

  events.stats$
    .pipe(withLatestFrom(events.transforms$))
    .subscribe(([{ banner, headline }, transforms]) => {
      statusBar.text = headline
      statusBar.tooltip = banner
      statusBar.show()

      clearOutput()
      // don't show initial text
      transforms.slice(1).forEach(t => {
        writeOutput(`\n/***${t.name}***/\n${t.text}\n`)
      })

      writeOutput('\n/***Stats***/\n')
      writeOutput(banner)
    }, console.error)
}

export const deactivate = () => undefined
