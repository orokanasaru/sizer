import { flow } from 'lodash-es'
import { combineLatest } from 'rxjs'
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators'
import { Disposable, ExtensionContext, window } from 'vscode'

import { initializeEvents } from './events'
import { clearOutput, initializeOutput, writeOutput } from './output'
import { getConfig } from './settings'
import { minify } from './terser'
import { getRelevantText, isEditorRelevant } from './text'
import { transpile } from './typescript'
import { isEqual } from './utils'

const makeBanner = (
  initial: number,
  postTypescript: number,
  postTerser: number
) =>
  `Initial: ${initial}B` +
  `\nAfter TypeScript: ${postTypescript}B` +
  `${postTerser ? `\nAfter Terser: ${postTerser}B` : ''}`

export const activate = ({ subscriptions }: ExtensionContext) => {
  const events = flow(
    (s: Disposable[]) =>
      ({ ...initializeEvents(s), subscriptions: s } as const),
    e => ({ ...e, currentConfig$: getConfig(e) } as const),
    e => ({ ...e, relevantText$: getRelevantText(e) } as const)
  )(subscriptions)

  initializeOutput(events)

  const initial$ = combineLatest([events.currentConfig$, events.relevantText$])

  const typeScript$ = initial$.pipe(
    map(([{ typeScript: typeScriptOptions, ...e }, initialText]) => ({
      ...e,
      initialText,
      typeScriptOutput: transpile(initialText, typeScriptOptions).outputText
    })),
    distinctUntilChanged(isEqual)
  )

  const terser$ = typeScript$.pipe(
    debounceTime(500),
    map(({ terser: terserOptions, ...e }) => ({
      ...e,
      terserOutput: minify(e.typeScriptOutput, terserOptions)
    })),
    distinctUntilChanged()
  )

  const stats$ = terser$.pipe(
    map(e => ({
      ...e,
      stats: {
        initial: e.initialText.length / 8,
        postTerser:
          e.terserOutput.code !== undefined
            ? e.terserOutput.code.length / 8
            : 0,
        postTypeScript: e.typeScriptOutput.length / 8
      }
    }))
  )

  const statusBar = window.createStatusBarItem()
  statusBar.command = 'sizer.changePreset'
  subscriptions.push(statusBar)

  events.activeEditor$.subscribe(e =>
    isEditorRelevant(e) ? statusBar.show() : statusBar.hide()
  )

  stats$.subscribe(({ stats, terserOutput, typeScriptOutput }) => {
    statusBar.text = `${stats.postTerser}B` || '$(alert)'
    statusBar.tooltip = makeBanner(
      stats.initial,
      stats.postTypeScript,
      stats.postTerser
    )
    statusBar.show()

    clearOutput()
    writeOutput('\n/***TypeScript***/\n')
    writeOutput(typeScriptOutput)
    writeOutput('\n/***Terser***/\n')
    writeOutput(`${terserOutput.code || terserOutput.error}\n`)
    writeOutput('\n/***Stats***/\n')
    writeOutput(
      makeBanner(stats.initial, stats.postTypeScript, stats.postTerser)
    )
  }, console.error)
}

export const deactivate = () => undefined
