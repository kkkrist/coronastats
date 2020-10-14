import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import areacodes from './areacodes.json'
import chartConfig from './chart-config'
import { formatNum, longDate } from './utils'
import { version } from '../package.json'

const App = () => {
  const [areacode, setAreacode] = useState(
    new URLSearchParams(window.location.search).get('areacode') || 'fl'
  )
  const [error, setError] = useState()
  const [lastModified, setLastModified] = useState()
  const [stats, setStats] = useState([])

  useEffect(() => {
    setStats([])

    window
      .fetch('https://api.mundpropaganda.net/coronastats/_find', {
        body: JSON.stringify({
          limit: 9999,
          selector: {
            areacode: {
              $eq: areacode
            }
          },
          sort: [{ date: 'desc' }]
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      })
      .then(res => res.json())
      .then(({ docs }) => {
        setError()

        setLastModified(
          docs.reduce((timestamp, cur) => {
            const last_modified = Date.parse(cur.last_modified)
            return last_modified > timestamp ? last_modified : timestamp
          }, 0)
        )

        setStats(
          docs.reduce(
            (acc, cur, index, arr) => {
              acc[0].data.unshift({ x: new Date(cur.date), y: cur.deaths })

              cur.active &&
                acc[1].data.unshift({ x: new Date(cur.date), y: cur.active })

              cur.recovered &&
                acc[2].data.unshift({
                  x: new Date(cur.date),
                  y: cur.recovered ?? 0
                })

              if (index < arr.length - 8 && areacodes[areacode].population) {
                const sums = []

                for (let shift = 1; shift < 9; shift++) {
                  if (
                    dayjs(arr[index + shift].date).isAfter(
                      dayjs(cur.date).set('date', dayjs(cur.date).date() - 9)
                    )
                  ) {
                    sums.push(arr[index + shift].infected)
                  }
                }

                if (sums.length > 1) {
                  acc[3].data.unshift({
                    x: new Date(cur.date),
                    y: Math.ceil(
                      ((sums[0] - sums[sums.length - 1]) /
                        areacodes[areacode].population) *
                        100000
                    )
                  })
                }
              }

              acc[4].data.unshift({ x: new Date(cur.date), y: cur.infected })

              cur.quarantined &&
                acc[5].data.unshift({
                  x: new Date(cur.date),
                  y: cur.quarantined
                })

              return acc
            },
            [
              {
                color: '#FA5C3A',
                id: 'Todesfälle',
                data: []
              },
              {
                color: '#F79F39',
                id: 'aktive Fälle',
                data: []
              },
              {
                color: '#76CE6D',
                id: 'Genesene',
                data: []
              },
              {
                color: '#BB8DEE',
                id: '7-Tage-Inzidenz*',
                data: []
              },
              {
                color: '#E6B539',
                id: 'Infizierte',
                data: []
              },
              {
                color: '#48AFF3',
                id: 'unter Quarantäne',
                data: []
              }
            ]
          )
        )
      }, setError)
  }, [areacode])

  if (error) {
    console.log(error)
  }

  return (
    <div id='app'>
      <h1>Zeitverlauf der Corona-Fälle in </h1>

      <div style={{ fontSize: '2em', marginBottom: '1.5rem' }}>
        <select
          onChange={({ target: { value } }) => setAreacode(value)}
          value={areacode}
        >
          <option value='fl'>Flensburg</option>
          <option value='sl'>Kreis Schleswig-Flensburg</option>
          <option value='rz'>Kreis Herzogtum Lauenburg</option>
        </select>
      </div>

      <div id='container'>
        <div
          id='linechart'
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {error ? (
            <code>{error.message || error.toString()}</code>
          ) : stats.length === 0 ? (
            <span>Lade…</span>
          ) : (
            <ResponsiveLine
              areaBlendMode='darken'
              colors={a => a.color || '#000'}
              data={stats}
              enableArea
              enableGridX={false}
              enableGridY={false}
              enablePoints={false}
              enableSlices='x'
              xFormat={longDate}
              xScale={{ type: 'time' }}
              yFormat={formatNum}
              yScale={{ type: 'linear' }}
              {...chartConfig}
            />
          )}
        </div>
      </div>

      <footer>
        <p>
          Datenquelle:{' '}
          <a href={areacodes[areacode].sourceUri}>
            {areacodes[areacode].sourceLabel}
          </a>
          {lastModified
            ? ` (Letztes Update: ${new Date(lastModified).toLocaleString()})`
            : ''}
        </p>

        <p>
          *) Die 7-Tage-Inzidenz wird mit einer Einwohnerzahl von{' '}
          {formatNum(areacodes[areacode].population)} errechnet (Quelle:{' '}
          <a href={areacodes[areacode].populationUri}>
            {areacodes[areacode].populationLabel}
          </a>
          ). Das Robert Koch-Institut verwendet für seine Berechnungen z.T.
          abweichende Einwohnerzahlen, somit können sich die Werte
          unterscheiden.
        </p>

        <p>
          <a href='https://github.com/kkkrist/coronastats'>coronastats</a> v
          {version} by{' '}
          <a href='https://mundpropaganda.net'>
            &#123;M/<span style={{ color: '#eb0c00' }}>P</span>&#125;
          </a>
          {' · '}
          <a href='https://mundpropaganda.net/impressum'>Impressum</a>
          {' · '}
          <a href='https://mundpropaganda.net/datenschutzerklaerung'>
            Datenschutzerklärung
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
