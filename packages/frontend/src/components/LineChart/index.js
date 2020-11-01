import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import Loading from '../Loading'
import areacodes from '../../data/areacodes.json'
import { docs as docsPropTypes } from '../../types/docs'
import config from './config'
import markers from './markers'

const LineChart = ({ areacode, docs }) => {
  const [stats, setStats] = useState([])

  useEffect(() => {
    setStats(
      docs.reduce(
        (acc, doc, index, arr) => {
          acc[0].data.unshift({ x: new Date(doc.date), y: doc.deaths })

          doc.active &&
            acc[1].data.unshift({
              x: new Date(doc.date),
              y: doc.active
            })

          doc.recovered &&
            acc[2].data.unshift({
              x: new Date(doc.date),
              y: doc.recovered ?? 0
            })

          doc.incidence &&
            acc[3].data.unshift({
              x: new Date(doc.date),
              y: doc.incidence ?? 0
            })

          acc[4].data.unshift({
            x: new Date(doc.date),
            y: doc.infected
          })

          doc.quarantined &&
            acc[5].data.unshift({
              x: new Date(doc.date),
              y: doc.quarantined
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
  }, [areacode, docs])

  return docs.length > 0 ? (
    <div
      id='linechart'
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <ResponsiveLine
        data={stats}
        markers={markers[areacodes[areacode].state]}
        {...config}
      />
    </div>
  ) : (
    <Loading />
  )
}

LineChart.propTypes = {
  areacode: PropTypes.string.isRequired,
  docs: docsPropTypes.isRequired
}

export default LineChart
