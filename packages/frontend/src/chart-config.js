import React, { Fragment } from 'react'
import { linearGradientDef } from '@nivo/core'
import { formatNum, longDate, shortDate } from './utils'

const chartConfig = {
  areaBlendMode: 'darken',
  axisBottom: {
    format: shortDate,
    legend: 'Zeitverlauf',
    legendOffset: 48,
    legendPosition: 'middle',
    tickSize: 8
  },
  axisLeft: {
    format: n => formatNum(n),
    legend: 'Personen',
    legendOffset: -40,
    legendPosition: 'middle',
    orient: 'left',
    tickPadding: 8,
    tickRotation: 0,
    tickSize: 0
  },
  axisRight: {
    format: n => formatNum(n),
    orient: 'right',
    tickPadding: 8,
    tickSize: 0
  },
  colors: a => a.color || '#000',
  defs: [
    linearGradientDef('gradientA', [
      { offset: 0, color: 'inherit' },
      { offset: 100, color: 'inherit', opacity: 0.1 }
    ])
  ],
  enableArea: true,
  enableGridX: false,
  enableGridY: false,
  enablePoints: false,
  enableSlices: 'x',
  fill: [{ match: '*', id: 'gradientA' }],
  legends: [
    {
      anchor: 'left',
      direction: 'column',
      translateX: 16,
      translateY: -32,
      itemHeight: 20,
      itemWidth: 0
    }
  ],
  margin: { top: 24, right: 48, bottom: 72, left: 64 },
  markers: [
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
      axis: 'x',
      value: new Date('2020-10-05'),
      lineStyle: { stroke: '#aaa', strokeWidth: 1 },
      legend: 'Ferienanfang',
      legendPosition: 'top-right',
      legendOrientation: 'vertical'
    },
    {
      axis: 'y',
      value: 50,
      legend: 'Grenzwert für 7-Tage-Inzidenz',
      legendPosition: 'top-right',
      lineStyle: { stroke: '#aaa', strokeWidth: 1 }
    }
  ],
  sliceTooltip: ({ slice: { points } }) => (
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
  ),
  xFormat: longDate,
  xScale: { type: 'time' },
  yFormat: formatNum,
  yScale: { type: 'linear' }
}

export default chartConfig
