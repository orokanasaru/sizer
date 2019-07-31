import { pipe } from 'ramda'
import { combineLatest } from 'rxjs'
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators'
import { Disposable, ExtensionContext, window } from 'vscode'

import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getConfig } from './settings'
import { minify } from './terser'
import { getRelevantText, isEditorRelevant } from './text'
import { transpile } from './typescript'
import { equals } from './utils'

const makeBanner = (stats: { name: string; size: number }[]) =>
  stats.reduce((p, c) => `${p}${c.name}: ${c.size}B\n`, '')

export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = pipe(
    (s: Disposable[]) =>
      ({ ...initializeEvents(s), subscriptions: s } as const),
    e => ({ ...e, currentConfig$: getConfig(e) } as const),
    e => ({ ...e, relevantText$: getRelevantText(e) } as const)
  )(subscriptions)

  initializeOutput(events)

  const initial$ = combineLatest([events.currentConfig$, events.relevantText$])

  const transformed$ = initial$.pipe(
    debounceTime(500),
    map(([sequence, initialText]) => ({
      transforms: sequence.reduce(
        (transforms, transform) => {
          const inputText = transforms.slice(-1)[0].text.trimEnd()
          let text: string

          switch (transform.tool) {
            case 'terser': {
              text = minify(inputText, transform.options).code || ''
              break
            }

            case 'typeScript': {
              text = transpile(inputText, transform.options).outputText
              break
            }

            default: {
              text = inputText
            }
          }

          return [...transforms, { name: transform.tool, text }]
        },
        [{ name: 'initial', text: initialText }]
      )
    })),
    distinctUntilChanged(equals)
  )

  const stats$ = transformed$.pipe(
    map(({ transforms }) => ({
      stats: transforms.map(t => ({ name: t.name, size: t.text.length / 8 })),
      transforms
    }))
  )

  const statusBar = window.createStatusBarItem()
  statusBar.command = 'sizer.changePreset'
  subscriptions.push(statusBar)

  events.activeEditor$.subscribe(e =>
    isEditorRelevant(e) ? statusBar.show() : statusBar.hide()
  )

  stats$.subscribe(({ stats, transforms }) => {
    statusBar.text = `${stats.slice(-1)[0].size}B`
    statusBar.tooltip = makeBanner(stats)
    statusBar.show()

    clearOutput()
    transforms.forEach(t => {
      writeOutput(`\n/***${t.name}***/\n${t.text}\n`)
    })

    writeOutput('\n/***Stats***/\n')
    writeOutput(makeBanner(stats))
  }, console.error)
}

export const deactivate = () => undefined
