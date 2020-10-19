import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb'
import { ResponsiveLine } from '@nivo/line'
import areacodes from './areacodes.json'
import chartConfig from './chart-config'
import { formatNum, longDate } from './utils'
import { version } from '../package.json'

const db = new PouchDB('coronastats')
const replication = db.replicate.from(
  'https://api.mundpropaganda.net/coronastats',
  { live: true, retry: true }
)

const App = () => {
  const [areacode, setAreacode] = useState(
    new URLSearchParams(window.location.search).get('areacode') || 'fl'
  )
  const [error, setError] = useState()
  const [lastModified, setLastModified] = useState()
  const [repInfo, setRepInfo] = useState()
  const [stats, setStats] = useState([])

  const handlePopstate = ({ state: { areacode } }) => setAreacode(areacode)

  useEffect(() => {
    if (!navigator.onLine) {
      console.info('offline')
    }
    window.addEventListener('online',  console.info)
    window.addEventListener('offline', console.info)
    return () => {
      window.removeEventListener('online',  console.info)
      window.removeEventListener('offline', console.info)
    }
  }, [])

  useEffect(() => {
    replication.on('active', info => console.log('active', info))
    replication.on('change', info => {
      console.log('change', info)
      setRepInfo(info)
    })
    replication.on('denied', error => console.error('denied', error))
    replication.on('error', error => console.error('error', error))
    return () => replication.cancel()
  }, [])

  useEffect(() => {
    setStats([])

    db.query(`areacode/${areacode}`, {
      descending: true,
      include_docs: true
    }).then(
      ({ rows }) => {
        setError()

        setLastModified(
          rows.reduce((timestamp, { value }) => {
            const last_modified = Date.parse(value.last_modified)
            return last_modified > timestamp ? last_modified : timestamp
          }, 0)
        )

        setStats(
          rows.reduce(
            (acc, { value }, index, arr) => {
              acc[0].data.unshift({ x: new Date(value.date), y: value.deaths })

              value.active &&
                acc[1].data.unshift({
                  x: new Date(value.date),
                  y: value.active
                })

              value.recovered &&
                acc[2].data.unshift({
                  x: new Date(value.date),
                  y: value.recovered ?? 0
                })

              if (index < arr.length - 8 && areacodes[areacode].population) {
                const sums = []

                for (let shift = 1; shift < 9; shift++) {
                  if (
                    dayjs(arr[index + shift].value.date).isAfter(
                      dayjs(value.date).set(
                        'date',
                        dayjs(value.date).date() - 9
                      )
                    )
                  ) {
                    sums.push(arr[index + shift].value.infected)
                  }
                }

                if (sums.length > 1) {
                  acc[3].data.unshift({
                    x: new Date(value.date),
                    y: Math.ceil(
                      ((sums[0] - sums[sums.length - 1]) /
                        areacodes[areacode].population) *
                        100000
                    )
                  })
                }
              }

              acc[4].data.unshift({
                x: new Date(value.date),
                y: value.infected
              })

              value.quarantined &&
                acc[5].data.unshift({
                  x: new Date(value.date),
                  y: value.quarantined
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
      },
      error => error.reason !== 'missing' && setError(error)
    )
  }, [areacode, repInfo])

  useEffect(() => {
    const params = `?areacode=${areacode}`

    if (!window.location.search) {
      window.history.replaceState({ areacode }, '', params)
    } else if (window.location.search !== params) {
      window.history.pushState({ areacode }, '', params)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
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
          <a href='https://www.statistik-nord.de/fileadmin/Dokumente/Statistische_Berichte/bevoelkerung/A_I_2_S/A_I_2_vj_194_Zensus_SH.xlsx'>
            Statistikamt Nord
          </a>
          ).
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
