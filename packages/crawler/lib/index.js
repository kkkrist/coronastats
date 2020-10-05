const nano = require('nano')

const fl = require('./fl')
const rz = require('./rz')
const sl = require('./sl')

require('dotenv').config()

const db = nano(process.env.COUCHDB_URI)

const upsert = stats =>
  db.get('_all_docs', { include_docs: true }).then(({ rows }) =>
    db.bulk({
      docs: stats.map(stat => ({
        ...(rows.find(
          ({ doc }) =>
            doc.areacode === stat.areacode && doc.date === stat.date.toISOString()
        )?.doc || {}),
        ...stat,
        last_modified: new Date().toISOString()
      }))
    })
  )

Promise.all([fl(), rz(), sl()])
  .then(data => upsert(data.flat()))
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
  .catch(console.error)
