import dayjs from 'dayjs'
import React, { Fragment, useEffect, useState } from 'react'
import { linearGradientDef } from '@nivo/core'
import { ResponsiveLine } from '@nivo/line'
import { version } from '../package.json'

const areacodes = {
  fl: {
    population: 96920,
    populationLabel: 'Statistikstelle der Stadt Flensburg',
    populationUri:
      'https://www.flensburg.de/Politik-Verwaltung/Stadtverwaltung/Statistik',
    sourceLabel: 'flensburg.de',
    sourceUri:
      'https://www.flensburg.de/Startseite/Informationen-zum-Coronavirus.php?object=tx,2306.5&ModID=7&FID=2306.20374.1'
  },
  rz: {
    population: 198019,
    populationLabel: 'Statistikamt Nord',
    populationUri:
      'https://www.statistik-nord.de/fileadmin/Dokumente/Statistische_Berichte/bevoelkerung/A_I_2_S/A_I_2_vj_194_Zensus_SH.xlsx',
    sourceLabel: 'kreis-rz.de',
    sourceUri: 'https://www.kreis-rz.de/Corona'
  },
  sl: {
    population: 201156,
    populationLabel: 'Statistikamt Nord',
    populationUri:
      'https://www.statistik-nord.de/fileadmin/Dokumente/Statistische_Berichte/bevoelkerung/A_I_2_S/A_I_2_vj_194_Zensus_SH.xlsx',
    sourceLabel: 'schleswig-flensburg.de',
    sourceUri:
      'https://www.schleswig-flensburg.de/Leben-Soziales/Gesundheit/Coronavirus'
  }
}

const { format: formatNum } = new Intl.NumberFormat('de')

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
    itemHeight: 20,
    itemWidth: 0
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
  format: n => formatNum(n),
  legend: 'Personen',
  legendOffset: -40,
  legendPosition: 'middle',
  orient: 'left',
  tickPadding: 8,
  tickRotation: 0,
  tickSize: 0
}

const axisRight = {
  format: n => formatNum(n),
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

              if (index < arr.length - 6 && areacodes[areacode].population) {
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
              yFormat={formatNum}
              yScale={{ type: 'linear' }}
              {...gradients}
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
          <a href='https://github.com/kkkrist/coronastats'>coronastats</a>{' '}
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
