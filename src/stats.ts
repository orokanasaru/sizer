import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { Transforms } from './transforms'

const makeBanner = (stats: { name: string; size: number }[]) =>
  stats.reduce((p, c) => `${p}${c.name}: ${c.size}B\n`, '')

export const getStats = ({
  transforms$
}: {
  transforms$: Observable<Transforms>
}) =>
  transforms$.pipe(
    map(transforms => {
      const stats = transforms.map(t => ({
        name: t.name,
        size: t.text.length / 8
      }))

      return {
        banner: makeBanner(stats),
        headline: `${stats.slice(-1)[0].size}B`,
        stats
      }
    })
  )
