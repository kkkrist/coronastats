const nano = require('nano')
const errorHandler = require('./error-handler')
require('dotenv').config()

const db = nano(process.env.COUCHDB_URI)

const upsert = stats =>
  db.get('_all_docs', { include_docs: true }).then(({ rows }) => {
    const docs = stats.reduce((acc, stat) => {
      const i = acc.findIndex(
        ({ areacode, date }) =>
          areacode === stat.areacode &&
          date.toISOString() === stat.date.toISOString()
      )

      if (i > -1) {
        acc[i] = {
          ...acc[i],
          ...stat,
          last_modified: new Date().toISOString()
        }
        return acc
      }

      const row = rows.find(
        ({ doc }) =>
          doc.areacode === stat.areacode && doc.date === stat.date.toISOString()
      )

      if (
        row &&
        Object.keys(row.doc)
          .filter(key => !/_id|_rev|date|last_modified/.test(key))
          .every(key => row.doc[key] === stat[key])
      ) {
        return acc
      }

      return [
        ...acc,
        {
          ...(row ? row.doc : {}),
          ...stat,
          last_modified: new Date().toISOString()
        }
      ]
    }, [])

    if (docs.length > 0) {
      return db.bulk({
        docs
      })
    }

    return Promise.resolve(docs)
  })

Promise.allSettled([
  require('./fl')(),
  require('./lg')(),
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
