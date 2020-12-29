const { compare } = require('fast-json-patch')
const nano = require('nano')
const errorHandler = require('./error-handler')
require('dotenv').config()

const db = nano(process.env.COUCHDB_URI)

const getNewRecord = (newData, oldRecord) => {
  const oldData = Object.keys(oldRecord).reduce(
    (acc, key) =>
      /_id|_rev|history|last_modified/.test(key)
        ? acc
        : {
          ...acc,
          [key]: oldRecord[key]
        },
    {}
  )

  const patch = compare(newData, oldData)

  if (patch.length > 0) {
    return {
      ...oldRecord,
      ...newData,
      history: [...(oldRecord.history || []), patch],
      last_modified: new Date().toISOString()
    }
  }

  return oldRecord
}

const upsert = stats =>
  db.get('_all_docs', { include_docs: true }).then(({ rows }) => {
    const docs = stats
      .reduce(
        (acc, stat) =>
          acc.findIndex(
            ({ areacode, date }) =>
              areacode === stat.areacode && date === stat.date
          ) > -1
            ? acc
            : [...acc, stat],
        []
      )
      .reduce((acc, stat) => {
        const i = acc.findIndex(
          ({ areacode, date }) =>
            areacode === stat.areacode && date === stat.date
        )

        if (i > -1) {
          const newRecord = getNewRecord(stat, acc[i])
          if (newRecord !== acc[i]) {
            acc[i] = newRecord
          }
          return acc
        }

        const row = rows.find(
          ({ doc }) => doc.areacode === stat.areacode && doc.date === stat.date
        )

        if (row) {
          const newRecord = getNewRecord(stat, row.doc)
          if (newRecord !== row.doc) {
            return [...acc, newRecord]
          }
          return acc
        }

        return [
          ...acc,
          {
            ...stat,
            last_modified: new Date().toISOString()
          }
        ]
      }, [])

    if (docs.length > 0) {
      return db.bulk({ docs })
    }

    return Promise.resolve(docs)
  })

Promise.allSettled([
  require('./fl')(),
  // require('./l')(),
  require('./lg')(),
  require('./ks')(),
  require('./od')(),
  require('./plö')(),
  require('./rz')(),
  require('./sl')()
])
  .then(promises => {
    const data = promises
      .filter(p => p.status === 'fulfilled')
      .map(p => p.value)
      .flat()

    const errors = promises
      .filter(p => p.status === 'rejected')
      .map(p => p.reason)
      .flat()

    if (errors.length > 0) {
      errorHandler(errors)
    }

    if (data.length === 0) {
      throw new Error('No data found!')
    }

    return upsert(data)
  })
  .then(docs => {
    const errors = docs.filter(d => d.error)
    const newDocs = docs.filter(d => /^1-/.test(d.rev))
    const updatedDocs = docs.filter(d => d.rev && !/^1-/.test(d.rev))

    console.log(
      `${newDocs.length} inserted, ${updatedDocs.length} updated, ${errors.length} errors`
    )

    if (errors.length > 0) {
      console.log(errors)
    }
  })
  .catch(errorHandler)
