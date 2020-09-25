import dayjs from 'dayjs'
import React, { Fragment, useEffect, useState } from 'react'
import { linearGradientDef } from '@nivo/core'
import { ResponsiveLine } from '@nivo/line'
import { version } from '../package.json'

const gradients = {
  defs: [
    linearGradientDef('gradientA', [
      { offset: 0, color: 'inherit' },
      { offset: 100, color: 'inherit', opacity: 0.1 }
    ])
  ],
  fill: [{ match: '*', id: 'gradientA' }]
}

const legends = [
  {
    anchor: 'left',
    direction: 'column',
    translateX: 16,
    translateY: -32,
    itemHeight: 20
  }
]

const longDate = d => d.toLocaleDateString()

const margin = { top: 24, right: 48, bottom: 72, left: 64 }

const markers = [
  {
    axis: 'x',
    value: new Date('2020-05-18'),
    lineStyle: { stroke: '#aaa', strokeWidth: 1 },
    legend: 'Erste Lockerungen',
    legendPosition: 'top-right',
    legendOrientation: 'vertical'
  },
  {
    axis: 'x',
    value: new Date('2020-06-29'),
    lineStyle: { stroke: '#aaa', strokeWidth: 1 },
    legend: 'Ferienanfang',
    legendPosition: 'top-right',
    legendOrientation: 'vertical'
  },
  {
    axis: 'x',
    value: new Date('2020-08-10'),
    lineStyle: { stroke: '#aaa', strokeWidth: 1 },
    legend: 'Schulanfang',
    legendPosition: 'top-right',
    legendOrientation: 'vertical'
  },
  {
    axis: 'y',
    value: 50,
    legend: 'Grenzwert für 7-Tage-Inzidenz',
    legendPosition: 'top',
    lineStyle: { stroke: '#aaa', strokeWidth: 1 }
  }
]

const shortDate = d => `${d.getDate()}.${d.getMonth() + 1}.`

const axisBottom = {
  format: shortDate,
  legend: 'Zeitverlauf',
  legendOffset: 48,
  legendPosition: 'middle',
  tickSize: 8
}

const axisLeft = {
  legend: 'Personen',
  legendOffset: -40,
  legendPosition: 'middle',
  orient: 'left',
  tickPadding: 8,
  tickRotation: 0,
  tickSize: 0
}

const axisRight = {
  orient: 'right',
  tickPadding: 8,
  tickSize: 0
}

const sliceTooltip = ({ slice: { points } }) => (
  <table className='slice-tooltip'>
    {points.map((point, index) => (
      <Fragment key={point.id}>
        {!index && (
          <thead>
            <tr>
              <th colSpan={3}>
                <span>{point.data.xFormatted}</span>
              </th>
            </tr>
          </thead>
        )}
        <tbody>
          <tr>
            <td>
              <span
                className='color'
                style={{ backgroundColor: point.serieColor }}
              />
            </td>
            <td>{point.serieId}</td>
            <td>{point.data.yFormatted}</td>
          </tr>
        </tbody>
      </Fragment>
    ))}
  </table>
)

const App = () => {
  const [error, setError] = useState()
  const [stats, setStats] = useState([])

  useEffect(() => {
    window
      .fetch('https://jsonbin.mundpropaganda.net/kkkrist/coronastats-fl/')
      .then(res => res.json())
      .then(data => {
        setError()
        setStats(
          data.reduce(
            (acc, cur, index, arr) => {
              acc[0].data.unshift({ x: new Date(cur.date), y: cur.deaths })
              acc[1].data.unshift({ x: new Date(cur.date), y: cur.active })
              acc[2].data.unshift({ x: new Date(cur.date), y: cur.recovered })

              if (index < arr.length - 6) {
                const sums = [cur.infected]

                for (let shift = 0; shift < 7; shift++) {
                  if (
                    dayjs(arr[index + shift].date).isAfter(
                      dayjs(cur.date).set('date', dayjs(cur.date).date() - 7)
                    )
                  ) {
                    sums.push(arr[index + shift].infected)
                  }
                }

                if (sums.length > 1) {
                  acc[3].data.unshift({
                    x: new Date(cur.date),
                    y: Math.round(
                      ((sums[0] - sums[sums.length - 1]) / 96920) * 100000
                    )
                  })
                }
              }

              acc[4].data.unshift({ x: new Date(cur.date), y: cur.infected })
              acc[5].data.unshift({ x: new Date(cur.date), y: cur.quarantined })

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
                id: '7-Tage-Inzidenz',
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
  }, [])

  if (error) {
    console.log(error)
  }

  return (
    <div id='app'>
      <h1>Zeitverlauf der Corona-Fälle in Flensburg</h1>

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
              axisBottom={axisBottom}
              axisLeft={axisLeft}
              axisRight={axisRight}
              colors={a => a.color || '#000'}
              data={stats}
              enableArea
              enableGridX={false}
              enableGridY={false}
              enablePoints={false}
              enableSlices='x'
              legends={legends}
              margin={margin}
              markers={markers}
              sliceTooltip={sliceTooltip}
              xFormat={longDate}
              xScale={{ type: 'time' }}
              yScale={{ type: 'linear' }}
              {...gradients}
            />
          )}
        </div>
      </div>

      <footer>
        <p>
          Datenquelle:{' '}
          <a href='https://www.flensburg.de/Startseite/Informationen-zum-Coronavirus.php?object=tx,2306.5&ModID=7&FID=2306.20374.1'>
            flensburg.de
          </a>
          . Die 7-Tage-Inzidenz wird mit einer Einwohnerzahl von 96.920
          errechnet (Quelle:{' '}
          <a href='https://www.flensburg.de/Politik-Verwaltung/Stadtverwaltung/Statistik'>
            Statistikstelle der Stadt Flensburg
          </a>
          , Stichtag 31.12.2019). Das Robert Koch-Institut verwendet für seine
          Berechnungen eine Einwohnerzahl von 89.504, somit unterscheiden sich
          die Werte. (Stand 25.09.2019)
        </p>

        <p>
          <a href='https://github.com/kkkrist/coronastats-fl'>coronastats-fl</a>{' '}
          v{version} by{' '}
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
