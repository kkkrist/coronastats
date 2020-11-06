import React, { useEffect, useState } from 'react'
import BaseTable, { AutoResizer, Column, SortOrder } from 'react-base-table'
import { docs as docsPropTypes } from '../../types/docs'
import columns from './columns'
import IconArrowDownRight from '../IconArrowDownRight'
import IconArrowUpRight from '../IconArrowUpRight'
import IconDot from '../IconDot'
import { shortDate } from '../../utils/display'
import './styles.css'

const initialSort = { key: 'date', order: SortOrder.DESC }

const getClassName = ({ rowData: { forecast } }) =>
  forecast ? 'is-forecast' : undefined

const getColWidth = (innerWidth, numCols) => {
  const newColWidth = (innerWidth - 80) / numCols
  return newColWidth > 125 ? newColWidth : 125
}

const getIcon = diff => {
  if (diff < 0) {
    return IconArrowDownRight
  }

  if (diff > 0) {
    return IconArrowUpRight
  }

  return IconDot
}

const getFill = (diff, key) => {
  if (diff < 0 || (diff > 0 && key === 'recovered')) {
    return '#76CE6D'
  }

  if (diff > 0 || (diff < 0 && key === 'recovered')) {
    return '#FA5C3A'
  }
}

const Table = ({ docs }) => {
  const [colWidth, setColWidth] = useState(
    getColWidth(window.innerWidth, columns.length)
  )
  const [data, setData] = useState(docs)
  const [sortBy, setSortBy] = useState(initialSort)

  const Cell = ({ column: { key }, rowData: { _id } }) => {
    const docIndex = docs.findIndex(doc => doc._id === _id)

    if (docIndex < 0) {
      return null
    }

    if (key === 'date') {
      return shortDate(new Date(docs[docIndex][key]))
    }

    if (
      [null, ''].includes(docs[docIndex][key]) ||
      isNaN(docs[docIndex][key])
    ) {
      return docs[docIndex][key] ?? ''
    }

    if (
      docIndex < docs.length - 1 &&
      !isNaN(docs[docIndex + 1][key]) &&
      (docs[docIndex + 1][key] !== undefined ||
        docs[docIndex + 1][key] !== null)
    ) {
      let diff = docs[docIndex][key] - docs[docIndex + 1][key]

      if (!Number.isInteger(diff)) {
        diff = diff.toFixed(1)
      }

      if (diff > 0) {
        diff = '+' + diff
      }

      const Icon = getIcon(diff)

      return (
        <div className='BaseTable__row-cell-number'>
          <div>{docs[docIndex][key]}</div>
          <div>
            <Icon style={{ fill: getFill(diff, key) }} width={12} />
          </div>
          <div>({diff})</div>
        </div>
      )
    }

    return docs[docIndex][key] ?? ''
  }

  useEffect(() => {
    setData(
      [...docs].sort((a, b) => {
        const doc1 = sortBy.order === 'desc' ? b : a
        const doc2 = sortBy.order === 'desc' ? a : b

        if (isNaN(doc1[sortBy.key]) || isNaN(doc2[sortBy.key])) {
          return (doc1[sortBy.key] ?? '').localeCompare(doc2[sortBy.key] ?? '')
        }

        return doc1[sortBy.key] - doc2[sortBy.key]
      })
    )
  }, [docs, sortBy])

  useEffect(() => {
    const handleResize = ({ target: { innerWidth } }) => {
      setColWidth(getColWidth(innerWidth, columns.length))
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div id='tableview'>
      <AutoResizer>
        {autoProps => (
          <BaseTable
            components={{ TableCell: Cell }}
            data={data}
            fixed
            onColumnSort={setSortBy}
            rowHeight={33}
            rowKey='_id'
            sortBy={sortBy}
            {...autoProps}
          >
            {columns.map(column => (
              <Column {...column} className={getClassName} width={colWidth} />
            ))}
          </BaseTable>
        )}
      </AutoResizer>
      )}
    </div>
  )
}

Table.propTypes = {
  docs: docsPropTypes.isRequired
}

export default Table
